import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'

const ACCEPTED_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/mp4',
  'audio/m4a',
  'audio/x-m4a',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/aiff',
  'audio/x-aiff',
  'audio/webm',
])

const ACCEPTED_EXTENSIONS = /\.(mp3|wav|m4a|ogg|flac|aiff|webm)$/i
const MAX_SIZE_BYTES = 200 * 1024 * 1024 // 200 MB

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string | null) ?? null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate MIME type and extension
    const isValidMime = ACCEPTED_MIME_TYPES.has(file.type) || file.type === 'application/octet-stream'
    const isValidExt = ACCEPTED_EXTENSIONS.test(file.name)
    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use MP3, WAV, M4A, OGG, FLAC, or AIFF.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 200 MB.` },
        { status: 400 }
      )
    }

    // Fetch user profile to get instrument
    const { data: profile } = await supabase
      .from('profiles')
      .select('instrument')
      .eq('id', user.id)
      .single()

    const instrument = profile?.instrument ?? 'unknown'

    // Generate IDs and paths
    const recordingId = randomUUID()
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'audio'
    const filePath = `${user.id}/${recordingId}/audio.${ext}`

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer()
    const { error: storageError } = await supabase.storage
      .from('recordings')
      .upload(filePath, arrayBuffer, {
        contentType: file.type || `audio/${ext}`,
        upsert: false,
      })

    if (storageError) {
      console.error('Storage upload error:', storageError)
      return NextResponse.json(
        { error: `Storage error: ${storageError.message}` },
        { status: 500 }
      )
    }

    // Get the signed URL (private bucket — generate signed URL valid for 24h)
    const { data: signedUrlData } = await supabase.storage
      .from('recordings')
      .createSignedUrl(filePath, 60 * 60 * 24) // 24 hours

    // Create recording record
    const { data: recording, error: dbError } = await supabase
      .from('recordings')
      .insert({
        id: recordingId,
        user_id: user.id,
        title: title ?? file.name.replace(/\.[^/.]+$/, ''),
        instrument,
        file_path: filePath,
        file_url: signedUrlData?.signedUrl ?? null,
        file_size_bytes: file.size,
        mime_type: file.type || `audio/${ext}`,
        status: 'uploading',
      })
      .select()
      .single()

    if (dbError) {
      // Clean up the uploaded file on DB failure
      await supabase.storage.from('recordings').remove([filePath])
      console.error('DB insert error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    // Fire-and-forget: trigger audio analysis in the background.
    // The client polls recording status; this route returns immediately.
    const analyzeUrl = new URL(`/api/recordings/${recordingId}/analyze`, req.url)
    fetch(analyzeUrl.toString(), { method: 'POST' }).catch((err) =>
      console.error(`[upload] Failed to trigger analysis for ${recordingId}:`, err)
    )

    return NextResponse.json({ recordingId, fileUrl: signedUrlData?.signedUrl ?? null }, { status: 201 })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
