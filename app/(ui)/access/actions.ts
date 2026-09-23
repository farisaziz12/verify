'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  ACCESS_COOKIE,
  accessCookieOptions,
  issueSession,
  passwordsMatch,
  safeNextPath,
} from '@/lib/access/session'
import { readSitePassword } from '@/lib/env'

/** Sets the hour-long cookie and redirects, or returns a message the form can show. */
export async function unlock(
  password: string,
  next: string,
): Promise<{ error: string } | undefined> {
  const expected = readSitePassword()
  if (!expected) redirect('/')
  if (typeof password !== 'string' || !passwordsMatch(password, expected)) {
    return { error: 'That password does not match.' }
  }

  const jar = await cookies()
  jar.set(
    ACCESS_COOKIE,
    issueSession(expected),
    accessCookieOptions(process.env.NODE_ENV === 'production'),
  )
  redirect(safeNextPath(next))
}
