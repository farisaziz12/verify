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

1. Manual and automatic checks share one code path: `engine.runCheck`.
   Automatic checks are stored with trigger `sweep` (on-read); there is no cron job.
2. Domain status changes only in `transition()` (`lib/verification/machine.ts`).
3. DNS outcomes are values (`QueryOutcome`), never exceptions. The only try/catch around
   DNS lives in the DoH adapter.
4. A query error is `indeterminate` — never stored or rendered as a failed verification.
5. `next_check_at` is never NULL; terminal / non-pending statuses park at `FAR_FUTURE`
   when they are not actively scheduled.
6. UI copy never promises a cadence the system doesn't keep.
7. Every timestamp column is `timestamptz` (`{ withTimezone: true }`).
8. No suppressions — no `biome-ignore`, `@ts-ignore`, `@ts-expect-error`. Fix the cause.
9. Colours, type sizes, radii, control heights, and layout max-widths come from the
   tokens in `app/globals.css`. No hardcoded hex or arbitrary size in a component
   (exception: `app/global-error.tsx`, which must render without stylesheet load).
10. Server state belongs to TanStack Query — no raw `fetch` in a component. Queries and
    mutations live in `lib/query/`, keyed through the factory in `lib/query/keys.ts`.
11. Comments state contract — ordering, preconditions, units. Rationale belongs in
    `docs/DECISIONS.md` or the PR notes, not as essay comments in code.

## Where things are decided

- `README.md` — product behaviour, how to run, and deliberate non-goals.
- `docs/DECISIONS.md` — chosen vs rejected, and what is deliberately out of scope.
- `lib/verification/` — diagnosis ladder, lifecycle machine, and shared `runCheck`.

## Workflow

Serverless: there is no resident process. Checks run on-read while the domain
detail page is open (manual button or the auto-check query). There is no daily
cron sweep in this deployment.

Plan before code: files, order, ambiguities — then wait for go. Conventional commits.
Tests land with the logic. PRs follow `.github/pull_request_template.md`.
