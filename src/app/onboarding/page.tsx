'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Music, Sparkles } from 'lucide-react'
import { StepIndicator } from '@/components/onboarding/step-indicator'
import { InstrumentGrid } from '@/components/onboarding/instrument-grid'
import { LevelSelector } from '@/components/onboarding/level-selector'
import { Button } from '@/components/ui/button'
import { PERFORMANCE_LEVELS, getLevelById } from '@/lib/constants/levels'
import { getInstrumentById } from '@/lib/constants/instruments'
import type { Instrument, PerformanceLevel } from '@/lib/types'

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4

const STEPS = [
  { number: 1, label: 'Instrument' },
  { number: 2, label: 'Your Level' },
  { number: 3, label: 'Target' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [selectedInstrument, setSelectedInstrument] = useState<string | null>(null)
  const [currentLevel, setCurrentLevel] = useState<string | null>(null)
  const [targetLevel, setTargetLevel] = useState<string | null>(null)
  const [animating, setAnimating] = useState(false)

  // Load saved state on mount
  useEffect(() => {
    const saved = {
      instrument: localStorage.getItem('virtuoso_instrument'),
      current: localStorage.getItem('virtuoso_current_level'),
      target: localStorage.getItem('virtuoso_target_level'),
    }
    if (saved.instrument) setSelectedInstrument(saved.instrument)
    if (saved.current) setCurrentLevel(saved.current)
    if (saved.target) setTargetLevel(saved.target)
  }, [])

  const advanceTo = (next: Step) => {
    setAnimating(true)
    setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 180)
  }

  const handleInstrumentSelect = (instrument: Instrument) => {
    setSelectedInstrument(instrument.id)
    localStorage.setItem('virtuoso_instrument', instrument.id)
  }

  const handleCurrentLevelSelect = (level: PerformanceLevel) => {
    setCurrentLevel(level.id)
    localStorage.setItem('virtuoso_current_level', level.id)
    // Reset target if it's below new current
    const target = getLevelById(targetLevel ?? '')
    if (target && target.rank <= level.rank) {
      setTargetLevel(null)
      localStorage.removeItem('virtuoso_target_level')
    }
  }

  const handleTargetLevelSelect = (level: PerformanceLevel) => {
    setTargetLevel(level.id)
    localStorage.setItem('virtuoso_target_level', level.id)
  }

  const handleFinish = () => {
    localStorage.setItem('virtuoso_onboarded', 'true')
    router.push('/dashboard')
  }

  const currentLevelData = getLevelById(currentLevel ?? '')
  const targetLevelData = getLevelById(targetLevel ?? '')
  const instrumentData = getInstrumentById(selectedInstrument ?? '')
  const currentRank = currentLevelData?.rank ?? 1
  const targetMinRank = currentRank + 1

  const canAdvanceStep1 = !!selectedInstrument
  const canAdvanceStep2 = !!currentLevel
  const canAdvanceStep3 = !!targetLevel

  return (
    <div className="min-h-screen bg-[#050508] flex flex-col">
      {/* Top nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border-DEFAULT">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center">
            <Music className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-sm">Virtuoso AI</span>
        </Link>

        {step < 4 && (
          <StepIndicator steps={STEPS} currentStep={step} />
        )}

        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-6 py-12">
        <div
          className="w-full max-w-2xl transition-all duration-200"
          style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(8px)' : 'translateY(0)' }}
        >
          {/* ── Step 1: Instrument ── */}
          {step === 1 && (
            <div>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">What do you play?</h1>
                <p className="text-zinc-400 text-sm">
                  Virtuoso AI calibrates feedback specifically for your instrument — different rubrics, different techniques, different drills.
                </p>
              </div>
              <InstrumentGrid selected={selectedInstrument} onSelect={handleInstrumentSelect} />
              <div className="mt-8 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!canAdvanceStep1}
                  onClick={() => advanceTo(2)}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 2: Current Level ── */}
          {step === 2 && (
            <div>
              <button
                onClick={() => advanceTo(1)}
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Where are you now?</h1>
                <p className="text-zinc-400 text-sm">
                  Be honest — this sets your baseline. Virtuoso AI will compare your recording against the standard for your selected level.
                </p>
              </div>
              <LevelSelector selected={currentLevel} onSelect={handleCurrentLevelSelect} />
              <div className="mt-8 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!canAdvanceStep2}
                  onClick={() => advanceTo(3)}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 3: Target Level ── */}
          {step === 3 && (
            <div>
              <button
                onClick={() => advanceTo(2)}
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white transition-colors mb-8"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Where do you want to be?</h1>
                <p className="text-zinc-400 text-sm">
                  Your target shapes every gap analysis and practice recommendation. Pick the level you're working toward.
                </p>
              </div>
              <LevelSelector
                selected={targetLevel}
                onSelect={handleTargetLevelSelect}
                minRank={targetMinRank}
              />
              <div className="mt-8 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!canAdvanceStep3}
                  onClick={() => advanceTo(4)}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 4: Ready ── */}
          {step === 4 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center mx-auto mb-6 shadow-glow-violet-lg">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <h1 className="text-3xl font-bold text-white mb-3">You&apos;re all set.</h1>
              <p className="text-zinc-400 mb-8 max-w-sm mx-auto">
                Upload your first recording and Virtuoso AI will give you feedback calibrated to your goals.
              </p>

              {/* Summary card */}
              <div className="p-5 rounded-2xl bg-surface-DEFAULT border border-border-DEFAULT mb-8 text-left max-w-sm mx-auto">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-4">Your profile</p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Instrument</span>
                    <span className="text-sm font-semibold text-white">
                      {instrumentData?.emoji} {instrumentData?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Current level</span>
                    <span className="text-sm font-semibold" style={{ color: currentLevelData?.textColor }}>
                      {currentLevelData?.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">Target level</span>
                    <span className="text-sm font-semibold" style={{ color: targetLevelData?.textColor }}>
                      {targetLevelData?.label}
                    </span>
                  </div>
                </div>
              </div>

              <Button variant="primary" size="xl" onClick={handleFinish}>
                Go to dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
