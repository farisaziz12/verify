/** A literal technical value inside prose — a record name, a host field, a token. */
export function Mono({ children }: { children: string }) {
  return <span className="text-fg-bright font-mono">{children}</span>
}
