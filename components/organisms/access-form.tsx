'use client'

import { useState, useTransition } from 'react'
import { unlock } from '@/app/(ui)/access/actions'
import { Button } from '@/components/atoms/button'
import { Field } from '@/components/molecules/field'

const IDLE_HINT = 'Enter the password to use this deployment. Access lasts one hour.'

export function AccessForm({ next }: { next: string }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function submit() {
    if (pending) return
    startTransition(async () => {
      const result = await unlock(password, next)
      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="flex max-w-form flex-col gap-2">
      <Field
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        autoFocus
        value={password}
        hint={error ?? IDLE_HINT}
        hintTone={error ? 'error' : 'idle'}
        onChange={(value) => {
          setPassword(value)
          setError(null)
        }}
        onSubmit={submit}
      />
      <div className="mt-1">
        <Button onClick={submit} disabled={pending || password.length === 0}>
          {pending ? 'Checking…' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
