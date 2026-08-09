/**
 * Every key is a prefix-extension of its parent, so invalidating `domains.all()` reaches the
 * list, every detail, and every timeline.
 *
 * `autoCheck` sits outside `domains` on purpose: it invalidates that subtree when a check
 * changes something, and a key underneath it would invalidate itself and spin.
 */
export const queryKeys = {
  domains: {
    all: () => ['domains'] as const,
    list: () => [...queryKeys.domains.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.domains.all(), 'detail', id] as const,
    checks: (id: string) => [...queryKeys.domains.detail(id), 'checks'] as const,
  },
  autoCheck: (id: string) => ['auto-check', id] as const,
} as const
