import { safeNextPath, sessionIsValid } from '@/lib/access/session'

export type AccessDecision =
  | { kind: 'allow' }
  | { kind: 'redirect'; next: string }
  | { kind: 'unauthorized' }

/**
 * Allow when the password is unset, the path is `/access`, or the cookie is valid.
 * Otherwise API calls are unauthorized and pages redirect.
 */
export function decideAccess(input: {
  password: string | undefined
  cookie: string | undefined
  pathname: string
  search: string
  nowMs?: number
}): AccessDecision {
  if (!input.password) return { kind: 'allow' }
  if (input.pathname === '/access' || input.pathname.startsWith('/access/')) {
    return { kind: 'allow' }
  }
  if (input.cookie && sessionIsValid(input.cookie, input.password, input.nowMs ?? Date.now())) {
    return { kind: 'allow' }
  }
  if (input.pathname === '/api' || input.pathname.startsWith('/api/')) {
    return { kind: 'unauthorized' }
  }
  return { kind: 'redirect', next: safeNextPath(`${input.pathname}${input.search}`) }
}
