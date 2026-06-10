// Minimum category scores a performer at each level should achieve.
// Used by the gap analysis engine to compute audition readiness.
// Calibrated to TMEA 6A: 90+ = All-State, 85-89 = Area, 70-84 = Region,
// 60-69 = Advanced, 50-59 = Intermediate, <50 = Beginner.

export interface LevelBenchmark {
  levelId: string
  categoryDefaults: number
  categoryOverrides: Record<string, number>
}

export const LEVEL_BENCHMARKS: Record<string, LevelBenchmark> = {
  beginner: {
    levelId: 'beginner',
    categoryDefaults: 35,
    categoryOverrides: { tone: 32, intonation: 32, dynamics: 38 },
  },
  intermediate: {
    levelId: 'intermediate',
    categoryDefaults: 50,
    categoryOverrides: { intonation: 48, musicality: 47 },
  },
  advanced: {
    levelId: 'advanced',
    categoryDefaults: 60,
    categoryOverrides: { intonation: 58, articulation: 59, musicality: 58 },
  },
  region: {
    levelId: 'region',
    categoryDefaults: 70,
    categoryOverrides: { intonation: 68, articulation: 67, dynamics: 68, musicality: 67 },
  },
  area: {
    levelId: 'area',
    categoryDefaults: 85,
    categoryOverrides: { intonation: 83, articulation: 83, dynamics: 83, musicality: 82 },
  },
  'all-state': {
    levelId: 'all-state',
    categoryDefaults: 90,
    categoryOverrides: { intonation: 88, articulation: 88, dynamics: 87, musicality: 87 },
  },
  college: {
    levelId: 'college',
    categoryDefaults: 92,
    categoryOverrides: { intonation: 91, articulation: 91, dynamics: 90, musicality: 90 },
  },
  conservatory: {
    levelId: 'conservatory',
    categoryDefaults: 94,
    categoryOverrides: { intonation: 93, articulation: 93, dynamics: 92, musicality: 92 },
  },
  professional: {
    levelId: 'professional',
    categoryDefaults: 97,
    categoryOverrides: { intonation: 96, articulation: 96, dynamics: 96, musicality: 95 },
  },
}

export function getBenchmarkScore(levelId: string, categoryId: string): number {
  const benchmark = LEVEL_BENCHMARKS[levelId]
  if (!benchmark) return 75
  return benchmark.categoryOverrides[categoryId] ?? benchmark.categoryDefaults
}
