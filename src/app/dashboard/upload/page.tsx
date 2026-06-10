import type { Metadata } from 'next'
import { Topbar } from '@/components/layout/topbar'
import { UploadZone } from '@/components/dashboard/upload-zone'
import { Card, CardContent } from '@/components/ui/card'
import { Lightbulb, Mic2, Music, Gauge, Zap, Target, BarChart3, FileMusic, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Upload Recording',
}

const ANALYSIS_FEATURES = [
  { label: 'Pitch & Intonation', icon: Target, color: 'text-violet-400', bg: 'bg-violet-500/12' },
  { label: 'Rhythm & Timing', icon: Gauge, color: 'text-blue-400', bg: 'bg-blue-500/12' },
  { label: 'Dynamics', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/12' },
  { label: 'Tone & Timbre', icon: Music, color: 'text-emerald-400', bg: 'bg-emerald-500/12' },
  { label: 'Articulation', icon: Zap, color: 'text-rose-400', bg: 'bg-rose-500/12' },
  { label: 'Musical Expression', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/12' },
  { label: 'Note Accuracy', icon: FileMusic, color: 'text-blue-400', bg: 'bg-blue-500/12', note: 'Score required' },
  { label: 'Overall Musicality', icon: Mic2, color: 'text-emerald-400', bg: 'bg-emerald-500/12' },
]

export default function UploadPage() {
  return (
    <>
      <Topbar title="New Recording" subtitle="Upload audio or record from your device" />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">

          {/* Main upload zone */}
          <UploadZone />

          {/* Tips */}
          <Card variant="bordered">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-2">Tips for better feedback</p>
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 flex-shrink-0" />
                      Record in a quiet room — background noise reduces accuracy.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 flex-shrink-0" />
                      WAV or FLAC give the most detailed pitch and tone analysis.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 flex-shrink-0" />
                      Use a dedicated microphone rather than a phone speaker for best results.
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-zinc-600 mt-1.5 flex-shrink-0" />
                      Record your actual audition excerpt or etude — not just warm-ups.
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What gets analyzed */}
          <div>
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              What gets analyzed
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ANALYSIS_FEATURES.map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="flex flex-col gap-2 p-3 rounded-xl bg-surface-DEFAULT border border-border-DEFAULT hover:border-border-strong transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-lg ${item.bg} flex items-center justify-center`}>
                      <Icon className={`w-3.5 h-3.5 ${item.color}`} />
                    </div>
                    <span className="text-xs font-medium text-zinc-300 leading-tight">{item.label}</span>
                    {item.note && (
                      <span className="text-[10px] text-zinc-600">{item.note}</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      </main>
    </>
  )
}
