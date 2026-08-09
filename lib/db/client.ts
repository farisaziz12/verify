import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { env } from '../env'
import * as schema from './schema'

function create() {
  return drizzle({ client: neon(env().DATABASE_URL), schema })
}

type Db = ReturnType<typeof create>

const globalForDb = globalThis as typeof globalThis & { __verifyDb?: Db }

export function getDb(): Db {
  globalForDb.__verifyDb ??= create()
  return globalForDb.__verifyDb
}
