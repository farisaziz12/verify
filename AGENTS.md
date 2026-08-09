# AGENTS.md

**Verify** — a user claims a domain, publishes one TXT record, and we verify it against
live DNS, diagnosing what we find and how to recover when it's wrong.

Next.js 16 (App Router) on Vercel · Neon Postgres via Drizzle · DNS over Cloudflare DoH.

## Commands

```sh
pnpm dev                  # needs DATABASE_URL in .env — Neon, no Docker
pnpm check                # biome + tsc --noEmit
pnpm test                 # vitest
pnpm db:generate          # drizzle-kit generate (commit the SQL)
pnpm db:migrate           # apply migrations
```

## Invariants

Violating one is a bug even if tests pass.

1. Manual and sweep checks share one code path: `engine.runCheck`.
2. Domain status changes only in `transition()` (`lib/verification/machine.ts`).
3. DNS outcomes are values (`QueryOutcome`), never exceptions. The only try/catch around
   DNS lives in the DoH adapter.
4. A query error is `indeterminate` — never stored or rendered as a failed verification.
5. `next_check_at` is never NULL; terminal states park at `FAR_FUTURE`.
6. UI copy never promises a cadence the system doesn't keep.
7. Every timestamp column is `timestamptz` (`{ withTimezone: true }`).
8. No suppressions — no `biome-ignore`, `@ts-ignore`, `@ts-expect-error`. Fix the cause.
9. Colours, type sizes, radii and control heights come from the tokens in
   `app/globals.css`. No hardcoded hex or arbitrary size in a component.
10. Server state belongs to TanStack Query — no raw `fetch` in a component. Queries and
    mutations live in `lib/query/`, keyed through the factory in `lib/query/keys.ts`.
11. Comments state contract — ordering, preconditions, units. Rationale goes in
    `docs/CODE-NOTES.md`, keyed to the file, so it can be pasted onto the PR diff.

## Where things are decided

- `docs/SPEC.md` — the build contract: types, diagnosis ladder, lifecycle machine, sweep
  mechanics, API surface, schema. Read the section before implementing it.
- `docs/PLAN.md` — the PR ladder. Build only the current PR's row.
- `docs/DECISIONS.md` — chosen vs rejected, and what is deliberately out of scope.
- `docs/design/prototype.html` — match pixel-faithfully, with `design/amendments.md`.

## Workflow

Serverless: there is no resident process. Checks run on-read and via a daily Vercel Cron
sweep — read SPEC §6 before touching scheduling.

Plan before code: files, order, ambiguities — then wait for go. Conventional commits.
Tests land with the logic. PRs follow `.github/pull_request_template.md`.
