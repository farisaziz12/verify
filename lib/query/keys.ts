/** Every key extends its parent's prefix. `autoCheck` stays outside `domains`: it invalidates that subtree. */
export const queryKeys = {
  domains: {
    all: () => ['domains'] as const,
    list: () => [...queryKeys.domains.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.domains.all(), 'detail', id] as const,
    checks: (id: string) => [...queryKeys.domains.detail(id), 'checks'] as const,
  },
  autoCheck: (id: string) => ['auto-check', id] as const,
} as const
