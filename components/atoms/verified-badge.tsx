/** A ring with a drawn check. Only for verified — every other state uses a plain dot. */
export function VerifiedBadge() {
  return (
    <span className="border-edge-verified bg-status-verified-surface grid size-tip shrink-0 place-items-center rounded-full border">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
        <title>Verified</title>
        <path
          d="M2 6.3 L4.6 9 L10 3.2"
          stroke="var(--color-status-verified)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
