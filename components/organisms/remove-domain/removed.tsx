'use client'

import { AlertDialog } from 'radix-ui'

/** What the dialog becomes once the domain is gone. */
export function Removed({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-6">
      <span className="border-edge-verified bg-status-verified-surface grid size-6.5 flex-none animate-[pop_480ms_cubic-bezier(0.22,0.61,0.36,1)_both] place-items-center rounded-full border">
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
          <title>Removed</title>
          <path
            d="M2.5 6.9 L5.3 9.6 L10.6 3.6"
            className="text-status-verified animate-[draw_620ms_cubic-bezier(0.33,0,0.2,1)_260ms_both]"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="16"
          />
        </svg>
      </span>

      <div className="flex flex-col gap-1">
        <AlertDialog.Title className="text-body font-medium">{name} removed</AlertDialog.Title>
        <AlertDialog.Description className="text-fg-muted text-ui">
          We've stopped checking it. Your TXT record is still in your DNS.
        </AlertDialog.Description>
      </div>
    </div>
  )
}
