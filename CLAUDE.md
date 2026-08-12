# CLAUDE.md

Read AGENTS.md — it is the authoritative agent guide for this repo
(commands, doc map, invariants, workflow). Nothing Claude-specific
overrides it.

@AGENTS.md

For Next 16, Tailwind, Drizzle and Neon APIs, query the Context7 MCP rather than the
`node_modules` docs referenced in the generated block below. `next dev` rewrites
everything between that block's two markers; text outside them survives.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
