// ─── Instrument & Level ───────────────────────────────────────────────────────

export interface Instrument {
  id: string
  label: string
  emoji: string
  family: 'woodwind' | 'brass' | 'string' | 'keyboard' | 'percussion'
}

export interface InstrumentCategory {
  id: string
  label: string
  instruments: Instrument[]
}

export interface PerformanceLevel {
  id: string
  label: string
  description: string
  rank: number
  tier: 'foundation' | 'competitive' | 'elite'
  color: string
  textColor: string
}

// ─── User & Onboarding ────────────────────────────────────────────────────────

export interface UserProfile {
  id: string
  email: string
  instrument: string
  currentLevel: string
  targetLevel: string
  createdAt: string
  onboardingCompleted: boolean
}

export interface OnboardingState {
  instrument: string | null
  currentLevel: string | null
  targetLevel: string | null
}

// ─── Recording ────────────────────────────────────────────────────────────────

export type RecordingStatus = 'uploading' | 'processing' | 'analyzed' | 'error'

export interface Recording {
  id: string
  userId: string
  instrument: string
  title?: string
  durationSeconds: number
  fileUrl: string
  status: RecordingStatus
  createdAt: string
  metrics?: AudioMetrics
  feedback?: FeedbackReport
}

// ─── Audio Metrics (Phase 4 — structured JSON from audio engine) ──────────────

export type AudioEngine = 'librosa' | 'crepe' | 'basic-pitch' | 'essentia'

export interface AudioMetrics {
  engine: AudioEngine
  duration: number
  sampleRate: number
  tempo: number
  tempoStability: number // 0–1
  dynamicsRange: number // dB
  averageLoudness: number // LUFS
  onsets: OnsetEvent[]
  pitchTrack?: PitchSample[]
  pitchAccuracy?: number // 0–1 (requires reference)
  intonationScore?: number // 0–100
  notes?: DetectedNote[]
}

export interface OnsetEvent {
  timestamp: number // seconds
  strength: number // 0–1
  pitch?: number // Hz
}

export interface PitchSample {
  timestamp: number
  hz: number
  confidence: number
}

export interface DetectedNote {
  startTime: number
  endTime: number
  pitch: number // Hz
  midi: number
  velocity: number
}

// ─── Feedback Report (Phase 5 — coaching engine output) ──────────────────────

export interface FeedbackReport {
  recordingId: string
  overallScore: number // 0–100
  estimatedLevel: string
  targetLevel: string
  summary: string
  timestampFeedback: TimestampFeedback[]
  categories: CategoryScore[]
  practiceRecommendations: PracticeItem[]
  gapAnalysis: GapAnalysis
  generatedAt: string
  coachingPersona?: CoachingPersona
}

export type FeedbackType = 'positive' | 'warning' | 'critical'
export type Priority = 'low' | 'medium' | 'high'

export interface TimestampFeedback {
  id: string
  startTime: number
  endTime?: number
  type: FeedbackType
  category: string
  observation: string
  likelyCause: string
  impact: string
  fix: string
  drill?: string
  priority: Priority
}

export interface CategoryScore {
  id: string
  name: string
  score: number
  maxScore: number
  weight: number
  observations: string[]
}

export interface GapAnalysis {
  currentLevel: string
  targetLevel: string
  gaps: Gap[]
  estimatedWeeksToTarget?: number
}

export interface Gap {
  dimension: string
  currentScore: number
  targetScore: number
  delta: number
  priority: number
}

// ─── Practice Plan ────────────────────────────────────────────────────────────

export interface PracticeItem {
  id: string
  title: string
  durationMinutes: number
  bpm?: number
  description: string
  tags: string[]
  priority: Priority
  drillType: 'technical' | 'musical' | 'repetition' | 'slow-practice' | 'sectional'
}

// ─── Coaching Personas (Phase 2) ──────────────────────────────────────────────

export type CoachingPersona =
  | 'clinician'
  | 'all-state-judge'
  | 'conservatory-professor'
  | 'band-director'
  | 'private-teacher'

export interface PersonaConfig {
  id: CoachingPersona
  label: string
  description: string
  focusAreas: string[]
  tone: string
}

// ─── Progress (Phase 2) ───────────────────────────────────────────────────────

export interface ProgressDataPoint {
  date: string
  overallScore: number
  categories: Record<string, number>
  level: string
}
