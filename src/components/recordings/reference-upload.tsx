'use client'

import { useState, useRef, useCallback } from 'react'
import { FileText, Upload, X, Music, FileMusic, Camera, Image } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface ReferenceMaterial {
  id: string
  file_name: string
  file_type: string
  material_type: string
  created_at: string
}

interface ReferenceUploadProps {
  recordingId: string
  initialMaterials?: ReferenceMaterial[]
}

const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-rose-400" />,
  musicxml: <Music className="w-4 h-4 text-blue-400" />,
  mxl: <Music className="w-4 h-4 text-blue-400" />,
  midi: <FileMusic className="w-4 h-4 text-violet-400" />,
  mid: <FileMusic className="w-4 h-4 text-violet-400" />,
  jpg: <Image className="w-4 h-4 text-emerald-400" />,
  jpeg: <Image className="w-4 h-4 text-emerald-400" />,
  png: <Image className="w-4 h-4 text-emerald-400" />,
  webp: <Image className="w-4 h-4 text-emerald-400" />,
  heic: <Image className="w-4 h-4 text-emerald-400" />,
}

const MATERIAL_TYPE_LABELS: Record<string, string> = {
  score: 'Full Score',
  excerpt: 'Excerpt',
  audition_packet: 'Audition Packet',
}

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic'])

export function ReferenceUpload({ recordingId, initialMaterials = [] }: ReferenceUploadProps) {
  const [materials, setMaterials] = useState<ReferenceMaterial[]>(initialMaterials)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [materialType, setMaterialType] = useState<'score' | 'excerpt' | 'audition_packet'>('score')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (file: File) => {
    setUploading(true)
    setError(null)

    const form = new FormData()
    form.append('file', file)
    form.append('material_type', materialType)

    try {
      const res = await fetch(`/api/recordings/${recordingId}/reference`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Upload failed')
      setMaterials((prev) => [data.reference, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }, [recordingId, materialType])

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return
    uploadFile(files[0])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleDelete = async (id: string) => {
    setDeleteError(null)
    try {
      const res = await fetch(`/api/recordings/${recordingId}/reference?material_id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Delete failed')
      }
      setMaterials((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Could not remove file. Try again.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Reference Material</p>
        <select
          value={materialType}
          onChange={(e) => setMaterialType(e.target.value as 'score' | 'excerpt' | 'audition_packet')}
          className="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-zinc-300 focus:outline-none focus:border-zinc-500"
        >
          <option value="score">Full Score</option>
          <option value="excerpt">Excerpt</option>
          <option value="audition_packet">Audition Packet</option>
        </select>
      </div>

      {/* Existing materials */}
      {materials.length > 0 && (
        <div className="space-y-2">
          {materials.map((mat) => {
            const isImage = IMAGE_EXTS.has('.' + mat.file_type.toLowerCase())
            return (
              <div
                key={mat.id}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg"
              >
                {FILE_ICONS[mat.file_type.toLowerCase()] ?? <FileText className="w-4 h-4 text-zinc-500" />}
                <span className="text-xs text-zinc-300 flex-1 truncate">{mat.file_name}</span>
                {isImage && (
                  <span className="text-[9px] text-emerald-500 font-medium uppercase tracking-widest shrink-0">Photo</span>
                )}
                <Badge variant="default" className="text-[10px] shrink-0">
                  {MATERIAL_TYPE_LABELS[mat.material_type] ?? mat.material_type}
                </Badge>
                <button
                  onClick={() => handleDelete(mat.id)}
                  className="text-zinc-600 hover:text-zinc-400 transition-colors ml-1"
                  aria-label="Remove"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {deleteError && <p className="text-xs text-rose-400">{deleteError}</p>}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".pdf,.xml,.musicxml,.mid,.midi,.mxl,.jpg,.jpeg,.png,.webp,.heic"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {/* Camera input — opens camera on mobile, file picker on desktop */}
      <input
        ref={cameraInputRef}
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={[
          'relative border border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-500/5'
            : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50',
          uploading ? 'pointer-events-none opacity-60' : '',
        ].join(' ')}
      >
        <Upload className="w-5 h-5 text-zinc-500 mx-auto mb-2" />
        <p className="text-xs text-zinc-400">
          {uploading ? 'Uploading…' : 'Drop PDF, MusicXML, MIDI, or image'}
        </p>
        <p className="text-[10px] text-zinc-600 mt-0.5">Score-aware feedback when attached</p>
      </div>

      {/* Camera / photo button */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        disabled={uploading}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-700 hover:border-zinc-500 hover:bg-zinc-900/50 transition-colors disabled:opacity-50 text-left"
      >
        <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
        <div>
          <p className="text-xs font-medium text-zinc-300">Take a photo of sheet music</p>
          <p className="text-[10px] text-zinc-600">Opens camera on mobile · picks image on desktop</p>
        </div>
      </button>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}
