import { type NextRequest, NextResponse } from 'next/server'
import { decideAccess } from '@/lib/access/gate'
import { ACCESS_COOKIE } from '@/lib/access/session'
import { fail } from '@/lib/api/response'
import { readSitePassword } from '@/lib/env'

/** Pages redirect to `/access`. API routes get a 401 envelope. Off when `SITE_PASSWORD` is unset. */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const decision = decideAccess({
    password: readSitePassword(),
    cookie: request.cookies.get(ACCESS_COOKIE)?.value,
    pathname,
    search,
  })

  if (decision.kind === 'allow') return NextResponse.next()
  if (decision.kind === 'unauthorized') return fail(401, 'Enter the password to continue.')

  const url = request.nextUrl.clone()
  url.pathname = '/access'
  url.search = ''
  url.searchParams.set('next', decision.next)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!access(?:/|$)|_next/static|_next/image|icon(?:\\.svg)?$|favicon\\.ico$).*)'],
}
