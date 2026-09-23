import { z } from 'zod'

const schema = z.object({
  DATABASE_URL: z.url({
    protocol: /^postgres(ql)?$/,
    error: 'DATABASE_URL must be a postgres:// connection string, not the Neon dashboard URL.',
  }),
  SITE_PASSWORD: z.string().min(1).optional(),
})

export type Env = z.infer<typeof schema>

/** Non-empty `SITE_PASSWORD`, or absent when the gate is off. */
export function readSitePassword(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  const value = source.SITE_PASSWORD
  if (!value) return undefined
  return value
}

export function parseEnv(source: Record<string, string | undefined>): Env {
  const password = readSitePassword(source)
  const rest = { ...source }
  delete rest.SITE_PASSWORD
  const result = schema.safeParse(password ? { ...rest, SITE_PASSWORD: password } : rest)
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`)
  }
  if (!result.data.SITE_PASSWORD) return { DATABASE_URL: result.data.DATABASE_URL }
  return { DATABASE_URL: result.data.DATABASE_URL, SITE_PASSWORD: result.data.SITE_PASSWORD }
}

let cached: Env | undefined

export function env(): Env {
  cached ??= parseEnv(process.env)
  return cached
}
