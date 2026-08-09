import { describe, expect, it } from 'vitest'
import { parseEnv } from './env'

const VALID = 'postgresql://u:p@ep-x.us-east-2.aws.neon.tech/verify?sslmode=require'

describe('parseEnv', () => {
  it('accepts a Neon connection string and ignores unrelated variables', () => {
    expect(parseEnv({ DATABASE_URL: VALID, PATH: '/usr/bin' })).toEqual({ DATABASE_URL: VALID })
  })

  it('accepts the postgres:// scheme as well as postgresql://', () => {
    expect(() => parseEnv({ DATABASE_URL: 'postgres://u:p@localhost:5432/verify' })).not.toThrow()
  })

  it('names the offending variable when one is missing', () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/)
  })

  it('rejects a non-postgres URL', () => {
    expect(() => parseEnv({ DATABASE_URL: 'https://console.neon.tech/app/projects/abc' })).toThrow(
      /connection string/,
    )
  })

  it('rejects an empty value', () => {
    expect(() => parseEnv({ DATABASE_URL: '' })).toThrow()
  })
})
