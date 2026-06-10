// Instrument-specific scoring rubrics.
// Weights must sum to 1.0 per instrument.
// These drive the weighted scorecard in Phase 2 and the coaching prompt in Phase 5.

export interface RubricCategory {
  id: string
  name: string
  description: string
  baseWeight: number // 0–1, sums to 1.0 across all categories for an instrument
}

export interface InstrumentRubric {
  instrumentId: string
  categories: RubricCategory[]
}

export const INSTRUMENT_RUBRICS: Record<string, RubricCategory[]> = {
  // ── Saxophones ──────────────────────────────────────────────────────────────
  'alto-saxophone': [
    { id: 'tone', name: 'Tone Quality', description: 'Core sound, resonance, reed response, voicing', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy, octave tendencies, altissimo register', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Tongue clarity, consistency across tempos, style', baseWeight: 0.20 },
    { id: 'dynamics', name: 'Dynamics', description: 'Range control, gradients, expression', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, line sense, style awareness', baseWeight: 0.15 },
    { id: 'air', name: 'Air Support', description: 'Steady air stream, support through range changes', baseWeight: 0.10 },
  ],
  'tenor-saxophone': [
    { id: 'tone', name: 'Tone Quality', description: 'Warm core sound, lower register richness', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Pitch centering, octave key tendencies', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Tongue consistency, jazz vs classical style', baseWeight: 0.20 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range, control', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, expression', baseWeight: 0.15 },
    { id: 'air', name: 'Air Support', description: 'Consistent air stream through the full range', baseWeight: 0.10 },
  ],
  'soprano-saxophone': [
    { id: 'intonation', name: 'Intonation', description: 'Pitch centering — especially challenging on soprano', baseWeight: 0.25 },
    { id: 'tone', name: 'Tone Quality', description: 'Clear, centered, not spread or thin', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Clarity, consistency across range', baseWeight: 0.20 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range and control', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, expression', baseWeight: 0.10 },
    { id: 'air', name: 'Air Support', description: 'Consistent air stream and embouchure stability', baseWeight: 0.10 },
  ],
  'baritone-saxophone': [
    { id: 'tone', name: 'Tone Quality', description: 'Rich, full core sound in low register', baseWeight: 0.25 },
    { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy across wide range', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Clarity, especially in lower register', baseWeight: 0.20 },
    { id: 'dynamics', name: 'Dynamics', description: 'Range from ppp to fff', baseWeight: 0.15 },
    { id: 'air', name: 'Air Support', description: 'High air demand management', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping', baseWeight: 0.10 },
  ],

  // ── Clarinets ───────────────────────────────────────────────────────────────
  'clarinet': [
    { id: 'tone', name: 'Tone Clarity', description: 'Pure, centered clarinet tone — not spread or edgy', baseWeight: 0.20 },
    { id: 'register', name: 'Register Consistency', description: 'Chalumeau/throat/clarion/altissimo balance and evenness', baseWeight: 0.20 },
    { id: 'break', name: 'Break Crossings', description: 'Smooth register transitions, especially around B♭/C', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Throat tone tendencies, barrel, and mouthpiece adjustment', baseWeight: 0.15 },
    { id: 'articulation', name: 'Articulation', description: 'Tongue position, clarity, consistency', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, color variety', baseWeight: 0.10 },
  ],
  'bass-clarinet': [
    { id: 'tone', name: 'Tone Core', description: 'Full, resonant bass clarinet sound', baseWeight: 0.25 },
    { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy across wide range', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Clarity in lower register', baseWeight: 0.20 },
    { id: 'register', name: 'Register Evenness', description: 'Low/middle/upper register consistency', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range control', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping', baseWeight: 0.10 },
  ],

  // ── Flute ───────────────────────────────────────────────────────────────────
  'flute': [
    { id: 'tone', name: 'Tone Color', description: 'Flexibility, warmth vs brilliance, color variety', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Embouchure control, head joint adjustment, third octave', baseWeight: 0.20 },
    { id: 'dynamics', name: 'Dynamics', description: 'Extreme range — ppp to fff — and in-phrase gradients', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Tah/dah/tee syllables, double tongue clarity', baseWeight: 0.15 },
    { id: 'air', name: 'Air Stream', description: 'Direction, speed, consistency across range', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, expression, style', baseWeight: 0.10 },
  ],

  // ── Oboe ────────────────────────────────────────────────────────────────────
  'oboe': [
    { id: 'reed', name: 'Reed Response', description: 'Control, consistency, dynamic response', baseWeight: 0.25 },
    { id: 'tone', name: 'Tone Quality', description: 'Core resonance, not nasal or spread', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Inherent oboe pitch challenges, upper octave', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Single and double tongue clarity', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic control — especially pp is hard on oboe', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, singing quality', baseWeight: 0.10 },
  ],

  // ── Bassoon ─────────────────────────────────────────────────────────────────
  'bassoon': [
    { id: 'tone', name: 'Tone Core', description: 'Rich, resonant bassoon character', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Tenor register challenges, bocal adjustment', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Clean tonguing, especially in low register', baseWeight: 0.20 },
    { id: 'range', name: 'Range Evenness', description: 'Low/tenor/high register consistency', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range and control', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, legato playing', baseWeight: 0.10 },
  ],

  // ── Brass ───────────────────────────────────────────────────────────────────
  'trumpet': [
    { id: 'slotting', name: 'Tone & Slotting', description: 'Center of note, lip buzz focus, core sound', baseWeight: 0.20 },
    { id: 'range', name: 'Range Control', description: 'High register management, upper lip flexibility', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Third valve slide, tuning slide management', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Single/double tongue clarity, style', baseWeight: 0.20 },
    { id: 'endurance', name: 'Endurance', description: 'Consistency maintained across full piece', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, color, expression', baseWeight: 0.10 },
  ],
  'french-horn': [
    { id: 'tone', name: 'Tone Quality', description: 'Round, warm, horn-like core sound', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Natural tendency management, hand stopping', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Clarity through the bell, legato vs staccato', baseWeight: 0.20 },
    { id: 'range', name: 'Range Consistency', description: 'Low-to-high evenness, no cracking', baseWeight: 0.20 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, blend, expression', baseWeight: 0.10 },
    { id: 'technique', name: 'Hand Technique', description: 'Bell hand position, stopped horn', baseWeight: 0.10 },
  ],
  'trombone': [
    { id: 'slide', name: 'Slide Accuracy', description: 'Position precision, slide speed, legato slide', baseWeight: 0.20 },
    { id: 'tone', name: 'Tone Quality', description: 'Core, resonant trombone sound', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Slide position ear, F attachment tendencies', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Tongue-slide coordination, legato vs tongued', baseWeight: 0.15 },
    { id: 'legato', name: 'Legato Playing', description: 'Smooth slide technique, slur without glissando', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, style, expression', baseWeight: 0.10 },
  ],
  'bass-trombone': [
    { id: 'tone', name: 'Tone Core', description: 'Full, dark bass trombone character', baseWeight: 0.25 },
    { id: 'slide', name: 'Slide Accuracy', description: 'Position precision, extended positions', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Low register pitch accuracy', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Clarity in low register', baseWeight: 0.15 },
    { id: 'range', name: 'Low Range', description: 'Pedal tones, extreme low register', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping', baseWeight: 0.10 },
  ],
  'euphonium': [
    { id: 'tone', name: 'Tone Quality', description: 'Rich, warm euphonium character', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Valve tendencies, tuning slide management', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Tongue clarity, triple tongue in faster passages', baseWeight: 0.20 },
    { id: 'range', name: 'Range', description: 'Low-to-high evenness and control', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic control and expression', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Singing quality, legato line', baseWeight: 0.10 },
  ],
  'tuba': [
    { id: 'tone', name: 'Tone Core', description: 'Big, centered, resonant tuba foundation', baseWeight: 0.25 },
    { id: 'intonation', name: 'Intonation', description: 'Valve tendencies, tuning across range', baseWeight: 0.20 },
    { id: 'articulation', name: 'Articulation', description: 'Clarity, especially in lower register', baseWeight: 0.20 },
    { id: 'range', name: 'Range Evenness', description: 'Low pedal through upper range', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range — tuba pp is especially difficult', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, ensemble awareness', baseWeight: 0.10 },
  ],

  // ── Strings ─────────────────────────────────────────────────────────────────
  'violin': [
    { id: 'bow', name: 'Bow Control', description: 'Speed, weight, contact point, spiccato, sautillé', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy — most critical for string players', baseWeight: 0.25 },
    { id: 'tone', name: 'Tone Quality', description: 'Resonance, warmth, projection', baseWeight: 0.20 },
    { id: 'shifting', name: 'Shifting', description: 'Position changes, accuracy, smoothness', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range and bow control relationship', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, vibrato control, expression', baseWeight: 0.10 },
  ],
  'viola': [
    { id: 'bow', name: 'Bow Control', description: 'Weight into string — viola requires more than violin', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy, especially on C string', baseWeight: 0.25 },
    { id: 'tone', name: 'Tone Quality', description: 'Rich C string resonance, viola character', baseWeight: 0.20 },
    { id: 'shifting', name: 'Shifting', description: 'Position accuracy, smoothness', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range and bow weight', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, color, expression', baseWeight: 0.10 },
  ],
  'cello': [
    { id: 'bow', name: 'Bow Control', description: 'Arm weight, speed, contact point precision', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy across all positions', baseWeight: 0.25 },
    { id: 'tone', name: 'Tone Quality', description: 'Resonance, richness, projection', baseWeight: 0.20 },
    { id: 'thumb', name: 'Thumb Position', description: 'Upper position accuracy and evenness', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range and bow relationship', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, singing quality', baseWeight: 0.10 },
  ],
  'double-bass': [
    { id: 'bow', name: 'Bow Grip & Control', description: 'French vs German bow, arm weight', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy — wide intervals are challenging', baseWeight: 0.25 },
    { id: 'tone', name: 'Tone Quality', description: 'Core, resonant bass sound', baseWeight: 0.20 },
    { id: 'shifting', name: 'Shifting', description: 'Position changes across the wide fingerboard', baseWeight: 0.15 },
    { id: 'rhythm', name: 'Rhythm Precision', description: 'Steady beat, subdivision accuracy', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, expression', baseWeight: 0.10 },
  ],

  // ── Keyboard & Percussion ───────────────────────────────────────────────────
  'piano': [
    { id: 'touch', name: 'Touch & Tone', description: 'Voicing, legato connection, key depth', baseWeight: 0.25 },
    { id: 'rhythm', name: 'Rhythm & Tempo', description: 'Steady pulse, internal subdivision', baseWeight: 0.20 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range — piano has enormous range', baseWeight: 0.20 },
    { id: 'pedal', name: 'Pedaling', description: 'Sustain pedal timing, legato pedal', baseWeight: 0.15 },
    { id: 'articulation', name: 'Articulation', description: 'Staccato, legato, non-legato precision', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, expression, style', baseWeight: 0.10 },
  ],
  'marimba': [
    { id: 'mallet', name: 'Mallet Control', description: 'Stroke consistency, dead stroke vs open stroke', baseWeight: 0.20 },
    { id: 'tone', name: 'Tone Quality', description: 'Mallet angle, resonance, projection', baseWeight: 0.20 },
    { id: 'intonation', name: 'Intonation', description: 'Mallet striking point, bar resonance', baseWeight: 0.20 },
    { id: 'rhythm', name: 'Rhythm Precision', description: 'Subdivision accuracy, roll consistency', baseWeight: 0.20 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range and mallet control relationship', baseWeight: 0.10 },
    { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, expression', baseWeight: 0.10 },
  ],
  'vibraphone': [
    { id: 'mallet', name: 'Mallet Control', description: 'Four-mallet technique, interval voicing', baseWeight: 0.20 },
    { id: 'damping', name: 'Damping & Motor', description: 'Pedal technique, motor speed for vibrato', baseWeight: 0.20 },
    { id: 'tone', name: 'Tone Quality', description: 'Resonant, warm vibraphone character', baseWeight: 0.20 },
    { id: 'rhythm', name: 'Rhythm Precision', description: 'Subdivision, roll evenness', baseWeight: 0.15 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic control through mallet and damping', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Jazz style, phrase shaping', baseWeight: 0.10 },
  ],
  'snare-drum': [
    { id: 'stroke', name: 'Stroke Consistency', description: 'Even single strokes, uniform stick heights', baseWeight: 0.25 },
    { id: 'rudiments', name: 'Rudiment Clarity', description: 'Flams, drags, rolls — clean and precise', baseWeight: 0.25 },
    { id: 'dynamics', name: 'Dynamics', description: 'Full range ppp to fff, snare sensitivity', baseWeight: 0.20 },
    { id: 'rhythm', name: 'Tempo Steadiness', description: 'Internal clock, subdivision accuracy', baseWeight: 0.20 },
    { id: 'musicality', name: 'Musicality', description: 'Style, expression, snare sensitivity adjustment', baseWeight: 0.10 },
  ],
  'timpani': [
    { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy — pedal tuning is critical', baseWeight: 0.30 },
    { id: 'stroke', name: 'Stroke Quality', description: 'Stroke consistency, rebound, muffling', baseWeight: 0.25 },
    { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range and mallet choice', baseWeight: 0.20 },
    { id: 'rhythm', name: 'Rhythm Precision', description: 'Steady tempo, subdivision', baseWeight: 0.15 },
    { id: 'musicality', name: 'Musicality', description: 'Style, ensemble listening', baseWeight: 0.10 },
  ],
}

// Default rubric for instruments not yet explicitly defined
export const DEFAULT_RUBRIC: RubricCategory[] = [
  { id: 'tone', name: 'Tone Quality', description: 'Core sound, resonance, characteristic tone', baseWeight: 0.20 },
  { id: 'intonation', name: 'Intonation', description: 'Pitch accuracy and centering', baseWeight: 0.20 },
  { id: 'articulation', name: 'Articulation', description: 'Attack clarity, style consistency', baseWeight: 0.20 },
  { id: 'dynamics', name: 'Dynamics', description: 'Dynamic range and control', baseWeight: 0.20 },
  { id: 'musicality', name: 'Musicality', description: 'Phrase shaping, expression', baseWeight: 0.10 },
  { id: 'rhythm', name: 'Rhythm', description: 'Tempo steadiness, subdivision', baseWeight: 0.10 },
]

export function getRubric(instrumentId: string): RubricCategory[] {
  return INSTRUMENT_RUBRICS[instrumentId] ?? DEFAULT_RUBRIC
}

// Apply persona weight adjustments and return a properly-typed RubricCategory[] with renormalized weights.
// Imported from rubrics.ts so call sites have a single import.
export function applyPersonaWeights(
  baseRubric: RubricCategory[],
  personaDef: { weightAdjustments: Record<string, number> },
): RubricCategory[] {
  let total = 0
  const raw: Record<string, number> = {}
  for (const cat of baseRubric) {
    raw[cat.id] = Math.max(0.03, cat.baseWeight + (personaDef.weightAdjustments[cat.id] ?? 0))
    total += raw[cat.id]
  }
  return baseRubric.map((cat) => ({
    ...cat,
    baseWeight: parseFloat((raw[cat.id] / total).toFixed(3)),
  }))
}

// Compute weighted overall score from category scores and rubric
export function computeWeightedScore(
  categoryScores: Record<string, number>,
  rubric: RubricCategory[]
): number {
  let weighted = 0
  let totalWeight = 0
  for (const cat of rubric) {
    const score = categoryScores[cat.id]
    if (score !== undefined) {
      weighted += score * cat.baseWeight
      totalWeight += cat.baseWeight
    }
  }
  return totalWeight > 0 ? Math.round(weighted / totalWeight) : 0
}
