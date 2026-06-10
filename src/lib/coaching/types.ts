/**
 * Coaching-layer types.
 * The diagnosis engine outputs DiagnosisResult.
 * The Claude engine receives DiagnosisResult + context and outputs CoachingReport.
 */
import type { StandardizedMetrics } from '@/lib/audio/metrics-types'
import type { CoachingPersona } from '@/lib/types'

// ── Diagnosis Engine output ────────────────────────────────────────────────

export type ObservationSeverity = 'critical' | 'high' | 'medium' | 'low'
export type ObservationType = 'timing' | 'dynamics' | 'articulation' | 'tempo' | 'pitch' | 'tone'

export interface Observation {
  id: string
  category: string            // maps to rubric category id (e.g. 'articulation', 'dynamics')
  type: ObservationType
  severity: ObservationSeverity
  metric_name: string         // which metric triggered this
  metric_value: number        // the measured value
  threshold: number           // what was expected
  direction: 'below' | 'above' | 'inconsistent'
  start_time?: number         // seconds into recording (if localized)
  end_time?: number
  observation_text: string    // plain factual statement — NO subjective language, NO "I hear"
}

export interface MetricSummary {
  duration_seconds: number
  tempo_bpm: number
  tempo_stability_pct: number
  timing_consistency_pct: number
  rushing_pct: number
  dragging_pct: number
  dynamic_range_db: number
  avg_loudness_db: number
  onset_count: number
  onset_density_per_sec: number
  timing_score: number
  dynamics_score: number
  articulation_score: number
  longest_gap_s: number
  longest_gap_time_s: number
  // Phase 6 — populated when CREPE / Basic Pitch / Essentia ran
  intonation_score?: number
  intonation_deviation_cents?: number
  pitch_stability_pct?: number
  vibrato_detected?: boolean
  note_count?: number
  note_range_semitones?: number
  articulation_quality_score?: number
  integrated_loudness_lufs?: number
  engines_used?: string[]
}

export interface DiagnosisResult {
  observations: Observation[]
  metric_summary: MetricSummary
  problem_areas: string[]     // category ids, ordered by severity
  strengths: string[]         // category ids with good scores
  has_pitch_data: boolean
}

// ── Claude coaching output ─────────────────────────────────────────────────

export interface CategoryScore {
  id: string
  name: string
  score: number               // 0–100
  weight: number              // rubric weight
  observation: string         // what was observed (1–2 sentences)
  likely_cause: string        // why this is happening
  impact: string              // effect on performance
  fix: string                 // specific correction
}

export interface TimestampFeedbackItem {
  start_time: number
  end_time: number
  display_time: string        // e.g. "0:42–0:51"
  category: string
  severity: ObservationSeverity
  observation: string
  likely_cause: string
  impact: string
  fix: string
  drill: string
  priority: number
}

export interface GapItem {
  category: string
  category_name: string
  current_score: number
  target_score: number
  delta: number
  priority: number
}

export interface CoachingReport {
  summary: string             // 2–3 sentence plain-text executive summary
  estimated_level: string     // e.g. 'region'
  overall_score: number       // 0–100 weighted composite
  category_scores: CategoryScore[]
  timestamp_items: TimestampFeedbackItem[]
  gap_analysis: {
    current_level: string
    target_level: string | null
    gaps: GapItem[]
  }
}

export interface PracticeDrill {
  id: string
  title: string
  description: string
  duration_minutes: number
  bpm?: number
  category: string
  priority: number
  tags: string[]
  source_observation?: string  // reference to timestamp / category observation
  type: 'technique' | 'musical' | 'scale' | 'etude' | 'long-tone' | 'rhythm'
}

export interface PracticePlan {
  drills: PracticeDrill[]
  weekly_schedule: Record<string, string[]>  // day → drill ids
  total_minutes_per_day: number
  focus_areas: string[]
}

// ── Input to the Claude engine ─────────────────────────────────────────────

export interface ReferenceMaterialInfo {
  file_name: string
  file_type: string          // pdf, musicxml, mxl, midi
  material_type: string      // score, excerpt, audition_packet
}

export interface CoachingInput {
  recording_id: string
  instrument: string
  instrument_label: string
  current_level: string
  target_level: string | null
  persona: CoachingPersona
  diagnosis: DiagnosisResult
  rubric: Array<{ id: string; name: string; weight: number; description: string }>
  reference_materials?: ReferenceMaterialInfo[]
}
