import { useId } from 'react'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { classNames } from '@/lib/class-names'

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

/** Label, input, and a single hint slot. */
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
        isInvalid={hintTone === 'error'}
        aria-describedby={hintId}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit?.()
        }}
      />
      <p
        id={hintId}
        aria-live="polite"
        className={classNames('text-hint min-h-5 font-mono', HINT_TONE[hintTone])}
      >
        {hint}
      </p>
    </div>
  )
}
