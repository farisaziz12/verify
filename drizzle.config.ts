import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

// `generate` is an offline schema diff and needs no database, so the URL is only
// asserted by the db:migrate script. drizzle-kit runs outside Next, which is what
// loads .env for the app itself.
export default defineConfig({
  dialect: 'postgresql',
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
})
