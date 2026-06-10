import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

type Params = { params: Promise<{ id: string }> }

const ALLOWED_TYPES: Record<string, string> = {
  'application/pdf': 'pdf',
  'audio/midi': 'midi',
  'audio/mid': 'midi',
  'audio/x-midi': 'midi',
  'text/xml': 'musicxml',
  'application/xml': 'musicxml',
  'application/vnd.recordare.musicxml+xml': 'musicxml',
  'application/vnd.recordare.musicxml': 'mxl',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heic',
}

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.xml', '.musicxml', '.mid', '.midi', '.mxl',
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif',
])

// POST /api/recordings/[id]/reference — attach a reference material to a recording
export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify recording ownership
  const { data: rec } = await supabase
    .from('recordings')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!rec) return NextResponse.json({ error: 'Recording not found' }, { status: 404 })

  // Parse multipart form
  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const materialType = (formData.get('material_type') as string | null) ?? 'score'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate extension
  const ext = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: PDF, MusicXML, MIDI, or image (JPG, PNG, WEBP)` },
      { status: 400 }
    )
  }

  // Validate size (20MB max for reference materials)
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 20MB)' }, { status: 400 })
  }

  const fileType = ALLOWED_TYPES[file.type] ?? ext.slice(1)
  const storagePath = `${user.id}/references/${id}/${Date.now()}_${file.name}`

  const svc = await createServiceClient()

  // Upload to Supabase Storage (recordings bucket, references subfolder)
  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadErr } = await svc.storage
    .from('recordings')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    })

  if (uploadErr) {
    return NextResponse.json({ error: `Upload failed: ${uploadErr.message}` }, { status: 500 })
  }

  // Insert reference_materials record
  const { data: refRow, error: dbErr } = await svc
    .from('reference_materials')
    .insert({
      recording_id: id,
      user_id: user.id,
      file_path: storagePath,
      file_name: file.name,
      file_type: fileType,
      material_type: materialType,
    })
    .select()
    .single()

  if (dbErr) {
    // Clean up storage on DB failure
    await svc.storage.from('recordings').remove([storagePath])
    return NextResponse.json({ error: `Failed to save reference: ${dbErr.message}` }, { status: 500 })
  }

  return NextResponse.json({ reference: refRow }, { status: 201 })
}

// GET /api/recordings/[id]/reference — list reference materials for a recording
export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership
  const { data: rec } = await supabase
    .from('recordings')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!rec) return NextResponse.json({ error: 'Recording not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('reference_materials')
    .select('id, file_name, file_type, material_type, created_at')
    .eq('recording_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ materials: data ?? [] })
}

// DELETE /api/recordings/[id]/reference?material_id=xxx
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params
  const materialId = new URL(req.url).searchParams.get('material_id')
  if (!materialId) return NextResponse.json({ error: 'material_id required' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: mat } = await supabase
    .from('reference_materials')
    .select('id, file_path, user_id')
    .eq('id', materialId)
    .eq('recording_id', id)
    .single()

  if (!mat || mat.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const svc = await createServiceClient()
  await svc.storage.from('recordings').remove([mat.file_path])
  await svc.from('reference_materials').delete().eq('id', materialId)

  return NextResponse.json({ success: true })
}
