/**
 * Practice plan prompt — second Claude call that generates a weekly practice schedule.
 */
import type { CoachingReport } from '../types'

export function buildPracticePrompt(report: CoachingReport, instrument: string, level: string): string {
  const topIssues = report.category_scores
    .filter((c) => c.score < 80)
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((c) => `  - ${c.name} (score: ${c.score}): ${c.fix}`)
    .join('\n')

  const timestampSummary = report.timestamp_items
    .slice(0, 4)
    .map((t) => `  - ${t.display_time}: ${t.observation} — Drill: ${t.drill}`)
    .join('\n')

  return `Based on the feedback report for this ${level} ${instrument} student, generate a 7-day practice plan.

TOP ISSUES TO ADDRESS:
${topIssues || '  No critical issues — focus on maintenance and musicality.'}

TIMESTAMP-SPECIFIC DRILLS NEEDED:
${timestampSummary || '  No timestamp drills.'}

Overall score: ${report.overall_score} | Target level: ${report.gap_analysis?.target_level ?? 'not specified'}

Call the generate_practice_plan tool to output a complete plan. Requirements:
- 4–7 drills total
- Each drill: exact title, description, BPM where applicable, duration in minutes, and category
- 7-day schedule (rest on at least 1 day)
- Total practice per session: 30–60 minutes
- Order drills by impact priority`
}

export const PRACTICE_PLAN_TOOL = {
  name: 'generate_practice_plan',
  description: 'Generate a 7-day targeted practice plan based on the feedback report.',
  input_schema: {
    type: 'object' as const,
    required: ['drills', 'weekly_schedule', 'total_minutes_per_day', 'focus_areas'],
    properties: {
      drills: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'title', 'description', 'duration_minutes', 'category', 'priority', 'tags', 'type'],
          properties: {
            id: { type: 'string', description: 'Short kebab-case identifier, e.g. "tongue-speed-85bpm"' },
            title: { type: 'string' },
            description: { type: 'string', description: 'Exact instructions including BPM, technique, and what to listen for.' },
            duration_minutes: { type: 'number' },
            bpm: { type: 'number', description: 'Metronome BPM if applicable.' },
            category: { type: 'string' },
            priority: { type: 'number', description: '1 = most important' },
            tags: { type: 'array', items: { type: 'string' } },
            source_observation: { type: 'string', description: 'Reference to the timestamp or category observation this drill addresses.' },
            type: { type: 'string', enum: ['technique', 'musical', 'scale', 'etude', 'long-tone', 'rhythm'] },
          },
        },
      },
      weekly_schedule: {
        type: 'object',
        description: 'Map of day → array of drill ids. At least one rest day.',
        properties: {
          monday: { type: 'array', items: { type: 'string' } },
          tuesday: { type: 'array', items: { type: 'string' } },
          wednesday: { type: 'array', items: { type: 'string' } },
          thursday: { type: 'array', items: { type: 'string' } },
          friday: { type: 'array', items: { type: 'string' } },
          saturday: { type: 'array', items: { type: 'string' } },
          sunday: { type: 'array', items: { type: 'string' } },
        },
      },
      total_minutes_per_day: { type: 'number' },
      focus_areas: {
        type: 'array',
        items: { type: 'string' },
        description: 'Top 2–3 focus areas for this week in priority order.',
      },
    },
  },
}
