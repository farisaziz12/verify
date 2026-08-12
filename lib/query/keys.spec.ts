import { describe, expect, it } from 'vitest'
import { queryKeys } from './keys'

function hasPrefix(key: readonly unknown[], prefix: readonly unknown[]): boolean {
  return prefix.every((segment, i) => key[i] === segment)
}

describe('queryKeys.domains', () => {
  const all = queryKeys.domains.all()

  it('nests every key under the root, so one invalidation reaches them all', () => {
    expect(hasPrefix(queryKeys.domains.list(), all)).toBe(true)
    expect(hasPrefix(queryKeys.domains.detail('abc'), all)).toBe(true)
    expect(hasPrefix(queryKeys.domains.checks('abc'), all)).toBe(true)
  })

  it('nests checks under their own domain, so one domain can be invalidated alone', () => {
    expect(hasPrefix(queryKeys.domains.checks('abc'), queryKeys.domains.detail('abc'))).toBe(true)
    expect(hasPrefix(queryKeys.domains.checks('abc'), queryKeys.domains.detail('xyz'))).toBe(false)
  })

  it('keeps the list and a detail distinct', () => {
    expect(hasPrefix(queryKeys.domains.detail('abc'), queryKeys.domains.list())).toBe(false)
    expect(hasPrefix(queryKeys.domains.list(), queryKeys.domains.detail('abc'))).toBe(false)
  })

  it('separates domains by id', () => {
    expect(queryKeys.domains.detail('abc')).not.toEqual(queryKeys.domains.detail('xyz'))
  })
})
