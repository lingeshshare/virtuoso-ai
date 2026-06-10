// Recording CRUD helpers for use in Client Components.
// Server Components should call Supabase directly via createClient() from server.ts.

import { createClient } from '@/lib/supabase/client'
import type { Recording } from '@/lib/supabase/types'

export interface RecordingWithReport extends Recording {
  feedback_reports?: Array<{
    id: string
    overall_score: number | null
    estimated_level: string | null
    created_at: string
  }>
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchRecordings(): Promise<RecordingWithReport[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recordings')
    .select(`
      *,
      feedback_reports (
        id,
        overall_score,
        estimated_level,
        created_at
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as RecordingWithReport[]
}

export async function fetchRecording(id: string): Promise<RecordingWithReport | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('recordings')
    .select(`
      *,
      feedback_reports (*),
      audio_metrics (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // not found
    throw new Error(error.message)
  }
  return data as RecordingWithReport
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadResult {
  recordingId: string
  fileUrl: string
}

export async function uploadRecording(
  file: File,
  title?: string,
  onProgress?: (pct: number) => void
): Promise<UploadResult> {
  const formData = new FormData()
  formData.append('file', file)
  if (title) formData.append('title', title)

  // Simulate progress since fetch doesn't support progress natively
  onProgress?.(10)

  const res = await fetch('/api/recordings/upload', {
    method: 'POST',
    body: formData,
  })

  onProgress?.(90)

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Upload failed' }))
    throw new Error(body.error ?? 'Upload failed')
  }

  const { recording } = await res.json()
  onProgress?.(100)

  return { recordingId: recording.id, fileUrl: recording.file_url }
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export async function updateRecordingTitle(id: string, title: string) {
  const supabase = createClient()
  const { error } = await supabase.from('recordings').update({ title }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteRecording(id: string) {
  const supabase = createClient()

  // Fetch the file path first so we can clean up storage
  const { data: rec } = await supabase
    .from('recordings')
    .select('file_path')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('recordings').delete().eq('id', id)
  if (error) throw new Error(error.message)

  // Remove from storage (best-effort — RLS handles auth)
  if (rec?.file_path) {
    await supabase.storage.from('recordings').remove([rec.file_path])
  }
}

// ─── Polling ──────────────────────────────────────────────────────────────────

// Poll a recording until its status is no longer 'uploading' or 'processing'.
// Returns when the recording is analyzed or errored, or throws after timeout.
export async function waitForAnalysis(
  id: string,
  onStatus?: (status: string) => void,
  timeoutMs = 120_000
): Promise<Recording> {
  const supabase = createClient()
  const deadline = Date.now() + timeoutMs
  const INTERVAL = 2000

  while (Date.now() < deadline) {
    const { data, error } = await supabase
      .from('recordings')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw new Error(error.message)
    onStatus?.(data.status)

    if (data.status === 'analyzed' || data.status === 'error') return data

    await new Promise((r) => setTimeout(r, INTERVAL))
  }

  throw new Error('Analysis timed out after 2 minutes')
}
