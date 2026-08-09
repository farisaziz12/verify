/**
 * Query keys, built so that every key is a prefix-extension of its parent.
 *
 * That shape is what `invalidateQueries` relies on: passing `domains.all()` matches the
 * list, every detail, and every checks timeline, because TanStack matches by prefix unless
 * told otherwise. Reordering a segment silently breaks that, which is why keys.spec.ts
 * asserts the prefix relationships rather than the literal arrays.
 */
export const queryKeys = {
  domains: {
    all: () => ['domains'] as const,
    list: () => [...queryKeys.domains.all(), 'list'] as const,
    detail: (id: string) => [...queryKeys.domains.all(), 'detail', id] as const,
    checks: (id: string) => [...queryKeys.domains.detail(id), 'checks'] as const,
  },
} as const
