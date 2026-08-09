import { desc } from 'drizzle-orm'
import { CLAIM_TTL_MS } from '../verification/constants'
import { mintToken } from '../verification/token'
import { getDb } from './client'
import { type Domain, domains } from './schema'

export function listDomains(): Promise<Domain[]> {
  return getDb().select().from(domains).orderBy(desc(domains.claimedAt))
}

/** Claims a domain. Returns null when the name is already claimed. */
export async function createDomain(name: string): Promise<Domain | null> {
  const now = new Date()
  const [created] = await getDb()
    .insert(domains)
    .values({
      name,
      token: mintToken(),
      nextCheckAt: now,
      claimedAt: now,
      expiresAt: new Date(now.getTime() + CLAIM_TTL_MS),
    })
    .onConflictDoNothing({ target: domains.name })
    .returning()

  return created ?? null
}
