import type { PerformanceLevel } from '@/lib/types'

export const PERFORMANCE_LEVELS: PerformanceLevel[] = [
  {
    id: 'beginner',
    label: 'Beginner',
    description: 'Learning fundamentals, first 1–2 years of study',
    rank: 1,
    tier: 'foundation',
    color: '#374151',
    textColor: '#9ca3af',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    description: 'Comfortable with scales and standard band/orchestra repertoire',
    rank: 2,
    tier: 'foundation',
    color: '#1e3a5f',
    textColor: '#60a5fa',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    description: 'Performing challenging repertoire with consistency and control',
    rank: 3,
    tier: 'foundation',
    color: '#064e3b',
    textColor: '#34d399',
  },
  {
    id: 'region',
    label: 'Region',
    description: 'Competing at regional honor band / orchestra level',
    rank: 4,
    tier: 'competitive',
    color: '#78350f',
    textColor: '#fbbf24',
  },
  {
    id: 'area',
    label: 'Area',
    description: 'Competing at area honor band / orchestra — top regional performers',
    rank: 5,
    tier: 'competitive',
    color: '#7c2d12',
    textColor: '#fb923c',
  },
  {
    id: 'all-state',
    label: 'All-State',
    description: 'Among the top student performers in the state',
    rank: 6,
    tier: 'elite',
    color: '#4a1d96',
    textColor: '#a78bfa',
  },
  {
    id: 'college',
    label: 'College',
    description: 'Performing at collegiate ensemble level',
    rank: 7,
    tier: 'elite',
    color: '#1e1b4b',
    textColor: '#818cf8',
  },
  {
    id: 'conservatory',
    label: 'Conservatory',
    description: 'Professional-track conservatory or university studio standard',
    rank: 8,
    tier: 'elite',
    color: '#500724',
    textColor: '#f9a8d4',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Performing career — symphony, chamber, commercial, or military bands',
    rank: 9,
    tier: 'elite',
    color: '#1a0a40',
    textColor: '#c4b5fd',
  },
]

export function getLevelById(id: string): PerformanceLevel | undefined {
  return PERFORMANCE_LEVELS.find((l) => l.id === id)
}

export function getLevelsAboveOrEqual(rankThreshold: number): PerformanceLevel[] {
  return PERFORMANCE_LEVELS.filter((l) => l.rank >= rankThreshold)
}
