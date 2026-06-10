import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Cpu } from 'lucide-react'
import { Topbar } from '@/components/layout/topbar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import type { StandardizedMetrics } from '@/lib/audio/metrics-types'

export const metadata: Metadata = { title: 'Raw Metrics' }

function MetricRow({ label, value, unit }: { label: string; value: string | number | null; unit?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-border-subtle last:border-0">
      <span className="text-xs text-zinc-400 flex-shrink-0">{label}</span>
      <span className="text-xs text-white font-mono text-right">
        {value == null ? <span className="text-zinc-600">—</span> : `${value}${unit ? ` ${unit}` : ''}`}
      </span>
    </div>
  )
}

function MetricSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3">{title}</p>
        {children}
      </CardContent>
    </Card>
  )
}

// Demo metrics for unauthenticated / demo recordings
const DEMO_METRICS: StandardizedMetrics = {
  engine: 'multi-engine',
  engine_version: '0.10.2',
  analysis_version: '1.0',
  engines_used: ['librosa', 'crepe', 'basic_pitch', 'essentia'],
  duration_seconds: 272.4,
  sample_rate: 22050,
  tempo: { bpm: 120.5, stability: 0.87, beats: [], downbeats: [] },
  dynamics: { avg_db: -18.5, max_db: -6.2, min_db: -42.1, dynamic_range_db: 35.9, rms_curve: [], rms_times: [] },
  onsets: { count: 142, times: [], strengths: [] },
  timing: { avg_onset_interval_s: 0.508, timing_consistency: 0.82, rushing_tendency: 0.12, dragging_tendency: 0.05, longest_gap_s: 2.4, longest_gap_time_s: 67.8 },
  spectral: { centroid_mean_hz: 1850.2, centroid_std_hz: 420.1, bandwidth_mean_hz: 2400.1, rolloff_mean_hz: 3200.5, zero_crossing_rate_mean: 0.0421 },
  pitch: {
    available: true, avg_confidence: 0.847, median_pitch_hz: 392.0, pitch_stability: 0.81,
    avg_intonation_deviation_cents: 8.4, intonation_score: 83.2, vibrato_detected: true,
    vibrato_rate_hz: 6.1, vibrato_extent_cents: 28.5,
    pitch_times: [], pitch_hz: [], pitch_confidence: [], pitch_cents_deviation: [],
  },
  notes: {
    available: true, note_count: 138, avg_note_duration_s: 0.312, avg_amplitude: 0.64,
    pitch_range_midi: 28, lowest_pitch_midi: 52, highest_pitch_midi: 80, notes: [],
  },
  timbre: {
    available: true, mfcc_mean: [-312.4, 97.1, -15.3, 8.2, -2.1, 1.4, -0.8, 0.3, -0.1, 0.2, -0.4, 0.1, -0.2],
    mfcc_std: [24.1, 12.3, 8.7, 5.2, 3.1, 2.8, 2.2, 1.9, 1.7, 1.5, 1.3, 1.1, 0.9],
    spectral_flux_mean: 18.42, spectral_flux_std: 7.81, articulation_quality_score: 76.3,
    integrated_loudness_lufs: -18.9, loudness_range_lu: -8.2,
  },
  scores: {
    timing_score: 82, dynamics_score: 71.5, articulation_score: 78.2,
    tempo_stability_score: 87, intonation_score: 83.2, pitch_stability_score: 81.0,
  },
}

export default async function MetricsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  let metrics: StandardizedMetrics = DEMO_METRICS
  let recordingTitle = 'Recording'
  let processingTime: number | null = null
  let isDemo = id.startsWith('demo')

  if (!isDemo) {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: rec } = await supabase
          .from('recordings')
          .select(`title, audio_metrics (engine, metrics_json)`)
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (rec) {
          recordingTitle = rec.title
          const am = Array.isArray(rec.audio_metrics) ? rec.audio_metrics[0] : rec.audio_metrics
          if (am?.metrics_json) {
            metrics = am.metrics_json as unknown as StandardizedMetrics
          } else {
            isDemo = true // No metrics yet
          }
        }
      } else {
        isDemo = true
      }
    } catch {
      isDemo = true
    }
  }

  return (
    <>
      <Topbar
        title="Raw Metrics"
        subtitle={isDemo ? 'Demo data' : recordingTitle}
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
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">

          {/* Header */}
          <div className="flex items-center gap-3 px-1">
            <Cpu className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-semibold text-white">Raw Audio Metrics</span>
            {isDemo && <Badge variant="amber">Demo</Badge>}
            {metrics.error && <Badge variant="default" className="bg-rose-500/20 text-rose-400">Error</Badge>}
            {processingTime != null && (
              <span className="text-xs text-zinc-600 ml-auto">{processingTime}s</span>
            )}
          </div>

          {metrics.error && (
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-rose-400">Engine error: {metrics.error}</p>
              </CardContent>
            </Card>
          )}

          {/* Derived scores */}
          {Object.keys(metrics.scores).length > 0 && (
            <MetricSection title="Derived Scores (0–100)">
              {Object.entries(metrics.scores).map(([k, v]) => (
                <MetricRow
                  key={k}
                  label={k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  value={v.toFixed(1)}
                />
              ))}
            </MetricSection>
          )}

          {/* Tempo */}
          <MetricSection title="Tempo">
            <MetricRow label="BPM" value={metrics.tempo.bpm.toFixed(2)} />
            <MetricRow label="Stability" value={`${(metrics.tempo.stability * 100).toFixed(1)}%`} />
            <MetricRow label="Beats detected" value={metrics.tempo.beats.length} />
            <MetricRow label="Downbeats" value={metrics.tempo.downbeats.length} />
          </MetricSection>

          {/* Dynamics */}
          <MetricSection title="Dynamics">
            <MetricRow label="Average loudness" value={metrics.dynamics.avg_db.toFixed(2)} unit="dB" />
            <MetricRow label="Peak loudness" value={metrics.dynamics.max_db.toFixed(2)} unit="dB" />
            <MetricRow label="Floor loudness (p5)" value={metrics.dynamics.min_db.toFixed(2)} unit="dB" />
            <MetricRow label="Dynamic range" value={metrics.dynamics.dynamic_range_db.toFixed(2)} unit="dB" />
            <MetricRow label="RMS curve points" value={metrics.dynamics.rms_curve.length} />
          </MetricSection>

          {/* Onsets */}
          <MetricSection title="Onsets / Articulation">
            <MetricRow label="Total onsets detected" value={metrics.onsets.count} />
            <MetricRow
              label="Onsets per second"
              value={(metrics.onsets.count / Math.max(metrics.duration_seconds, 1)).toFixed(2)}
              unit="/s"
            />
          </MetricSection>

          {/* Timing */}
          <MetricSection title="Timing">
            <MetricRow
              label="Avg onset interval"
              value={metrics.timing.avg_onset_interval_s.toFixed(4)}
              unit="s"
            />
            <MetricRow
              label="Timing consistency"
              value={`${(metrics.timing.timing_consistency * 100).toFixed(1)}%`}
            />
            <MetricRow
              label="Rushing tendency"
              value={`${(metrics.timing.rushing_tendency * 100).toFixed(1)}%`}
            />
            <MetricRow
              label="Dragging tendency"
              value={`${(metrics.timing.dragging_tendency * 100).toFixed(1)}%`}
            />
            <MetricRow label="Longest gap" value={metrics.timing.longest_gap_s.toFixed(3)} unit="s" />
            <MetricRow label="Longest gap at" value={metrics.timing.longest_gap_time_s.toFixed(2)} unit="s" />
          </MetricSection>

          {/* Spectral */}
          <MetricSection title="Spectral">
            <MetricRow
              label="Spectral centroid (mean)"
              value={metrics.spectral.centroid_mean_hz.toFixed(1)}
              unit="Hz"
            />
            <MetricRow
              label="Spectral centroid (std)"
              value={metrics.spectral.centroid_std_hz.toFixed(1)}
              unit="Hz"
            />
            <MetricRow
              label="Bandwidth (mean)"
              value={metrics.spectral.bandwidth_mean_hz.toFixed(1)}
              unit="Hz"
            />
            <MetricRow
              label="Rolloff (mean)"
              value={metrics.spectral.rolloff_mean_hz.toFixed(1)}
              unit="Hz"
            />
            <MetricRow
              label="Zero-crossing rate"
              value={metrics.spectral.zero_crossing_rate_mean.toFixed(6)}
            />
          </MetricSection>

          {/* Pitch */}
          <MetricSection title="Pitch Analysis">
            <MetricRow label="Available" value={metrics.pitch?.available ? 'Yes' : 'No'} />
            {metrics.pitch?.available && (
              <>
                <MetricRow label="Avg confidence" value={metrics.pitch.avg_confidence?.toFixed(3) ?? null} />
                <MetricRow label="Median pitch" value={metrics.pitch.median_pitch_hz?.toFixed(1) ?? null} unit="Hz" />
                <MetricRow label="Pitch stability" value={metrics.pitch.pitch_stability != null ? `${(metrics.pitch.pitch_stability * 100).toFixed(1)}%` : null} />
                <MetricRow label="Intonation score" value={metrics.pitch.intonation_score?.toFixed(1) ?? null} unit="/ 100" />
                <MetricRow label="Avg deviation (ET)" value={metrics.pitch.avg_intonation_deviation_cents?.toFixed(1) ?? null} unit="cents" />
                <MetricRow label="Vibrato detected" value={metrics.pitch.vibrato_detected ? 'Yes' : 'No'} />
                {metrics.pitch.vibrato_detected && (
                  <>
                    <MetricRow label="Vibrato rate" value={metrics.pitch.vibrato_rate_hz?.toFixed(2) ?? null} unit="Hz" />
                    <MetricRow label="Vibrato extent" value={metrics.pitch.vibrato_extent_cents?.toFixed(0) ?? null} unit="cents" />
                  </>
                )}
                <MetricRow label="Pitch frames" value={metrics.pitch.pitch_hz.length} />
              </>
            )}
          </MetricSection>

          {/* Notes */}
          <MetricSection title="Note Detection">
            <MetricRow label="Available" value={metrics.notes?.available ? 'Yes' : 'No'} />
            {metrics.notes?.available && (
              <>
                <MetricRow label="Notes detected" value={metrics.notes.note_count} />
                <MetricRow label="Avg note duration" value={metrics.notes.avg_note_duration_s != null ? `${(metrics.notes.avg_note_duration_s * 1000).toFixed(0)}ms` : null} />
                <MetricRow label="Avg amplitude" value={metrics.notes.avg_amplitude?.toFixed(3) ?? null} />
                <MetricRow label="Pitch range" value={metrics.notes.pitch_range_midi ?? null} unit="semitones" />
                <MetricRow label="Lowest note" value={metrics.notes.lowest_pitch_midi ?? null} unit="MIDI" />
                <MetricRow label="Highest note" value={metrics.notes.highest_pitch_midi ?? null} unit="MIDI" />
              </>
            )}
          </MetricSection>

          {/* Timbre */}
          <MetricSection title="Timbre & Texture">
            <MetricRow label="Available" value={metrics.timbre?.available ? 'Yes' : 'No'} />
            {metrics.timbre?.available && (
              <>
                <MetricRow label="Articulation quality" value={metrics.timbre.articulation_quality_score?.toFixed(1) ?? null} unit="/ 100" />
                <MetricRow label="Spectral flux (mean)" value={metrics.timbre.spectral_flux_mean?.toFixed(4) ?? null} />
                <MetricRow label="Spectral flux (std)" value={metrics.timbre.spectral_flux_std?.toFixed(4) ?? null} />
                <MetricRow label="Integrated loudness" value={metrics.timbre.integrated_loudness_lufs?.toFixed(1) ?? null} unit="LUFS" />
                <MetricRow label="Loudness range" value={metrics.timbre.loudness_range_lu?.toFixed(1) ?? null} unit="LU" />
                <MetricRow label="MFCC coefficients" value={metrics.timbre.mfcc_mean.length} />
              </>
            )}
          </MetricSection>

          {/* Summary */}
          <div className="text-xs text-zinc-600 px-1 pb-6">
            <p>Duration: {metrics.duration_seconds}s · Sample rate: {metrics.sample_rate} Hz</p>
          </div>
        </div>
      </main>
    </>
  )
}
