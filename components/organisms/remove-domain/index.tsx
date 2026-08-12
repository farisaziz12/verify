'use client'

import { useRouter } from 'next/navigation'
import { AlertDialog } from 'radix-ui'
import { useEffect, useState } from 'react'
import { Button } from '@/components/atoms/button'
import { Mono } from '@/components/atoms/mono'
import { SlideToConfirm } from '@/components/molecules/slide-to-confirm'
import { Removed } from '@/components/organisms/remove-domain/removed'
import type { Domain } from '@/lib/db/schema'
import { isVerified } from '@/lib/domain/status'
import { useDeleteDomain } from '@/lib/query/mutations/use-delete-domain'
import { SECOND } from '@/lib/time'

/** How long the confirmation stays up before leaving for the list. */
const CONFIRMATION_MS = 3 * SECOND

/**
 * Removes a domain, behind a confirmation sized to the consequence.
 *
 * An unverified claim is a button pair. A verified one has to be dragged across a track: the
 * work it represents is already done, so undoing it should take a deliberate gesture rather
 * than a reflex click in the same place the cancel button was.
 */
export function RemoveDomain({ domain }: { domain: Domain }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { mutate, isPending, isSuccess, isError, error } = useDeleteDomain(domain.id)

  // The dialog holds the confirmation open on purpose, then leaves for the list.
  useEffect(() => {
    if (!isSuccess) return
    const timer = setTimeout(() => router.push('/'), CONFIRMATION_MS)
    return () => clearTimeout(timer)
  }, [isSuccess, router])

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialog.Trigger className="rounded-control border-edge text-fg-muted hover:text-danger hover:border-edge-danger focus-visible:outline-fg h-control-sm text-ui cursor-pointer border bg-transparent px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2">
        Remove domain
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 grid animate-[fade_140ms_ease-out] place-items-center bg-black/70 p-6" />
        <AlertDialog.Content
          // Once the row is gone there is nothing to cancel, so the exits are removed rather
          // than left to return the user to a domain that no longer exists.
          onEscapeKeyDown={(event) => isSuccess && event.preventDefault()}
          className="rounded-surface border-edge bg-card fixed top-1/2 left-1/2 z-50 w-[calc(100%-3rem)] max-w-110 -translate-x-1/2 -translate-y-1/2 animate-[rise_160ms_ease-out] border"
        >
          {isSuccess ? <Removed name={domain.name} /> : null}

          {isSuccess ? null : (
            <>
              <div className="flex flex-col gap-2.5 px-5 pt-5 pb-4">
                <AlertDialog.Title className="text-section font-medium">
                  Remove this domain?
                </AlertDialog.Title>
                <Mono>{domain.name}</Mono>
                <AlertDialog.Description className="text-fg-muted text-ui text-pretty">
                  We stop checking it and the claim is dropped. To claim it again you'll need a new
                  token.
                </AlertDialog.Description>
                <p className="text-fg-subtle text-ui text-pretty">
                  Your TXT record stays in your DNS — you can remove it.
                </p>
                {isError && <p className="text-danger text-ui">{error.message}</p>}
              </div>

              {isVerified(domain) ? (
                <div className="border-edge flex flex-col gap-2.5 border-t px-4 py-3">
                  <SlideToConfirm
                    label={`Slide to remove ${domain.name}`}
                    ariaLabel={`Remove ${domain.name}. Drag right, or hold the right arrow key until it reaches the end.`}
                    onConfirm={() => mutate()}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-fg-subtle text-hint">
                      This domain is verified — slide to confirm.
                    </p>
                    <AlertDialog.Cancel asChild>
                      <Button variant="ghost" size="sm">
                        Cancel
                      </Button>
                    </AlertDialog.Cancel>
                  </div>
                </div>
              ) : (
                <div className="border-edge flex justify-end gap-2 border-t px-4 py-3">
                  <AlertDialog.Cancel asChild>
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                  </AlertDialog.Cancel>
                  <Button variant="danger" size="sm" disabled={isPending} onClick={() => mutate()}>
                    {isPending ? 'Removing…' : 'Remove domain'}
                  </Button>
                </div>
              )}
            </>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
