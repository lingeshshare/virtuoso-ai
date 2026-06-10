import { getBenchmarkScore } from './benchmarks'
import type { GapItem } from './types'

export interface GapAnalysisResult {
  currentLevel: string
  targetLevel: string
  readinessPct: number
  gaps: GapItem[]
  categoriesMet: string[]
  topPriorities: GapItem[]
}

export function computeGapAnalysis(
  categoryScores: Record<string, number>,
  rubricCategories: Array<{ id: string; name: string; weight: number }>,
  currentLevel: string,
  targetLevel: string,
): GapAnalysisResult {
  const gaps: GapItem[] = []
  const categoriesMet: string[] = []

  for (const cat of rubricCategories) {
    const currentScore = categoryScores[cat.id] ?? 0
    const targetScore = getBenchmarkScore(targetLevel, cat.id)
    const delta = targetScore - currentScore

    gaps.push({
      category: cat.id,
      category_name: cat.name,
      current_score: Math.round(currentScore),
      target_score: targetScore,
      delta: Math.round(delta),
      priority: 0,
    })

    if (currentScore >= targetScore) categoriesMet.push(cat.id)
  }

  // Largest gap first; categories already meeting target sort to end
  gaps.sort((a, b) => b.delta - a.delta)
  gaps.forEach((g, i) => { g.priority = i + 1 })

  const readinessPct = rubricCategories.length === 0
    ? 0
    : Math.round((categoriesMet.length / rubricCategories.length) * 100)

  const topPriorities = gaps.filter((g) => g.delta > 0).slice(0, 3)

  return { currentLevel, targetLevel, readinessPct, gaps, categoriesMet, topPriorities }
}
