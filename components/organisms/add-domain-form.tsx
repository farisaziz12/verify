'use client'

import { useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Field, type HintTone } from '@/components/molecules/field'
import { type NormalizeResult, normalizeDomain } from '@/lib/domain/normalize'
import { useClaimDomain } from '@/lib/query/mutations/use-claim-domain'

const IDLE_HINT = 'We lowercase it and strip https:// and any path.'

export function AddDomainForm() {
  const [value, setValue] = useState('')
  const [hasAttempted, setHasAttempted] = useState(false)
  const claim = useClaimDomain()

  const normalized = value.trim() ? normalizeDomain(value) : null
  const { hint, hintTone } = resolveHint({
    normalized,
    serverError: claim.error?.message ?? null,
    hasAttempted,
  })

  function submit() {
    if (claim.isPending) return
    setHasAttempted(true)
    if (!normalized?.ok) return
    claim.mutate(normalized.name)
  }

  return (
    <div className="flex max-w-[480px] flex-col gap-2">
      <Field
        label="Domain"
        placeholder="example.com"
        autoFocus
        value={value}
        hint={hint}
        hintTone={hintTone}
        onChange={(next) => {
          setValue(next)
          claim.reset()
        }}
        onSubmit={submit}
      />
      <div className="mt-1 flex items-center gap-2.5">
        <Button onClick={submit} disabled={claim.isPending}>
          {claim.isPending ? 'Adding…' : 'Add domain'}
        </Button>
        <span className="text-fg-subtle text-hint">
          {'We’ll give you one TXT record to publish.'}
        </span>
      </div>
    </div>
  )
}

/**
 * Resolves the hint slot's text and tone. First match wins:
 *
 *   1. a server error — a 409 or 400 the client could not have predicted
 *   2. empty, already submitted — "Enter a domain"
 *   3. empty, untouched — the idle helper text
 *   4. invalid input — the normalizer's own message
 *   5. valid input — the normalized preview
 *
 * The server error outranks local validation because it is newer information: the input
 * is locally valid in that case, and only the server knew it was taken.
 */
function resolveHint({
  normalized,
  serverError,
  hasAttempted,
}: {
  normalized: NormalizeResult | null
  serverError: string | null
  hasAttempted: boolean
}): { hint: string; hintTone: HintTone } {
  if (serverError) return { hint: serverError, hintTone: 'error' }
  if (!normalized) {
    return hasAttempted
      ? { hint: 'Enter a domain', hintTone: 'error' }
      : { hint: IDLE_HINT, hintTone: 'idle' }
  }
  if (!normalized.ok) return { hint: normalized.error, hintTone: 'error' }
  return { hint: `Will be added as ${normalized.name}`, hintTone: 'preview' }
}
