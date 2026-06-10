import type { CoachingPersona, PersonaConfig } from '@/lib/types'

// Each persona applies weight adjustments to the base instrument rubric.
// adjustments: positive = emphasize this category more; negative = de-emphasize.
// After applying adjustments, weights are renormalized to sum to 1.0.

export interface PersonaDefinition extends PersonaConfig {
  emoji: string
  weightAdjustments: Record<string, number>
  // Which rubric categories this persona highlights with a visual callout
  priorityCategories: string[]
  // Sample intro line — used in Phase 5 to prime Claude's voice
  voicePromptPrefix: string
}

export const PERSONAS: PersonaDefinition[] = [
  {
    id: 'clinician',
    label: 'Clinician',
    description: 'Technical, measurement-driven feedback. Objective and precise.',
    emoji: '🔬',
    focusAreas: ['pitch accuracy', 'onset timing', 'dynamic range', 'technical consistency'],
    tone: 'Objective, technical, data-referenced',
    weightAdjustments: { intonation: 0.05, articulation: 0.05, tone: 0, dynamics: 0, musicality: -0.05, air: -0.05 },
    priorityCategories: ['intonation', 'articulation', 'rhythm'],
    voicePromptPrefix:
      'You are a clinician analyzing this performance with objective, technical precision. Reference measurements and quantifiable observations. Avoid emotional language.',
  },
  {
    id: 'all-state-judge',
    label: 'All-State Judge',
    description: 'Audition-standard feedback. Evaluates against competitive benchmarks.',
    emoji: '🏆',
    focusAreas: ['audition criteria', 'deduction identification', 'competitive ranking', 'consistency under pressure'],
    tone: 'Evaluative, standard-focused, ranking-conscious',
    weightAdjustments: { articulation: 0.08, intonation: 0.08, tone: 0.02, musicality: -0.05, air: -0.05, dynamics: -0.08 },
    priorityCategories: ['articulation', 'intonation', 'tone'],
    voicePromptPrefix:
      'You are a TMEA 6A All-State audition judge. Evaluate this performance against the actual standard for All-State selection in Region 24. Identify every deduction a real judge would mark. Be as strict as the real audition — nothing passes that would not pass on an actual ballot.',
  },
  {
    id: 'conservatory-professor',
    label: 'Conservatory Professor',
    description: 'Long-term artistic development. Demands professional standard.',
    emoji: '🎓',
    focusAreas: ['artistic development', 'professional standard', 'long-term trajectory', 'stylistic depth'],
    tone: 'Demanding, growth-focused, artistically rigorous',
    weightAdjustments: { tone: 0.05, musicality: 0.08, intonation: 0.02, articulation: 0, dynamics: 0.02, air: -0.07 },
    priorityCategories: ['tone', 'musicality', 'intonation'],
    voicePromptPrefix:
      'You are a conservatory professor evaluating this audition recording. Hold the student to a professional standard. Be demanding but constructive. Reference long-term artistic development.',
  },
  {
    id: 'band-director',
    label: 'Band Director',
    description: 'Ensemble-focused, practical, audition-prep oriented.',
    emoji: '📋',
    focusAreas: ['ensemble readiness', 'practical technique', 'audition preparation', 'section-level consistency'],
    tone: 'Practical, direct, ensemble-aware, motivational',
    weightAdjustments: { rhythm: 0.05, articulation: 0.03, dynamics: 0.03, tone: -0.02, musicality: -0.04, air: -0.05 },
    priorityCategories: ['rhythm', 'articulation', 'dynamics'],
    voicePromptPrefix:
      'You are a band director coaching a student for district and state auditions. Be direct and practical. Focus on what will make this student stand out in an audition setting.',
  },
  {
    id: 'private-teacher',
    label: 'Private Teacher',
    description: 'Warm, encouraging, fundamentals-focused coaching.',
    emoji: '👩‍🏫',
    focusAreas: ['fundamentals', 'confidence building', 'incremental improvement', 'habit formation'],
    tone: 'Encouraging, relationship-oriented, patient, specific',
    weightAdjustments: { tone: 0.05, dynamics: 0.03, musicality: 0.05, articulation: -0.03, intonation: -0.03, air: -0.07 },
    priorityCategories: ['tone', 'musicality', 'dynamics'],
    voicePromptPrefix:
      'You are a caring and experienced private teacher coaching your student through a practice recording. Be warm, specific, and encouraging. Celebrate strengths before addressing weaknesses.',
  },
]

export function getPersonaById(id: CoachingPersona): PersonaDefinition | undefined {
  return PERSONAS.find((p) => p.id === id)
}

export const DEFAULT_PERSONA: CoachingPersona = 'clinician'

// Apply persona weight adjustments to a rubric and return renormalized weights
export function applyPersonaWeights(
  baseCategories: Array<{ id: string; baseWeight: number }>,
  persona: PersonaDefinition
): Record<string, number> {
  const adjusted: Record<string, number> = {}
  let total = 0

  for (const cat of baseCategories) {
    const delta = persona.weightAdjustments[cat.id] ?? 0
    adjusted[cat.id] = Math.max(0.03, cat.baseWeight + delta)
    total += adjusted[cat.id]
  }

  // Normalize to sum to 1.0
  const normalized: Record<string, number> = {}
  for (const id in adjusted) {
    normalized[id] = parseFloat((adjusted[id] / total).toFixed(3))
  }
  return normalized
}
