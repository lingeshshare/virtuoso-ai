import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: recording, error: recError } = await supabase
      .from('recordings')
      .select('id, file_path, user_id, status')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (recError || !recording) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }

    // Generate signed download URL valid 24h (used by audio analysis service)
    const serviceClient = await createServiceClient()
    const { data: signedUrl } = await serviceClient.storage
      .from('recordings')
      .createSignedUrl(recording.file_path, 60 * 60 * 24)

    await supabase.from('recordings').update({
      file_url: signedUrl?.signedUrl ?? null,
      status: 'processing',
    }).eq('id', id)

    // Fire-and-forget analysis trigger
    const analyzeUrl = new URL(`/api/recordings/${id}/analyze`, req.url)
    fetch(analyzeUrl.toString(), { method: 'POST' }).catch((err) =>
      console.error(`[finalize] Failed to trigger analysis for ${id}:`, err)
    )

    return NextResponse.json({ recordingId: id })
  } catch (err) {
    console.error('Finalize route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
