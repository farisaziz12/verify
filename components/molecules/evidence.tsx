/**
 * The expected-versus-found pair behind a failed check.
 *
 * Two full strings rather than a character diff: the difference is usually a whole different
 * token or a doubled hostname, and `break-all` keeps a 26-character token from overflowing.
 */
export function Evidence({ expected, found }: { expected: string; found: string[] }) {
  return (
    <dl className="border-edge text-hint mt-0.5 grid grid-cols-[76px_1fr] gap-x-3 gap-y-1 border-l py-0.5 pl-3 font-mono">
      <dt className="text-fg-subtle">expected</dt>
      <dd className="text-fg-muted break-all">{expected}</dd>
      {found.map((value) => (
        <div key={value} className="contents">
          <dt className="text-fg-subtle">found</dt>
          <dd className="text-status-attention break-all">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
