/**
 * Feedback report prompt — builds the user-turn message for Claude.
 * The tool definition enforces structured JSON output.
 */
import type { CoachingInput } from '../types'

export function buildFeedbackPrompt(input: CoachingInput): string {
  const { diagnosis, metric_summary: ms } = { diagnosis: input.diagnosis, metric_summary: input.diagnosis.metric_summary }
  const rubricLines = input.rubric
    .map((r) => `  - ${r.name} (id: "${r.id}", weight: ${(r.weight * 100).toFixed(0)}%): ${r.description}`)
    .join('\n')

  const observationLines = diagnosis.observations
    .map((o, i) => {
      const timeStr = o.start_time != null
        ? ` [${formatTime(o.start_time)}${o.end_time != null ? `–${formatTime(o.end_time)}` : ''}]`
        : ''
      return `${i + 1}. [${o.severity.toUpperCase()}] ${o.category} / ${o.type}${timeStr}\n   ${o.observation_text}`
    })
    .join('\n')

  const strengthsText = diagnosis.strengths.length > 0
    ? `Measured strengths: ${diagnosis.strengths.join(', ')}`
    : 'No categories clearly above threshold.'

  const problemText = diagnosis.problem_areas.length > 0
    ? `Problem areas (ordered by severity): ${diagnosis.problem_areas.join(' > ')}`
    : 'No critical problems detected.'

  const enginesUsed = ms.engines_used?.join(', ') ?? 'librosa'
  const phase6Lines: string[] = []
  if (ms.intonation_score != null) {
    phase6Lines.push(`  Intonation score (CREPE): ${ms.intonation_score.toFixed(1)}/100 | Avg deviation: ${(ms.intonation_deviation_cents ?? 0).toFixed(1)} cents`)
    phase6Lines.push(`  Pitch stability: ${(ms.pitch_stability_pct ?? 0).toFixed(1)}% | Vibrato: ${ms.vibrato_detected ? 'detected' : 'not detected'}`)
  }
  if (ms.note_count != null) {
    phase6Lines.push(`  Notes detected (Basic Pitch): ${ms.note_count} | Range: ${ms.note_range_semitones ?? '?'} semitones`)
  }
  if (ms.articulation_quality_score != null) {
    phase6Lines.push(`  Articulation quality (Essentia): ${ms.articulation_quality_score.toFixed(1)}/100`)
  }
  if (ms.integrated_loudness_lufs != null) {
    phase6Lines.push(`  Integrated loudness: ${ms.integrated_loudness_lufs.toFixed(1)} LUFS`)
  }

  const hasReference = (input.reference_materials?.length ?? 0) > 0
  const refLines = hasReference
    ? input.reference_materials!.map((r) =>
        `  - ${r.file_name} (${r.material_type}, ${r.file_type})`
      ).join('\n')
    : null

  return `RECORDING ANALYSIS REPORT
Instrument: ${input.instrument_label}
Student level: ${input.current_level}${input.target_level ? ` → Target: ${input.target_level}` : ''}
Duration: ${ms.duration_seconds.toFixed(1)}s
Analysis engines: ${enginesUsed}
Reference materials: ${hasReference ? `YES\n${refLines}` : 'None attached'}

RUBRIC FOR ${input.instrument_label.toUpperCase()}:
${rubricLines}

KEY METRICS (librosa):
  Tempo: ${ms.tempo_bpm.toFixed(1)} BPM | Stability: ${ms.tempo_stability_pct.toFixed(1)}%
  Timing consistency: ${ms.timing_consistency_pct.toFixed(1)}% | Rushing: ${ms.rushing_pct.toFixed(1)}% | Dragging: ${ms.dragging_pct.toFixed(1)}%
  Dynamic range: ${ms.dynamic_range_db.toFixed(1)} dB | Avg loudness: ${ms.avg_loudness_db.toFixed(1)} dBFS
  Onsets: ${ms.onset_count} detected (${ms.onset_density_per_sec.toFixed(2)}/s)
  Longest gap: ${ms.longest_gap_s.toFixed(2)}s at ${formatTime(ms.longest_gap_time_s)}
${phase6Lines.length > 0 ? '\nPHASE 6 METRICS:\n' + phase6Lines.join('\n') : ''}

DERIVED SCORES (0–100):
  Timing: ${ms.timing_score.toFixed(1)} | Dynamics: ${ms.dynamics_score.toFixed(1)} | Articulation: ${ms.articulation_score.toFixed(1)}${ms.intonation_score != null ? ` | Intonation: ${ms.intonation_score.toFixed(1)}` : ''}

${problemText}
${strengthsText}

OBSERVATIONS (${diagnosis.observations.length} total, ordered by severity):
${observationLines || 'No significant issues detected.'}

Generate a complete feedback report for this ${input.instrument_label} student by calling the generate_feedback tool.

INTERNAL CALIBRATION CONTEXT — internalize this into your scoring and judgment. Do NOT reproduce it in output text:

─── SIGNAL METRICS ≠ MUSICAL QUALITY ────────────────────────────────────────────
The DERIVED SCORES and KEY METRICS above are RAW SIGNAL MEASUREMENTS from the audio analysis pipeline.
They measure acoustic properties of the recording, NOT musical skill. You MUST override them with your
own musical judgment when they contradict the observations.

  dynamics_score    = amplitude range of the recording. A loud background noise, a sneeze, or just
                      recording inconsistency can inflate this. A musically controlled performance
                      recorded at a consistent volume will look "flat" even if dynamics are excellent.
                      DO NOT use this score as a measure of musical dynamic skill.

  articulation_score = a proxy based on timing consistency, NOT attack clarity or tongue technique.
                      A player with blurry tonguing but steady rhythm may score high here.
                      A player with precise double tongue but rushing tendencies may score low.
                      DO NOT use this score as a measure of actual articulation quality.

  timing_score      = inter-onset interval regularity. This is the most reliable metric and most
                      directly correlates to musical rhythm — but it does NOT account for rubato,
                      ritardando, or intentional expressivity.

RULE: Your category scores must be grounded in the OBSERVATIONS and your musical expertise,
NOT the numerical shortcuts above. If observations describe poor dynamics but the derived
dynamics_score is high — assign a LOW dynamics category score based on what the observations say.

─── SCORING SCALE (TMEA 6A) ─────────────────────────────────────────────────────
  0–35:   Beginner — fundamental issues, significant remediation needed on basics
  36–49:  Early intermediate — basic skills present but unreliable
  50–59:  Intermediate — developing, multiple clear weaknesses
  60–69:  Advanced — solid but not yet region-competitive in TMEA 6A
  70–79:  Low-to-mid Region — Region-competitive but unlikely to advance to Area
  80–84:  High Region / Low Area — competitive for Area advancement
  85–89:  Area caliber — Area-competitive, near All-State but not quite
  90–95:  All-State — meets TMEA 6A All-State selection standard
  96–100: Elite — exceeds TMEA 6A All-State expectations

MANDATORY: Use the FULL 0–100 range. A beginner and an All-State-level player should have overall
scores 40–60 points apart. If someone performs at Region level, their score should be in the 70s.
If someone performs at All-State level, their score should be in the 90s. If someone is a beginner
band kid, their score should be in the 30s. Do NOT cluster everything in 60–80 out of comfort.
Do NOT inflate out of kindness. Do NOT compress the range. Accurate scores are what helps students most.

─── TMEA 6A / REGION 24 CONTEXT ─────────────────────────────────────────────────
  Region 24 (Frisco, Prosper, McKinney area) is one of the most competitive 6A regions in Texas.
  Top players at region auditions are exceptional — the bar for advancing to Area is real and demanding.
  When this student's goal is Region, Area, or All-State, evaluate against the standard of what actual
  audition judges hear from the best players in this pipeline. Be honest about where this recording stands.

─── REST AND MUSICAL SILENCE ─────────────────────────────────────────────────────
  The analysis pipeline measures audio signal. Rests, breath marks, held fermatas, and notated silence
  create gaps in onset data. Do NOT score these as poor timing or penalize them in any category.
  Only evaluate playing quality during active performance sections. A well-placed rest is correct musicianship.

─── PIECE/ETUDE IDENTIFICATION ───────────────────────────────────────────────────
  If context — instrument, level, or common TMEA 6A repertoire patterns — suggests the piece, excerpt,
  or etude being performed, apply your knowledge of how elite players interpret that material: characteristic
  tone, stylistic articulation, expected dynamic shape, common interpretive choices. Frame "what great sounds
  like on this piece" from that reference without explicitly naming sources.

─── PLAYER DIFFERENTIATION ───────────────────────────────────────────────────────
  Every sentence of feedback must reflect this specific player at this specific level.
  A student scoring 73 gets different language, expectations, and next-step advice than one scoring 88.
  Make the feedback feel like it was written for this recording, not pasted from a template.

CRITICAL WRITING RULES — read carefully before generating any text:
- Write like the best private lesson teacher on earth talking directly to this student. Not a report — a real lesson.
- NEVER include raw numbers, percentages, dB values, Hz values, BPM values, or technical metric names in observation, cause, impact, or fix fields.
- Translate every measurement into what the player actually hears, feels, or experiences:
    BAD: "Timing consistency is 68.3% with a rushing tendency of 24%."
    GOOD: "Your tempo rushes in faster passages — you pull ahead of the beat when things get technically demanding."
    BAD: "Dynamic range is 14.2 dB."
    GOOD: "Your loud and soft playing sound almost the same volume, which flattens the musical shape of each phrase."
- Be instrument-specific in every coaching point. Address the actual physical mechanics for this instrument:
    Saxophone: tongue position (anchor vs. free), voicing, reed response, air speed/direction, embouchure corners
    Clarinet: throat tones, register crossings, mouthpiece angle, tongue arch
    Trumpet: aperture, lip compression, slotting, valve speed, air column support
    Violin/Viola: bow speed and weight, contact point, bow distribution, left hand frame, shifting
    Cello/Bass: bow arm weight, string crossings, thumb position, intonation adjustment strategies
    Generic phrases like "support with air" or "work on tone" are not acceptable without instrument-specific mechanics.
- Be specific about WHERE issues happen (timestamps). Describe them in musical or physical terms only.
- Fix and drill fields must be immediately actionable — what to feel, what to listen for, what success sounds like.
- Give credit where it's due: if a category is genuinely strong, say so clearly and specifically.
- Use language a motivated 6th grader can understand that a college musician still finds substantive.
- Every observation must feel written for this exact recording, not copied from a template.

The report must:
1. Cover every rubric category with a score, observation, cause, impact, and fix
2. Include timestamp-specific feedback items for any localized issues
3. Provide a gap analysis showing what is needed to reach the target level
4. Use your persona's voice consistently throughout
${hasReference ? '5. Reference material IS attached — reference score-specific context (note accuracy, rhythm, tempo) in musical terms, not metric terms.' : '5. No reference material — do NOT claim note-level accuracy. Focus on sound quality, expression, and timing.'}

If a rubric category has no strong metric signal, say honestly what you can observe from the overall performance character.`
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// ── Tool definition for structured output ─────────────────────────────────

export const FEEDBACK_TOOL = {
  name: 'generate_feedback',
  description: 'Generate a complete structured feedback report for the student recording.',
  input_schema: {
    type: 'object' as const,
    required: ['summary', 'estimated_level', 'overall_score', 'category_scores', 'timestamp_items', 'gap_analysis'],
    properties: {
      summary: {
        type: 'string',
        description: '2–3 sentences spoken directly to the student. Say what stood out — good and bad — in plain musical language. No statistics. Sound like a teacher, not a report.',
      },
      estimated_level: {
        type: 'string',
        enum: ['beginner', 'intermediate', 'advanced', 'region', 'area', 'all-state', 'college', 'conservatory', 'professional'],
        description: 'Estimated competitive level. For TMEA context: "region" = competitive in TMEA 6A Region 24, "area" = area-competitive, "all-state" = All-State selection caliber. Must match your overall_score on the calibration scale.',
      },
      overall_score: {
        type: 'number',
        description: 'Weighted composite score 0–100, calibrated to the TMEA 6A scale: 90+ = All-State, 85-89 = Area, 70-84 = Region, 60-69 = Advanced, 50-59 = Intermediate, below 50 = Beginner. Be accurate — do not inflate.',
      },
      category_scores: {
        type: 'array',
        description: 'One entry per rubric category.',
        items: {
          type: 'object',
          required: ['id', 'name', 'score', 'weight', 'observation', 'likely_cause', 'impact', 'fix'],
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            score: { type: 'number', description: '0–100' },
            weight: { type: 'number', description: 'Rubric weight 0–1' },
            observation: { type: 'string', description: 'What a listener actually hears or what the player experiences. No numbers or metric names. 1–2 sentences.' },
            likely_cause: { type: 'string', description: 'The physical or musical reason this is happening — what the player is doing with their body, air, embouchure, bow, fingers, etc. 1 sentence.' },
            impact: { type: 'string', description: 'How this hurts the performance — what a judge or teacher would notice. 1 sentence in plain language.' },
            fix: { type: 'string', description: 'Exactly what to change — what to feel, what to listen for, what to aim for. Actionable and concrete, no stats. 1–2 sentences.' },
          },
        },
      },
      timestamp_items: {
        type: 'array',
        description: 'Timestamp-specific observations. Only include if there is a localized observation with a time reference.',
        items: {
          type: 'object',
          required: ['start_time', 'end_time', 'display_time', 'category', 'severity', 'observation', 'likely_cause', 'impact', 'fix', 'drill', 'priority'],
          properties: {
            start_time: { type: 'number' },
            end_time: { type: 'number' },
            display_time: { type: 'string', description: 'e.g. "0:42–0:51"' },
            category: { type: 'string' },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
            observation: { type: 'string', description: 'What a listener hears at this exact moment. No numbers — describe the sound and feel.' },
            likely_cause: { type: 'string', description: 'Physical or musical root cause in plain language.' },
            impact: { type: 'string', description: 'Why this moment matters for the overall performance.' },
            fix: { type: 'string', description: 'What to change at this exact spot. Concrete and physical.' },
            drill: { type: 'string', description: 'A step-by-step practice drill for this issue. You may include a suggested tempo marking (e.g. "start slow, around half speed") but describe it musically. No raw metric values. Tell the student what to listen for and what success feels like.' },
            priority: { type: 'number', description: '1 = highest priority' },
          },
        },
      },
      gap_analysis: {
        type: 'object',
        required: ['current_level', 'target_level', 'gaps'],
        properties: {
          current_level: { type: 'string' },
          target_level: { type: ['string', 'null'] },
          gaps: {
            type: 'array',
            items: {
              type: 'object',
              required: ['category', 'category_name', 'current_score', 'target_score', 'delta', 'priority'],
              properties: {
                category: { type: 'string' },
                category_name: { type: 'string' },
                current_score: { type: 'number' },
                target_score: { type: 'number', description: 'Score needed in this category to reach the target level, per the TMEA 6A calibration scale.' },
                delta: { type: 'number', description: 'target_score - current_score' },
                priority: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
}
