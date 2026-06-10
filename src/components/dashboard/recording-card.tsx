'use client'

import Link from 'next/link'
import { Calendar, Clock, ChevronRight, BarChart3, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'

interface RecordingCardProps {
  id: string
  instrument: string
  title?: string
  date: string
  duration: string
  score: number | null
  level: string
  status: 'uploading' | 'processing' | 'analyzed' | 'error'
}

const levelBadgeVariant = (level: string) => {
  if (['All-State', 'Conservatory', 'Professional'].includes(level)) return 'violet' as const
  if (['Region', 'Area'].includes(level)) return 'amber' as const
  if (level === 'College') return 'blue' as const
  return 'default' as const
}

const scoreColor = (score: number) => {
  if (score >= 80) return 'emerald'
  if (score >= 60) return 'violet'
  if (score >= 40) return 'amber'
  return 'rose'
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function RecordingCard({
  id,
  instrument,
  title,
  date,
  duration,
  score,
  level,
  status,
}: RecordingCardProps) {
  const isProcessing = status === 'uploading' || status === 'processing'
  const isError = status === 'error'

  return (
    <Card interactive className="group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-white truncate">
                {title ?? instrument}
              </span>
              {title && (
                <span className="text-xs text-zinc-500 flex-shrink-0">— {instrument}</span>
              )}
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs text-zinc-500 mb-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(date)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {duration}
              </span>
              <Badge variant={levelBadgeVariant(level)} className="text-[10px]">
                {level}
              </Badge>
            </div>

            {/* Score bar */}
            {status === 'analyzed' && score != null && score > 0 && (
              <div className="flex items-center gap-3">
                <Progress
                  value={score}
                  color={scoreColor(score) as 'emerald' | 'violet' | 'amber' | 'rose'}
                  size="md"
                  className="flex-1"
                />
                <span
                  className={cn(
                    'text-sm font-bold tabular-nums flex-shrink-0',
                    score >= 80
                      ? 'text-emerald-400'
                      : score >= 60
                      ? 'text-violet-300'
                      : score >= 40
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  )}
                >
                  {score}
                </span>
              </div>
            )}
            {status === 'analyzed' && (score == null || score === 0) && (
              <span className="text-xs text-zinc-500">Feedback generating…</span>
            )}

            {isProcessing && (
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-3 h-3 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                Analyzing recording…
              </div>
            )}

            {isError && (
              <span className="text-xs text-rose-400">Analysis failed — please re-upload</span>
            )}
          </div>

          {/* Actions — always visible on mobile, hover-reveal on desktop */}
          {status === 'analyzed' && (
            <div className="flex items-center gap-1 flex-shrink-0 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <Link
                href={`/dashboard/recordings/${id}/feedback`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-overlay transition-all"
                title="View feedback"
              >
                <BarChart3 className="w-4 h-4" />
              </Link>
              <Link
                href={`/dashboard/recordings/${id}/practice`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-overlay transition-all"
                title="View practice plan"
              >
                <FileText className="w-4 h-4" />
              </Link>
              <Link
                href={`/dashboard/recordings/${id}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-surface-overlay transition-all"
                title="Open recording"
              >
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
