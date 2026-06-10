/**
 * Claude Coaching Engine
 * Calls the Anthropic API with structured tool use to generate feedback reports and practice plans.
 * Never receives raw audio — only DiagnosisResult + context.
 */
import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from './prompts/system-prompt'
import { buildFeedbackPrompt, FEEDBACK_TOOL } from './prompts/feedback-prompt'
import { buildPracticePrompt, PRACTICE_PLAN_TOOL } from './prompts/practice-prompt'
import type { CoachingInput, CoachingReport, PracticePlan } from './types'

const MODEL = 'claude-sonnet-4-6'

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey: key })
}

export interface FeedbackResult {
  report: CoachingReport
  inputTokens: number
  outputTokens: number
}

export interface PracticePlanResult {
  plan: PracticePlan
  inputTokens: number
  outputTokens: number
}

/**
 * Generate a feedback report from a diagnosis.
 * Uses tool_use to enforce structured JSON output.
 */
export async function generateFeedback(input: CoachingInput): Promise<FeedbackResult> {
  const client = getClient()
  const systemPrompt = buildSystemPrompt(input.persona, input.instrument_label, input.current_level)
  const userPrompt = buildFeedbackPrompt(input)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    tools: [FEEDBACK_TOOL as Anthropic.Tool],
    tool_choice: { type: 'tool', name: 'generate_feedback' },
    messages: [{ role: 'user', content: userPrompt }],
  })

  // Extract the tool use block
  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  if (!toolUse || toolUse.name !== 'generate_feedback') {
    throw new Error('Claude did not call generate_feedback tool')
  }

  const report = toolUse.input as CoachingReport

  return {
    report,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}

/**
 * Generate a practice plan from an existing feedback report.
 * Separate call so the plan can be regenerated without re-running feedback.
 */
export async function generatePracticePlan(
  report: CoachingReport,
  instrument: string,
  level: string,
  persona: CoachingInput['persona']
): Promise<PracticePlanResult> {
  const client = getClient()
  const systemPrompt = buildSystemPrompt(persona, instrument, level)
  const userPrompt = buildPracticePrompt(report, instrument, level)

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    tools: [PRACTICE_PLAN_TOOL as Anthropic.Tool],
    tool_choice: { type: 'tool', name: 'generate_practice_plan' },
    messages: [{ role: 'user', content: userPrompt }],
  })

  const toolUse = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  if (!toolUse || toolUse.name !== 'generate_practice_plan') {
    throw new Error('Claude did not call generate_practice_plan tool')
  }

  const plan = toolUse.input as PracticePlan

  return {
    plan,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  }
}
