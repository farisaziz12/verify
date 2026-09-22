# DECISIONS

What was chosen, what was rejected, and why. Scope calls are at the bottom.

---

## D1 · No accounts, and no sessions either

**Chosen:** the domain list is global to the deployment. No cookie, no session
table, no ownership column.

**Rejected:** anonymous sessions — a cookie minted in middleware, with
`domains.session_id` scoping every query.

**Why:** sessions bought isolation between demo visitors and nothing else. They
cost a table, middleware, a cookie contract, an ownership check in every handler,
and a 404-instead-of-403 rule to avoid enumeration — real surface area in the
layer this project is *not* about. The project is judged on DNS diagnosis.

**Where auth attaches if it ever should:** add an `owner_id` to `domains` and a
filter in the query layer. The engine, the ladder, and the machine never look at
ownership.

**Cost accepted:** anyone with the URL sees every claimed domain. Correct for a
demo, wrong for production, and stated here rather than discovered.

## D2 · Two resolvers, as failover — not consensus

**Chosen:** Cloudflare DoH is primary; Google DoH is queried **only** when
Cloudflare returns `kind: 'error'`.

**Rejected:** querying both every time and requiring agreement.

**Why:** a Cloudflare outage would otherwise surface as `DNS_UNREACHABLE` — a
verdict about the user's DNS caused by our dependency. Failover fixes that with
one extra request on the rare error path and no change to the decision ladder.

Consensus would catch mid-propagation disagreement, but it doubles every check's
latency and introduces a state the UI must explain.

**Honest caveat:** two resolvers queried from one server share an egress IP.
That is two cache pools, not two vantage points.

## D3 · The record stays at `_claim.<domain>`

**Chosen:** TXT at `_claim.<domain>` with value `verify=<token>`.

**Rejected:** apex TXT with a vendor-prefixed key (the common industry pattern).

**Why:** apex verification would delete two diagnosis codes. `RECORD_NAME_MISSING`
becomes unreachable (the apex always exists), and `ZONE_NAME_APPENDED` largely
stops happening (no host field for a provider to append the zone to). The apex
convention is right for yes/no products; this product's value is the diagnosis.

## D4 · UI never names a check interval

**Chosen:** copy that checks continue while the detail page is open, plus the
concrete `next_check_at` timestamp from the API.

**Rejected:** promising a fixed interval ("every 30 seconds", "daily once
verified").

**Why:** checks run on read and only when `next_check_at` is due. Pending backoff
widens over time. A visible next-check time is both honest and more useful than
an interval (invariant 6).

## D5 · Pinned toolchain

- **Drizzle 0.44.x** — pinned to stable rather than a release candidate.
- **TypeScript 5.9.x** — `typescript@latest` resolves to 7.x (Go port), which
  Next 16 does not list as supported.
- **`packageManager: pnpm@11.15.1`** — CI's `pnpm/action-setup` reads this field.
- **`uuid` column type, not `text`** — validates format in the database and keeps
  foreign keys declarable.

## D6 · Reserved lifecycle statuses, shipped columns only

**Chosen:** keep `expired`, `temporarily_failed`, and `revoked` on the Postgres
enum (removing enum values is its own migration), but do not write them. Drop
`consecutive_failures` and `failing_since`, which nothing ever updated. Narrow the
due-check index to `pending` and `verified`.

**Rejected:** leaving unused failure-tracking columns in the live schema, or
rewriting historical migrations to pretend they never existed.

**Why:** the schema should match what the machine can produce. Reserved enum
values remain available if hysteresis or revocation is added later; dead columns
do not.

---

## Scope

### In

Domain claim and normalization (PSL rejection, IDN), the DoH resolver layer with
its `QueryOutcome` union, the diagnosis ladder, claim tokens, the lifecycle
machine (`pending` ↔ `verified`), check-on-read while the detail page is open,
the appended-name probe, and the UI that renders diagnoses and check activity.

### Out, deliberately

| Not built | Why |
|---|---|
| Accounts and sessions | D1 |
| Multi-resolver consensus | D2 — failover ships |
| Hysteresis / revocation transitions | D6 — enum values reserved; transitions not built |
| Background cron sweep | Checks run on-read from the detail page only |
| Claim expiry | No sweeper; would require a schedule the UI does not promise |
| Soft delete, timeline pagination | Volume does not justify either at this scale |
| DoH response caching | A verification product wants fresh answers |
| Retries inside a check | The schedule *is* the retry mechanism |
| DNSSEC validation | Does not change the diagnoses |
| Integration tests against real fixture zones | First thing to add after a submission |

### Known limitations

1. **The domain list is public to anyone with the URL** (D1).
2. **Two resolvers, one vantage point** — shared egress IP (D2).
3. **Migrations are applied by hand**, not by CI. Deploy and schema change are
   two separate acts.
4. **A verified domain does not demote** if the TXT record later changes or
   disappears; the UI can show that the record drifted, but status stays
   `verified`.
