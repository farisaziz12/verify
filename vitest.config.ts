import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    include: ['**/*.spec.ts'],
    exclude: ['**/node_modules/**', '.next/**'],
    environment: 'node',
    passWithNoTests: true,
  },
})
