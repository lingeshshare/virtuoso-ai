import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const ACCEPTED_MIME_TYPES = new Set([
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav',
  'audio/mp4', 'audio/m4a', 'audio/x-m4a', 'audio/ogg', 'audio/flac',
  'audio/x-flac', 'audio/aiff', 'audio/x-aiff', 'audio/webm',
  'video/mp4', 'video/quicktime', 'video/x-m4v', 'video/3gpp', 'video/mov',
  'application/octet-stream',
])
const ACCEPTED_EXTENSIONS = /\.(mp3|wav|m4a|ogg|flac|aiff|webm|mp4|mov|m4v|3gp)$/i
const MAX_SIZE_BYTES = 200 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { filename, fileSize, mimeType, title } = await req.json()

    // Strip codec params: 'audio/webm;codecs=opus' → 'audio/webm'
    const baseMime = (mimeType ?? '').split(';')[0].trim()
    const isValidMime = ACCEPTED_MIME_TYPES.has(baseMime) || baseMime === ''
    const isValidExt = ACCEPTED_EXTENSIONS.test(filename ?? '')

    if (!isValidMime && !isValidExt) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use MP3, WAV, M4A, OGG, FLAC, or AIFF.' },
        { status: 400 }
      )
    }
    if (fileSize > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File too large. Maximum size is 200 MB.' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('instrument')
      .eq('id', user.id)
      .single()
    const instrument = profile?.instrument ?? 'unknown'

    const recordingId = randomUUID()
    const ext = (filename ?? 'audio').split('.').pop()?.toLowerCase() ?? 'audio'
    const filePath = `${user.id}/${recordingId}/audio.${ext}`
    const contentType = baseMime || `audio/${ext}`

    // Service client needed to create signed upload URL for a private bucket
    const serviceClient = await createServiceClient()
    const { data: signedUpload, error: signedError } = await serviceClient.storage
      .from('recordings')
      .createSignedUploadUrl(filePath)

    if (signedError || !signedUpload) {
      console.error('Signed upload URL error:', signedError)
      return NextResponse.json({ error: 'Failed to prepare upload.' }, { status: 500 })
    }

    const { error: dbError } = await supabase.from('recordings').insert({
      id: recordingId,
      user_id: user.id,
      title: title ?? (filename ?? 'Recording').replace(/\.[^/.]+$/, ''),
      instrument,
      file_path: filePath,
      file_url: null,
      file_size_bytes: fileSize,
      mime_type: contentType,
      status: 'uploading',
    })

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    return NextResponse.json({
      recordingId,
      uploadUrl: signedUpload.signedUrl,
      filePath,
      contentType,
    })
  } catch (err) {
    console.error('Prepare route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
