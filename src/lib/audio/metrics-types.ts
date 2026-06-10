/**
 * TypeScript mirror of audio-service/models.py StandardizedMetrics.
 * The analyze API route returns this shape; the diagnosis engine consumes it.
 * Never add engine-specific fields here — extend via the engine's own module.
 */

export interface TempoMetrics {
  bpm: number
  stability: number       // 0–1
  beats: number[]         // timestamps in seconds
  downbeats: number[]
}

export interface DynamicsMetrics {
  avg_db: number
  max_db: number
  min_db: number
  dynamic_range_db: number
  rms_curve: number[]     // dB values, ~10 per second
  rms_times: number[]
}

export interface OnsetMetrics {
  count: number
  times: number[]
  strengths: number[]
}

export interface TimingMetrics {
  avg_onset_interval_s: number
  timing_consistency: number
  rushing_tendency: number
  dragging_tendency: number
  longest_gap_s: number
  longest_gap_time_s: number
}

export interface SpectralMetrics {
  centroid_mean_hz: number
  centroid_std_hz: number
  bandwidth_mean_hz: number
  rolloff_mean_hz: number
  zero_crossing_rate_mean: number
}

// ── CREPE (Phase 6) ───────────────────────────────────────────────────────

export interface PitchMetrics {
  available: boolean
  avg_confidence?: number
  median_pitch_hz?: number
  pitch_stability?: number        // 0–1
  avg_intonation_deviation_cents?: number
  intonation_score?: number       // 0–100
  vibrato_detected: boolean
  vibrato_rate_hz?: number
  vibrato_extent_cents?: number
  pitch_times: number[]
  pitch_hz: number[]
  pitch_confidence: number[]
  pitch_cents_deviation: number[] // cents from equal temperament per frame
}

// ── Basic Pitch (Phase 6) ─────────────────────────────────────────────────

export interface NoteEvent {
  start_time: number
  end_time: number
  duration_s: number
  pitch_midi: number
  pitch_hz: number
  amplitude: number
  confidence: number
}

export interface NoteMetrics {
  available: boolean
  note_count: number
  avg_note_duration_s?: number
  avg_amplitude?: number
  pitch_range_midi?: number
  lowest_pitch_midi?: number
  highest_pitch_midi?: number
  notes: NoteEvent[]
}

// ── Essentia (Phase 6) ────────────────────────────────────────────────────

export interface TimbreMetrics {
  available: boolean
  mfcc_mean: number[]
  mfcc_std: number[]
  spectral_flux_mean?: number
  spectral_flux_std?: number
  articulation_quality_score?: number // 0–100
  integrated_loudness_lufs?: number
  loudness_range_lu?: number
}

// ── Combined StandardizedMetrics ──────────────────────────────────────────

export interface StandardizedMetrics {
  engine: string
  engine_version: string
  analysis_version: string
  engines_used: string[]

  duration_seconds: number
  sample_rate: number

  tempo: TempoMetrics
  dynamics: DynamicsMetrics
  onsets: OnsetMetrics
  timing: TimingMetrics
  spectral: SpectralMetrics

  pitch: PitchMetrics       // CREPE
  notes: NoteMetrics        // Basic Pitch
  timbre: TimbreMetrics     // Essentia

  scores: Record<string, number>
  error?: string
}

export interface AnalyzeRequest {
  recording_id: string
  audio_url: string
  instrument?: string
  duration_hint_s?: number
  engines?: string[]
}

export interface AnalyzeResponse {
  recording_id: string
  metrics: StandardizedMetrics
  processing_time_s: number
  engines_attempted: string[]
  engines_succeeded: string[]
}
