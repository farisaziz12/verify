# PLAN — the PR ladder

The project ships as a sequence of scoped PRs. Main is always deployable;
Vercel deploys from main, so merging is deploying. Each PR follows
`.github/pull_request_template.md` — the "Why / decisions" section is written
at the time the decisions are made, not reconstructed later.

Ground rules: branches `feat/…` / `chore/…` / `fix/…` / `docs/…`; conventional
commits, each a real revisitable step (no "wip", no squash-to-one); tests land
with the logic they cover; JSDoc one-liners on exports; screenshots on PRs
that change UI. Commits and PR bodies carry no tool attribution — no
generated-with footers, no co-author trailers; the author is the author.

PR descriptions follow the template and stay lean: a reader should get the
what/why in the Summary alone; everything else supports it. Prefer a 4-row
table over 4 paragraphs; prefer no diagram over a decorative one.

| # | Branch | Scope (deployed when merged) |
|---|---|---|
| 1 | `chore/scaffold` | Next 16 + TS + Biome + pnpm + CI (lint/typecheck/test) + Vercel deploy of hello-world. First migration generated and committed; it is applied in PR 2, where the driver is first wired and something actually reads the table. Nothing else until this is green. |
| 2 | `feat/schema-and-env` | `checks` table + relations (PR 1 landed `domains` and the enum), `env.ts`, Neon driver wiring. No sessions — see DECISIONS.md. |
| 3 | `feat/claim-domains` | POST/GET /api/domains + list page + add form with live normalization preview; tldts PSL rejection; IDN handling. |
| 4 | `feat/dns-resolver` | `lib/dns`: DoH adapter, `QueryOutcome` union, TXT presentation-format parser with captured-fixture tests. No UI. |
| 5 | `feat/verify-kernel` | `token.ts` + `codes.ts` + `diagnose.ts` + `engine.runCheck` + POST /:id/checks + detail page (record card, latest-check rendering, copy buttons). The core requirement is satisfied when this merges. |
| 6 | `feat/live-status` | TanStack Query polling (self-terminating refetchInterval), checks timeline with query-trail disclosure. |
| 7 | `feat/lifecycle-scheduling` | `machine.ts` (3 states, exhaustive switch) + check-on-read in the detail GET + daily cron sweep route (`vercel.json` + CRON_SECRET) + due-cadence backoff + expired + `/api/health`. |
| 8 | `feat/appended-probe` | Doubled-name probe + `ZONE_NAME_APPENDED` + evidence-diff UI. |
| 9 | `feat/provider-detection` | NS lookup → detected provider auto-opens its setup accordion; headline expectation copy; copy-for-a-teammate action. |
| 10 | `chore/polish` | Favicon, titles/meta, mobile at 390px, error/404 pages, cold-start loading state, empty state, "workspace lives in this browser" hint. |
| 11 | `feat/hysteresis` *(stretch)* | temporarily_failed/revoked + consecutive-failure counter + grace banner + reclaim. If not built, the full state table ships in the README as designed-not-built. |
| 12 | `docs/readme` | README (pitch, links, screenshot, 3-minute walkthrough), diagnosis screenshot gallery, how-this-was-built note. |

## Two-day compression

The ladder assumes comfortable pacing. On a two-day build, the day map is:

- **Day 1:** PRs 1–5 (scaffold → deployed kernel). PR 5 merging = the brief is
  satisfied. If flow is good, 6.
- **Day 2 morning:** PRs 6–8 (live status, scheduling, appended probe).
- **Day 2 afternoon:** PR 10 (polish) and PR 12 (README + screenshots) —
  these two are never cut. PR 9 only if ahead; PR 11 is out.

**Out of scope for this build, stated once so nobody re-litigates it under
pressure:** hysteresis states (11 — table ships in the README as designed),
teammate-copy action, multi-resolver consensus, DomainConnect, accounts,
soft delete, timeline pagination, fixture-zone integration tests, DNSSEC.
Each is one line in the README's tradeoffs section; none blocks the core story.

Allowed compressions if behind: fold 8 into 5 (the probe is ~40 lines once the
engine exists); fold 6's timeline into a static latest-5 list; reduce 9 to the
detection line without the accordion auto-open. Not allowed: skipping tests on
diagnose/machine, skipping 10, skipping 12, or merging without the deployed
app working.

Under time pressure, cut from the top: 11 first, then 9 —
never 10 or 12.

UI PRs (5, 6, 8, 9, 10) implement `docs/design/prototype.html` pixel-faithfully
with the amendments in `docs/design/amendments.md`. During PR 8, deliberately
misconfigure the real test domain once and screenshot every diagnosis state —
those captures serve the PR, the README gallery, and the demo video.
