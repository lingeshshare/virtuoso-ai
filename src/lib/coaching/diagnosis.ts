/**
 * Diagnosis Engine
 * Converts StandardizedMetrics into structured Observations.
 * Pure deterministic logic — no AI, no API calls.
 * Claude receives this output as facts to interpret.
 */
import type { StandardizedMetrics } from '@/lib/audio/metrics-types'
import type {
  DiagnosisResult,
  MetricSummary,
  Observation,
  ObservationSeverity,
} from './types'

let _idCounter = 0
function nextId() {
  return `obs_${++_idCounter}`
}

function severity(value: number, thresholds: [number, number, number]): ObservationSeverity {
  const [critical, high, medium] = thresholds
  if (value <= critical) return 'critical'
  if (value <= high) return 'high'
  if (value <= medium) return 'medium'
  return 'low'
}

function severityAbove(value: number, thresholds: [number, number, number]): ObservationSeverity {
  const [critical, high, medium] = thresholds
  if (value >= critical) return 'critical'
  if (value >= high) return 'high'
  if (value >= medium) return 'medium'
  return 'low'
}

export function diagnose(metrics: StandardizedMetrics): DiagnosisResult {
  _idCounter = 0
  const observations: Observation[] = []

  const timingConsistencyPct = metrics.timing.timing_consistency * 100
  const tempoStabilityPct = metrics.tempo.stability * 100
  const rushingPct = metrics.timing.rushing_tendency * 100
  const draggingPct = metrics.timing.dragging_tendency * 100
  const dynamicRange = metrics.dynamics.dynamic_range_db
  const avgLoudness = metrics.dynamics.avg_db
  const onsetDensity = metrics.onsets.count / Math.max(metrics.duration_seconds, 1)
  const timingScore = metrics.scores['timing_score'] ?? timingConsistencyPct
  // Derive dynamics from measured range if the engine score is missing — never default to 50 (arbitrary)
  const dynamicsScore = metrics.scores['dynamics_score'] ??
    (dynamicRange > 0 ? Math.min(100, (dynamicRange / 50) * 100) : 0)
  const articulationScore = metrics.scores['articulation_score'] ?? timingScore

  // ── Timing consistency ─────────────────────────────────────────────────
  if (timingConsistencyPct < 85) {
    const sev = severity(timingConsistencyPct, [50, 65, 78])
    observations.push({
      id: nextId(),
      category: 'timing',
      type: 'timing',
      severity: sev,
      metric_name: 'timing_consistency',
      metric_value: Math.round(timingConsistencyPct * 10) / 10,
      threshold: 85,
      direction: 'below',
      observation_text: `Note spacing consistency measured at ${Math.round(timingConsistencyPct)}% (target ≥85%). Inter-onset intervals show a coefficient of variation suggesting uneven rhythmic subdivision.`,
    })
  }

  // ── Rushing ────────────────────────────────────────────────────────────
  if (rushingPct > 15) {
    const sev = severityAbove(rushingPct, [45, 30, 20])
    const longestGapSec = metrics.timing.longest_gap_time_s
    observations.push({
      id: nextId(),
      category: 'timing',
      type: 'timing',
      severity: sev,
      metric_name: 'rushing_tendency',
      metric_value: Math.round(rushingPct * 10) / 10,
      threshold: 15,
      direction: 'above',
      start_time: longestGapSec > 10 ? longestGapSec : undefined,
      observation_text: `${Math.round(rushingPct)}% of note intervals are shorter than the established tempo by more than 10%. This indicates a tendency to rush ahead of the beat.`,
    })
  }

  // ── Dragging ───────────────────────────────────────────────────────────
  if (draggingPct > 15) {
    const sev = severityAbove(draggingPct, [45, 30, 20])
    observations.push({
      id: nextId(),
      category: 'timing',
      type: 'timing',
      severity: sev,
      metric_name: 'dragging_tendency',
      metric_value: Math.round(draggingPct * 10) / 10,
      threshold: 15,
      direction: 'above',
      observation_text: `${Math.round(draggingPct)}% of note intervals are longer than the established tempo by more than 10%. This indicates a tendency to drag behind the beat.`,
    })
  }

  // ── Tempo stability ────────────────────────────────────────────────────
  if (tempoStabilityPct < 80) {
    const sev = severity(tempoStabilityPct, [50, 65, 75])
    observations.push({
      id: nextId(),
      category: 'timing',
      type: 'tempo',
      severity: sev,
      metric_name: 'tempo_stability',
      metric_value: Math.round(tempoStabilityPct * 10) / 10,
      threshold: 80,
      direction: 'below',
      observation_text: `Beat-to-beat tempo stability measured at ${Math.round(tempoStabilityPct)}% (target ≥80%). Detected BPM: ${metrics.tempo.bpm.toFixed(1)}. Beat intervals show significant deviation from the mean.`,
    })
  }

  // ── Dynamic range ──────────────────────────────────────────────────────
  if (dynamicRange < 20) {
    const sev = severity(dynamicRange, [8, 12, 17])
    observations.push({
      id: nextId(),
      category: 'dynamics',
      type: 'dynamics',
      severity: sev,
      metric_name: 'dynamic_range_db',
      metric_value: Math.round(dynamicRange * 10) / 10,
      threshold: 20,
      direction: 'below',
      observation_text: `Dynamic range measured at ${dynamicRange.toFixed(1)} dB (target ≥20 dB). The performance lacks contrast between loud and soft passages. Average loudness: ${avgLoudness.toFixed(1)} dBFS.`,
    })
  } else if (dynamicRange > 45) {
    // Strong dynamics — note as a strength indicator
    observations.push({
      id: nextId(),
      category: 'dynamics',
      type: 'dynamics',
      severity: 'low',
      metric_name: 'dynamic_range_db',
      metric_value: Math.round(dynamicRange * 10) / 10,
      threshold: 20,
      direction: 'above',
      observation_text: `Dynamic range measured at ${dynamicRange.toFixed(1)} dB, indicating strong contrast between loud and soft passages. This is above the Region benchmark of 20–35 dB.`,
    })
  }

  // ── Onset density (articulation / note clarity) ────────────────────────
  if (onsetDensity > 0) {
    const expectedDensity = metrics.tempo.bpm / 60 // quarter notes per second at detected tempo
    const densityRatio = onsetDensity / Math.max(expectedDensity, 0.5)

    if (densityRatio < 0.6) {
      observations.push({
        id: nextId(),
        category: 'articulation',
        type: 'articulation',
        severity: 'medium',
        metric_name: 'onset_density',
        metric_value: Math.round(onsetDensity * 100) / 100,
        threshold: expectedDensity,
        direction: 'below',
        observation_text: `Onset detection found ${metrics.onsets.count} note attacks over ${metrics.duration_seconds.toFixed(1)}s (${onsetDensity.toFixed(2)}/s). At the detected tempo of ${metrics.tempo.bpm.toFixed(1)} BPM, expected density is ~${expectedDensity.toFixed(2)}/s. Note attacks may be unclear or under-articulated.`,
      })
    }
  }

  // ── Longest gap (phrase breaks / breath marks) ─────────────────────────
  if (metrics.timing.longest_gap_s > 3.5 && metrics.duration_seconds > 30) {
    const gapTime = metrics.timing.longest_gap_time_s ?? undefined
    const gapSec = metrics.timing.longest_gap_s
    const gapTimeLabel = gapTime != null ? ` at ${formatTime(gapTime)}` : ''
    observations.push({
      id: nextId(),
      category: 'timing',
      type: 'timing',
      severity: gapSec > 6 ? 'high' : 'medium',
      metric_name: 'longest_gap_s',
      metric_value: Math.round(gapSec * 100) / 100,
      threshold: 3.5,
      direction: 'above',
      start_time: gapTime,
      end_time: gapTime != null ? gapTime + gapSec : undefined,
      observation_text: `Longest silence/gap detected: ${gapSec.toFixed(2)}s${gapTimeLabel} in the recording. This may indicate a missed entrance, breath timing issue, or technical break.`,
    })
  }

  // ── CREPE: intonation / pitch stability (Phase 6) ─────────────────────
  if (metrics.pitch?.available) {
    const p = metrics.pitch
    const intonationScore = p.intonation_score ?? 100
    const pitchStabilityPct = (p.pitch_stability ?? 1) * 100
    const avgDevCents = p.avg_intonation_deviation_cents ?? 0

    if (intonationScore < 80) {
      const sev = severity(intonationScore, [40, 60, 72])
      observations.push({
        id: nextId(),
        category: 'intonation',
        type: 'pitch',
        severity: sev,
        metric_name: 'intonation_score',
        metric_value: Math.round(intonationScore * 10) / 10,
        threshold: 80,
        direction: 'below',
        observation_text: `CREPE pitch analysis: average intonation deviation of ${avgDevCents.toFixed(1)} cents from equal temperament. Intonation score: ${Math.round(intonationScore)}/100. Pitch confidence: ${((p.avg_confidence ?? 0) * 100).toFixed(1)}%.`,
      })
    }

    if (pitchStabilityPct < 75) {
      const sev = severity(pitchStabilityPct, [40, 60, 70])
      observations.push({
        id: nextId(),
        category: 'tone',
        type: 'pitch',
        severity: sev,
        metric_name: 'pitch_stability',
        metric_value: Math.round(pitchStabilityPct * 10) / 10,
        threshold: 75,
        direction: 'below',
        observation_text: `Pitch stability measured at ${pitchStabilityPct.toFixed(1)}% (target ≥75%). Pitch deviates significantly between frames, indicating embouchure inconsistency or wavering air support.`,
      })
    }

    if (p.vibrato_detected && p.vibrato_rate_hz != null) {
      const vibratoRate = p.vibrato_rate_hz
      const vibratoExtent = p.vibrato_extent_cents ?? 0
      const isControlled = vibratoRate >= 5.0 && vibratoRate <= 7.5 && vibratoExtent < 60
      observations.push({
        id: nextId(),
        category: 'tone',
        type: 'pitch',
        severity: isControlled ? 'low' : 'medium',
        metric_name: 'vibrato_rate_hz',
        metric_value: Math.round(vibratoRate * 100) / 100,
        threshold: 6.0,
        direction: isControlled ? 'above' : 'inconsistent',
        observation_text: `Vibrato detected: ${vibratoRate.toFixed(1)} Hz rate, ${vibratoExtent.toFixed(0)} cents extent. ${isControlled ? 'Rate and extent are within controlled parameters.' : 'Rate or extent is outside the 5–7.5 Hz / ±30 cents ideal range.'}`,
      })
    }
  }

  // ── Basic Pitch: note detection observations (Phase 6) ─────────────────
  if (metrics.notes?.available && metrics.notes.note_count > 0) {
    const n = metrics.notes
    const noteRange = n.pitch_range_midi ?? 0
    const lowestMidi = n.lowest_pitch_midi ?? 60
    const highestMidi = n.highest_pitch_midi ?? 72

    if (noteRange > 24) {
      // Wide range = good for auditions (demonstrates technical command)
      observations.push({
        id: nextId(),
        category: 'tone',
        type: 'tone',
        severity: 'low',
        metric_name: 'pitch_range_midi',
        metric_value: noteRange,
        threshold: 12,
        direction: 'above',
        observation_text: `Basic Pitch detected ${n.note_count} notes spanning ${noteRange} semitones (MIDI ${lowestMidi}–${highestMidi}). Wide range demonstrates command across registers.`,
      })
    }

    if (n.avg_note_duration_s != null && n.avg_note_duration_s < 0.15) {
      observations.push({
        id: nextId(),
        category: 'articulation',
        type: 'articulation',
        severity: 'medium',
        metric_name: 'avg_note_duration_s',
        metric_value: Math.round((n.avg_note_duration_s) * 1000) / 1000,
        threshold: 0.15,
        direction: 'below',
        observation_text: `Basic Pitch: average detected note duration is ${(n.avg_note_duration_s * 1000).toFixed(0)}ms. Very short average durations may indicate staccato playing, clipped note release, or under-sustain.`,
      })
    }
  }

  // ── Essentia: articulation quality and loudness (Phase 6) ─────────────
  if (metrics.timbre?.available) {
    const t = metrics.timbre
    if (t.articulation_quality_score != null && t.articulation_quality_score < 65) {
      const sev = severity(t.articulation_quality_score, [30, 50, 60])
      observations.push({
        id: nextId(),
        category: 'articulation',
        type: 'articulation',
        severity: sev,
        metric_name: 'articulation_quality_score',
        metric_value: Math.round(t.articulation_quality_score * 10) / 10,
        threshold: 65,
        direction: 'below',
        observation_text: `Essentia spectral flux analysis: articulation quality score ${t.articulation_quality_score.toFixed(1)}/100. Spectral flux mean: ${(t.spectral_flux_mean ?? 0).toFixed(2)}. Note attacks may lack definition or consistency.`,
      })
    }
  }

  // ── Generate timestamp observations from RMS curve ─────────────────────
  const rmsObservations = extractRmsObservations(metrics)
  observations.push(...rmsObservations)

  // ── Sort by severity ───────────────────────────────────────────────────
  const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  observations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

  // ── Problem areas and strengths ────────────────────────────────────────
  const intonationScore = metrics.pitch?.intonation_score ?? null
  const categoryScores: Record<string, number> = {
    timing: timingScore,
    dynamics: dynamicsScore,
    articulation: articulationScore,
    ...(intonationScore != null ? { intonation: intonationScore } : {}),
  }

  const problemAreas = Object.entries(categoryScores)
    .filter(([, s]) => s < 75)
    .sort(([, a], [, b]) => a - b)
    .map(([k]) => k)

  const strengths = Object.entries(categoryScores)
    .filter(([, s]) => s >= 80)
    .sort(([, a], [, b]) => b - a)
    .map(([k]) => k)

  const summary: MetricSummary = {
    duration_seconds: metrics.duration_seconds,
    tempo_bpm: metrics.tempo.bpm,
    tempo_stability_pct: Math.round(tempoStabilityPct * 10) / 10,
    timing_consistency_pct: Math.round(timingConsistencyPct * 10) / 10,
    rushing_pct: Math.round(rushingPct * 10) / 10,
    dragging_pct: Math.round(draggingPct * 10) / 10,
    dynamic_range_db: Math.round(dynamicRange * 10) / 10,
    avg_loudness_db: Math.round(avgLoudness * 10) / 10,
    onset_count: metrics.onsets.count,
    onset_density_per_sec: Math.round(onsetDensity * 100) / 100,
    timing_score: Math.round(timingScore * 10) / 10,
    dynamics_score: Math.round(dynamicsScore * 10) / 10,
    articulation_score: Math.round(articulationScore * 10) / 10,
    longest_gap_s: metrics.timing.longest_gap_s,
    longest_gap_time_s: metrics.timing.longest_gap_time_s,
    // Phase 6
    ...(metrics.pitch?.available ? {
      intonation_score: metrics.pitch.intonation_score ?? undefined,
      intonation_deviation_cents: metrics.pitch.avg_intonation_deviation_cents ?? undefined,
      pitch_stability_pct: metrics.pitch.pitch_stability != null
        ? Math.round(metrics.pitch.pitch_stability * 1000) / 10
        : undefined,
      vibrato_detected: metrics.pitch.vibrato_detected,
    } : {}),
    ...(metrics.notes?.available ? {
      note_count: metrics.notes.note_count,
      note_range_semitones: metrics.notes.pitch_range_midi ?? undefined,
    } : {}),
    ...(metrics.timbre?.available ? {
      articulation_quality_score: metrics.timbre.articulation_quality_score ?? undefined,
      integrated_loudness_lufs: metrics.timbre.integrated_loudness_lufs ?? undefined,
    } : {}),
    engines_used: metrics.engines_used ?? [],
  }

  return {
    observations,
    metric_summary: summary,
    problem_areas: problemAreas,
    strengths,
    has_pitch_data: metrics.pitch?.available ?? false,
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function extractRmsObservations(metrics: StandardizedMetrics): Observation[] {
  const { rms_curve, rms_times } = metrics.dynamics
  if (rms_curve.length < 20) return []

  const results: Observation[] = []
  const windowSize = Math.max(1, Math.floor(rms_curve.length / 10))
  const avgRms = rms_curve.reduce((a, b) => a + b, 0) / rms_curve.length

  // Find the window with lowest energy (potential under-playing)
  let minWindowAvg = Infinity
  let minWindowStart = 0

  for (let i = 0; i < rms_curve.length - windowSize; i += windowSize) {
    const window = rms_curve.slice(i, i + windowSize)
    const windowAvg = window.reduce((a, b) => a + b, 0) / window.length
    if (windowAvg < minWindowAvg) {
      minWindowAvg = windowAvg
      minWindowStart = i
    }
  }

  const underPlayingDrop = avgRms - minWindowAvg
  if (underPlayingDrop > 8 && rms_times.length > minWindowStart) {
    const startTime = rms_times[minWindowStart] ?? 0
    const endTime = rms_times[Math.min(minWindowStart + windowSize, rms_times.length - 1)] ?? startTime + 5
    results.push({
      id: nextId(),
      category: 'dynamics',
      type: 'dynamics',
      severity: underPlayingDrop > 15 ? 'high' : 'medium',
      metric_name: 'rms_local_minimum',
      metric_value: Math.round(minWindowAvg * 10) / 10,
      threshold: avgRms - 5,
      direction: 'below',
      start_time: startTime,
      end_time: endTime,
      observation_text: `Loudness drops ${underPlayingDrop.toFixed(1)} dB below average from ${formatTime(startTime)} to ${formatTime(endTime)}. This section averages ${minWindowAvg.toFixed(1)} dBFS vs. overall average of ${avgRms.toFixed(1)} dBFS.`,
    })
  }

  // Find window with highest variance (dynamics instability)
  let maxVariance = 0
  let maxVarStart = 0
  for (let i = 0; i < rms_curve.length - windowSize; i += windowSize) {
    const window = rms_curve.slice(i, i + windowSize)
    const windowAvg = window.reduce((a, b) => a + b, 0) / window.length
    const variance = window.reduce((a, b) => a + (b - windowAvg) ** 2, 0) / window.length
    if (variance > maxVariance) {
      maxVariance = variance
      maxVarStart = i
    }
  }

  if (maxVariance > 25 && rms_times.length > maxVarStart) {
    const startTime = rms_times[maxVarStart] ?? 0
    const endTime = rms_times[Math.min(maxVarStart + windowSize, rms_times.length - 1)] ?? startTime + 5
    results.push({
      id: nextId(),
      category: 'dynamics',
      type: 'dynamics',
      severity: maxVariance > 60 ? 'high' : 'medium',
      metric_name: 'rms_variance',
      metric_value: Math.round(maxVariance * 10) / 10,
      threshold: 25,
      direction: 'above',
      start_time: startTime,
      end_time: endTime,
      observation_text: `Loudness variance is highest from ${formatTime(startTime)} to ${formatTime(endTime)} (variance: ${maxVariance.toFixed(1)} dB²). This may indicate breath control inconsistency or embouchure instability.`,
    })
  }

  return results
}
