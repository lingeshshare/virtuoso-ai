'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Mic, FileAudio, X, Loader2, AlertCircle, CheckCircle2, Square } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'

const ACCEPTED_FORMATS = ['.mp3', '.wav', '.m4a', '.ogg', '.flac', '.aiff', '.webm']
const MAX_FILE_SIZE_MB = 200

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error'
type RecordState = 'idle' | 'requesting' | 'recording'

interface UploadZoneProps {
  className?: string
}

function getBestMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]
  for (const t of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t
  }
  return ''
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function UploadZone({ className }: UploadZoneProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Recording state
  const [recordState, setRecordState] = useState<RecordState>('idle')
  const [recordingSeconds, setRecordingSeconds] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleFile = useCallback((f: File) => {
    setValidationError(null)
    setUploadError(null)
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!ACCEPTED_FORMATS.includes(ext)) {
      setValidationError(`Unsupported format. Please use: ${ACCEPTED_FORMATS.join(', ')}`)
      return
    }
    const sizeMB = f.size / 1024 / 1024
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setValidationError(`File too large. Maximum size is ${MAX_FILE_SIZE_MB}MB.`)
      return
    }
    setFile(f)
    setUploadState('idle')
  }, [])

  const startRecording = useCallback(async () => {
    setRecordState('requesting')
    setValidationError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getBestMimeType()
      const recOptions = mimeType ? { mimeType } : {}
      const mediaRecorder = new MediaRecorder(stream, recOptions)
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        const usedMime = mediaRecorder.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type: usedMime })
        let ext = 'webm'
        if (usedMime.includes('ogg')) ext = 'ogg'
        if (usedMime.includes('mp4')) ext = 'm4a'
        const recorded = new File(
          [blob],
          `live-recording-${Date.now()}.${ext}`,
          { type: usedMime }
        )
        handleFile(recorded)
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start(250)
      setRecordState('recording')
      setRecordingSeconds(0)
      timerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000)
    } catch (err) {
      setRecordState('idle')
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setValidationError('Microphone access denied. Allow microphone access in your browser settings and try again.')
      } else {
        setValidationError('Could not access microphone. Check your device settings.')
      }
    }
  }, [handleFile])

  const stopRecording = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    mediaRecorderRef.current?.stop()
    mediaRecorderRef.current = null
    setRecordState('idle')
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFile(droppedFile)
    },
    [handleFile]
  )

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    if (picked) handleFile(picked)
  }

  const handleSubmit = async () => {
    if (!file) return

    setUploadState('uploading')
    setUploadProgress(0)
    setUploadError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', file.name.replace(/\.[^.]+$/, ''))

      const recordingId = await new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 85))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data.recordingId)
            } catch {
              reject(new Error('Invalid server response'))
            }
          } else {
            try {
              const data = JSON.parse(xhr.responseText)
              reject(new Error(data.error ?? `Upload failed (${xhr.status})`))
            } catch {
              reject(new Error(`Upload failed (${xhr.status})`))
            }
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))

        xhr.open('POST', '/api/recordings/upload')
        xhr.send(formData)
      })

      setUploadProgress(100)
      setUploadState('processing')
      router.push(`/dashboard/recordings/${recordingId}`)
    } catch (err) {
      setUploadState('error')
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const isUploading = uploadState === 'uploading' || uploadState === 'processing'
  const isRecording = recordState === 'recording'

  return (
    <div className={cn('space-y-4', className)}>
      {!file ? (
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer',
            isDragging
              ? 'border-violet-500 bg-violet-950/20 shadow-glow-violet'
              : 'border-border-strong hover:border-violet-500/40 hover:bg-surface-raised bg-surface-DEFAULT'
          )}
        >
          <input
            type="file"
            accept={ACCEPTED_FORMATS.join(',')}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onFileInput}
          />

          <div
            className={cn(
              'w-14 h-14 rounded-2xl flex items-center justify-center transition-colors',
              isDragging ? 'bg-violet-500/20' : 'bg-surface-overlay'
            )}
          >
            <Upload
              className={cn(
                'w-6 h-6 transition-colors',
                isDragging ? 'text-violet-400' : 'text-zinc-400'
              )}
            />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-white mb-1">
              Drop your audio file here, or <span className="text-violet-400">browse</span>
            </p>
            <p className="text-xs text-zinc-500">
              {ACCEPTED_FORMATS.join(' · ')} · Up to {MAX_FILE_SIZE_MB}MB
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border-DEFAULT bg-surface-DEFAULT overflow-hidden">
          <div className="flex items-center gap-4 p-4">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
              uploadState === 'done' ? 'bg-emerald-500/15' : 'bg-violet-500/15'
            )}>
              {uploadState === 'done' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <FileAudio className="w-5 h-5 text-violet-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{file.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{formatBytes(file.size)}</p>
            </div>
            {!isUploading && (
              <button
                onClick={() => { setFile(null); setValidationError(null); setUploadError(null); setUploadState('idle') }}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-overlay transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isUploading && (
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-zinc-400">
                  {uploadState === 'uploading' ? 'Uploading…' : 'Processing…'}
                </span>
                <span className="text-xs text-zinc-500">{uploadProgress}%</span>
              </div>
              <div className="h-1 w-full bg-surface-overlay rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {validationError && (
        <div className="flex items-start gap-2 text-sm text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/8 border border-rose-500/20">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-rose-300">{uploadError}</p>
            <button
              onClick={() => { setUploadState('idle'); setUploadError(null) }}
              className="text-xs text-rose-400 hover:text-rose-300 mt-1 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border-DEFAULT" />
        <span className="text-xs text-zinc-600 font-medium">or</span>
        <div className="flex-1 h-px bg-border-DEFAULT" />
      </div>

      {/* Record from mic */}
      {isRecording ? (
        <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/30 bg-rose-500/5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-white">Recording…</p>
            <p className="text-xs text-zinc-400 tabular-nums">{formatTime(recordingSeconds)}</p>
          </div>
          <button
            onClick={stopRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-medium transition-colors"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </button>
        </div>
      ) : (
        <button
          onClick={startRecording}
          disabled={isUploading || recordState === 'requesting'}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border-DEFAULT hover:border-violet-500/40 hover:bg-surface-raised bg-surface-DEFAULT transition-all group disabled:opacity-50"
        >
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0">
            <Mic className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-white">
              {recordState === 'requesting' ? 'Requesting microphone…' : 'Record directly'}
            </p>
            <p className="text-xs text-zinc-500">Use your microphone to record live</p>
          </div>
        </button>
      )}

      {/* Submit */}
      {file && uploadState === 'idle' && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleSubmit}
          className="mt-2"
        >
          Analyze Recording
        </Button>
      )}

      {isUploading && (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled
          className="mt-2"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          {uploadState === 'uploading' ? 'Uploading…' : 'Starting analysis…'}
        </Button>
      )}
    </div>
  )
}
