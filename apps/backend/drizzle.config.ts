import process from 'node:process'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: ['./src/db/schema.ts', './src/db/auth-schema.ts'],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://tierhub:tierhub@localhost:5432/tierhub',
  },
})
