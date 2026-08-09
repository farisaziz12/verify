interface CheckButtonProps {
  onCheck: () => void
  isPending: boolean
  /** Counted down from the server's rate-limit response; null when a check is allowed. */
  retryAfterSeconds: number | null
}

export function CheckButton({ onCheck, isPending, retryAfterSeconds }: CheckButtonProps) {
  const isCooling = retryAfterSeconds !== null && retryAfterSeconds > 0

  return (
    <button
      type="button"
      onClick={onCheck}
      disabled={isPending || isCooling}
      title={isCooling ? `Check again in ${retryAfterSeconds}s` : undefined}
      className="border-edge-tooltip bg-control text-fg hover:enabled:bg-selected hover:enabled:border-edge-strong focus-visible:outline-fg rounded-control text-hint inline-flex h-7 cursor-pointer items-center gap-2 border px-3 font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed"
    >
      {isPending && (
        <span className="border-edge-strong size-2.5 animate-[spin_700ms_linear_infinite] rounded-full border-[1.5px] border-t-white" />
      )}
      <span>{isPending ? 'Checking…' : isCooling ? 'Checked just now' : 'Check now'}</span>
    </button>
  )
}
