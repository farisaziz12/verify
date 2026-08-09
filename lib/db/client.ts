import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '../env'
import * as schema from './schema'

function create() {
  return drizzle({ client: neon(env().DATABASE_URL), schema })
}

type Db = ReturnType<typeof create>

/**
 * One client per process, kept on `globalThis` so dev hot-reload reuses it instead of opening
 * a new Neon connection on every edit. `var` is required here: it is the only declaration
 * form that augments `globalThis`.
 */
declare global {
  var __verifyDb: Db | undefined
}

export function getDb(): Db {
  globalThis.__verifyDb ??= create()
  return globalThis.__verifyDb
}
