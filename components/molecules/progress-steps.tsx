import { classNames } from '@/lib/class-names'
import { type StatusTone, TONE } from '@/lib/tone'

const STEPS = [
  { number: '01', label: 'Add the TXT record' },
  { number: '02', label: 'We find it in DNS' },
  { number: '03', label: 'Domain verified' },
]

interface ProgressStepsProps {
  /** 1-based, from `stageFor()`. */
  stage: 1 | 2 | 3
  /** Colours the bar of the step currently in progress. */
  tone: StatusTone
}

/** Where the user is in setup: one 2px bar per step, the current one sweeping. */
export function ProgressSteps({ stage, tone }: ProgressStepsProps) {
  return (
    <ol className="-mt-5 grid grid-cols-3">
      {STEPS.map((step, index) => {
        const position = index + 1
        const isDone = position < stage || stage === 3
        const isCurrent = position === stage && stage !== 3

        return (
          <li key={step.number} className="flex flex-col gap-2 pr-4">
            <div
              className={classNames(
                'relative h-0.5 overflow-hidden rounded-[1px]',
                isDone ? 'bg-status-verified' : isCurrent ? TONE[tone].bg : 'bg-edge',
              )}
            >
              {isCurrent && (
                <span className="absolute inset-0 animate-[scan_2.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-step text-fg-faint font-mono">{step.number}</span>
              <span
                className={classNames(
                  'text-ui',
                  isDone ? 'text-fg-bright' : isCurrent ? 'text-fg' : 'text-fg-faint',
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
