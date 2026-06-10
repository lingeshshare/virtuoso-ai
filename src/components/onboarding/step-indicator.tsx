import { Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Step {
  number: number
  label: string
}

interface StepIndicatorProps {
  steps: Step[]
  currentStep: number
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => {
        const isComplete = currentStep > step.number
        const isCurrent = currentStep === step.number
        const isLast = index === steps.length - 1

        return (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300',
                  isComplete
                    ? 'bg-violet-500 text-white'
                    : isCurrent
                    ? 'bg-violet-500/20 border-2 border-violet-500 text-violet-300'
                    : 'bg-surface-overlay border border-border-DEFAULT text-zinc-500'
                )}
              >
                {isComplete ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={cn(
                  'text-xs font-medium whitespace-nowrap transition-colors duration-300',
                  isCurrent ? 'text-white' : isComplete ? 'text-zinc-400' : 'text-zinc-600'
                )}
              >
                {step.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={cn(
                  'w-16 h-px mx-2 mb-5 transition-colors duration-500',
                  isComplete ? 'bg-violet-500/50' : 'bg-border-DEFAULT'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
