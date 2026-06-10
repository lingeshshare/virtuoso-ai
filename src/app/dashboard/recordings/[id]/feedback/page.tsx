'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { WeightedScorecard } from '@/components/feedback/weighted-scorecard'
import { PersonaSelector } from '@/components/feedback/persona-selector'
import { GapAnalysisCard } from '@/components/feedback/gap-analysis-card'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getRubric, applyPersonaWeights } from '@/lib/constants/rubrics'
import { getPersonaById } from '@/lib/constants/personas'
import type { CoachingPersona } from '@/lib/types'
import type { CoachingReport, TimestampFeedbackItem } from '@/lib/coaching/types'

// ── Mock data (demo / pre-coaching fallback) ──────────────────────────────

const MOCK_REPORT: CoachingReport = {
  summary: 'Strong foundational tone and musical instincts, but articulation consistency and upper-register air support need significant work before competing at All-State level. Timing rushes in technical passages at higher tempos.',
  estimated_level: 'region',
  overall_score: 74,
  category_scores: [
    { id: 'tone', name: 'Tone Quality', score: 78, weight: 0.20, observation: 'Core sound is resonant in the middle register with good reed response.', likely_cause: 'Solid embouchure formation and voicing.', impact: 'Positive foundation for all other elements.', fix: 'Extend this quality to the upper register by practicing long tones above high C.' },
    { id: 'intonation', name: 'Intonation', score: 72, weight: 0.20, observation: 'Pitch accuracy is inconsistent across the octave break and in the altissimo range.', likely_cause: 'Oral cavity (voicing) not adjusting for register changes.', impact: 'Intonation issues at All-State level are immediately disqualifying.', fix: 'Practice octave slurs on a tuner with drone pitch. Target ±5 cents.' },
    { id: 'articulation', name: 'Articulation', score: 65, weight: 0.20, observation: 'Articulation clarity decreases noticeably above quarter note = 100 BPM.', likely_cause: 'Tongue motion is too large — using middle of tongue instead of tip.', impact: 'Double and triple tonguing passages become muddy at All-State tempos.', fix: 'Practice "du-gu" patterns at 84 BPM, focus on minimal tongue movement.' },
    { id: 'dynamics', name: 'Dynamics', score: 81, weight: 0.15, observation: 'Good dynamic contrast between forte and mezzo-forte passages.', likely_cause: 'Strong breath support and air control.', impact: 'Dynamic shaping supports musical expression effectively.', fix: 'Extend dynamic range downward: practice pianissimo passages without pitch change.' },
    { id: 'musicality', name: 'Musicality', score: 75, weight: 0.15, observation: 'Phrase shaping shows musical awareness but lacks forward momentum in long lines.', likely_cause: 'Inattention to harmonic destination within phrases.', impact: 'Phrases arrive rather than go somewhere — reduces expressive impact.', fix: 'Identify the harmonic goal of each phrase and crescendo/diminuendo toward it.' },
    { id: 'air', name: 'Air Support', score: 71, weight: 0.10, observation: 'Air support weakens in the upper register above high D.', likely_cause: 'Insufficient diaphragmatic engagement when voicing rises.', impact: 'Upper register notes lose core tone quality and intonation.', fix: 'Practice sustained high notes (D5–G5) with a resistance straw to build air column.' },
  ],
  timestamp_items: [
    { start_time: 42.5, end_time: 51.0, display_time: '0:42–0:51', category: 'articulation', severity: 'high', observation: 'Analysis shows a 23% increase in inter-onset interval variance during this passage, indicating articulation breakdown at higher tempo.', likely_cause: 'Tongue fatigue combined with inefficient syllable placement.', impact: 'Notes in this passage lose their attack definition, reducing clarity.', fix: 'Isolate bars 12–15 and practice at quarter note = 84. Add one click per week until reaching tempo.', drill: 'Slow-tempo repeated-16th-note drill: set metronome to 84 BPM. Play the passage on one pitch first, focusing solely on tongue tip contact. 10 minutes.', priority: 1 },
    { start_time: 127.0, end_time: 134.0, display_time: '2:07–2:14', category: 'dynamics', severity: 'medium', observation: 'RMS energy drops 12 dB below the recording average during this phrase.', likely_cause: 'Air support decreasing at the end of a long phrase.', impact: 'The phrase ending lacks projection and musical arrival.', fix: 'Breathe one bar earlier than written. Practice phrase-end crescendo to maintain air.', drill: 'Sustained note endurance: hold a concert Bb for 8 beats at mf, crescendo to f in the final 2 beats. Repeat 5×. 8 minutes.', priority: 2 },
    { start_time: 198.0, end_time: 208.0, display_time: '3:18–3:28', category: 'timing', severity: 'medium', observation: 'Rushing tendency is concentrated in this passage — 15% of intervals are shorter than baseline.', likely_cause: 'Excitement at the climax causes the student to pull ahead of the beat.', impact: 'The climax arrives early, undercutting the musical tension build.', fix: 'Practice this passage with a metronome click on every eighth note.', drill: 'Metronome subdivision drill: set to 120 BPM with eighth-note subdivision audible. 10 minutes.', priority: 3 },
  ],
  gap_analysis: {
    current_level: 'region',
    target_level: 'all-state',
    gaps: [
      { category: 'articulation', category_name: 'Articulation', current_score: 65, target_score: 85, delta: 20, priority: 1 },
      { category: 'intonation', category_name: 'Intonation', current_score: 72, target_score: 88, delta: 16, priority: 2 },
      { category: 'musicality', category_name: 'Musicality', current_score: 75, target_score: 87, delta: 12, priority: 3 },
      { category: 'air', category_name: 'Air Support', current_score: 71, target_score: 82, delta: 11, priority: 4 },
    ],
  },
}

const SEVERITY_STYLES = {
  critical: 'bg-rose-500/10 border-rose-500/30',
  high: 'bg-amber-500/10 border-amber-500/30',
  medium: 'bg-violet-500/10 border-violet-500/20',
  low: 'bg-zinc-800/50 border-border-DEFAULT',
}

function TimestampItem({ item }: { item: TimestampFeedbackItem }) {
  return (
    <div className={`rounded-xl border p-4 space-y-3 ${SEVERITY_STYLES[item.severity]}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-mono text-xs bg-black/20 px-2 py-0.5 rounded-lg text-white">{item.display_time}</span>
        <Badge
          variant={item.severity === 'critical' || item.severity === 'high' ? 'rose' : 'default'}
          className="capitalize text-[10px]"
        >
          {item.severity}
        </Badge>
        <span className="text-xs capitalize text-zinc-500">{item.category}</span>
        <span className="ml-auto text-[10px] text-zinc-600">Priority #{item.priority}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Observation</span>
          <p className="text-zinc-200 mt-0.5">{item.observation}</p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Likely cause</span>
          <p className="text-zinc-300 mt-0.5">{item.likely_cause}</p>
        </div>
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Fix</span>
          <p className="text-zinc-300 mt-0.5">{item.fix}</p>
        </div>
        <div className="pt-1 border-t border-white/5">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Practice drill</span>
          <p className="text-zinc-400 mt-0.5 text-xs leading-relaxed">{item.drill}</p>
        </div>
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const params = useParams()
  const id = params.id as string
  const isDemo = id.startsWith('demo')

  const [persona, setPersona] = useState<CoachingPersona>('clinician')
  const [report, setReport] = useState<CoachingReport | null>(isDemo ? MOCK_REPORT : null)
  const [loading, setLoading] = useState(!isDemo)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isDemo) return
    loadReport(persona)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persona, id])

  async function loadReport(p: CoachingPersona) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/recordings/${id}/coach`)
      if (!res.ok) throw new Error('Failed to fetch reports')
      const { reports } = await res.json()
      const found = (reports ?? []).find((r: { persona: string }) => r.persona === p)
      setReport(found ? (found.report_json as CoachingReport) : null)
    } catch {
      setError('Could not load feedback.')
    } finally {
      setLoading(false)
    }
  }

  async function generateReport() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/recordings/${id}/coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ persona }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Generation failed')
      }
      const { report: stored } = await res.json()
      setReport(stored.report_json as CoachingReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const rubric = getRubric('alto-saxophone')
  const personaDef = getPersonaById(persona)
  const adjustedRubric = personaDef ? applyPersonaWeights(rubric, personaDef) : rubric

  const rubricResults = report
    ? report.category_scores.map((c) => ({
        id: c.id,
        score: c.score,
        observations: c.observation ? [c.observation] : [],
      }))
    : []

  return (
    <>
      <Topbar
        title="Feedback Report"
        subtitle={isDemo ? 'Demo mode' : 'Coaching report'}
        actions={
          <Link href={`/dashboard/recordings/${id}`}>
            <button className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">

          <PersonaSelector value={persona} onChange={setPersona} />

          {loading && (
            <div className="flex items-center gap-3 text-zinc-400 py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading feedback…</span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-4 rounded-xl bg-rose-500/8 border border-rose-500/20">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-rose-300">{error}</p>
                <button onClick={() => loadReport(persona)} className="text-xs text-rose-400 underline mt-1">Retry</button>
              </div>
            </div>
          )}

          {/* No report yet — generate CTA */}
          {!loading && !report && !error && !isDemo && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-zinc-400 mb-4">
                  No feedback report yet for the <strong className="text-zinc-200 capitalize">{persona.replace('-', ' ')}</strong> persona.
                </p>
                <button
                  onClick={generateReport}
                  disabled={generating}
                  className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-semibold transition-all"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  {generating ? 'Analyzing your performance…' : 'Generate Feedback Report'}
                </button>
                {generating && (
                  <p className="text-xs text-zinc-600 mt-3">This takes about 15–30 seconds.</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {report && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className="text-4xl font-black tabular-nums"
                      style={{ color: report.overall_score >= 80 ? '#34d399' : report.overall_score >= 60 ? '#a78bfa' : '#fbbf24' }}
                    >
                      {Math.round(report.overall_score)}
                    </span>
                    <Badge variant="amber" className="capitalize">{report.estimated_level} Level</Badge>
                  </div>
                  {!isDemo && (
                    <button
                      onClick={generateReport}
                      disabled={generating}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
                      Regenerate
                    </button>
                  )}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{report.summary}</p>
              </CardContent>
            </Card>
          )}

          {/* Scorecard + Gap Analysis */}
          {report && (
            <div className="grid lg:grid-cols-2 gap-5">
              <WeightedScorecard rubric={adjustedRubric} results={rubricResults} />
              {report.gap_analysis && (
                <GapAnalysisCard
                  currentLevel={report.gap_analysis.current_level}
                  targetLevel={report.gap_analysis.target_level ?? undefined}
                  gaps={(report.gap_analysis.gaps ?? []).map((g) => ({
                    category: g.category,
                    categoryName: g.category_name,
                    currentScore: g.current_score,
                    targetScore: g.target_score,
                    delta: g.delta,
                  }))}
                />
              )}
            </div>
          )}

          {/* Timestamp feedback */}
          {report && report.timestamp_items.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white">
                Timestamped Observations
                <span className="ml-2 text-zinc-500 font-normal">({report.timestamp_items.length})</span>
              </h2>
              {[...report.timestamp_items]
                .sort((a, b) => a.priority - b.priority)
                .map((item, i) => <TimestampItem key={i} item={item} />)}
            </div>
          )}

          {/* Category breakdown */}
          {report && (
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-white">Category Breakdown</h2>
              {[...report.category_scores]
                .sort((a, b) => a.score - b.score)
                .map((cat) => (
                  <Card key={cat.id}>
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-white">{cat.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">{(cat.weight * 100).toFixed(0)}% weight</span>
                          <span
                            className="text-lg font-black tabular-nums"
                            style={{ color: cat.score >= 80 ? '#34d399' : cat.score >= 65 ? '#a78bfa' : '#fbbf24' }}
                          >
                            {cat.score}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="text-zinc-400"><span className="text-zinc-500 text-xs font-medium">Observation — </span>{cat.observation}</p>
                        <p className="text-zinc-400"><span className="text-zinc-500 text-xs font-medium">Cause — </span>{cat.likely_cause}</p>
                        <p className="text-zinc-400"><span className="text-zinc-500 text-xs font-medium">Impact — </span>{cat.impact}</p>
                        <p className="text-zinc-300"><span className="text-zinc-500 text-xs font-medium">Fix — </span>{cat.fix}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
