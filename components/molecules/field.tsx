import { useId } from 'react'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { cn } from '@/lib/cn'

export type HintTone = 'idle' | 'preview' | 'error'

const HINT_TONE = {
  idle: 'text-fg-faint',
  preview: 'text-fg-muted',
  error: 'text-danger',
} satisfies Record<HintTone, string>

interface FieldProps {
  label: string
  hint: string
  hintTone: HintTone
  value: string
  placeholder?: string
  autoFocus?: boolean
  onChange: (value: string) => void
  onSubmit?: () => void
}

/** Label, input, and a single hint slot that is helper text, live preview, and error in turn. */
export function Field({
  label,
  hint,
  hintTone,
  value,
  placeholder,
  autoFocus,
  onChange,
  onSubmit,
}: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        invalid={hintTone === 'error'}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit?.()
        }}
      />
      <p
        id={hintId}
        aria-live="polite"
        className={cn('text-hint min-h-5 font-mono', HINT_TONE[hintTone])}
      >
        {hint}
      </p>
    </div>
  )
}
