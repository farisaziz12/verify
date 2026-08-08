# DECISIONS

What was chosen, what was rejected, and why. Scope calls are at the bottom.
`SPEC.md` says what the system does; this file says why it does it that way.

---

## D1 · No accounts, and no sessions either

**Chosen:** the domain list is global to the deployment. No cookie, no session
table, no ownership column.

**Rejected:** anonymous sessions — a 128-bit cookie minted in middleware, with
`domains.session_id` scoping every query. That was the design through an earlier
draft of the spec.

**Why:** sessions bought isolation between demo visitors and nothing else. They
cost a table, middleware, a cookie contract, an ownership check in every handler,
and a 404-instead-of-403 rule to avoid enumeration — real surface area in the
layer this project is *not* about. The project is judged on DNS diagnosis, and
every hour spent on a cookie is an hour not spent there.

Two things that argued against them specifically:

- **They were unrecoverable by construction.** Clearing cookies orphaned the
  workspace permanently, with no reclaim path and no expiry sweeping the rows.
  Shipping a known dead end and disclosing it in the UI is worse than not
  shipping it.
- **The stated security property did not hold.** The spec called for "a bare
  128-bit random ID", but the id was a uuidv7 — 48 bits of that are a plaintext
  timestamp, and within a single millisecond only ~32 bits are freshly random.
  Making it true meant a second random column, i.e. more surface for a
  throwaway feature.

**Where auth attaches if it ever should:** add an `owner_id` to `domains` and a
filter in the query layer. Nothing else in the design assumes a global list —
the engine, the ladder, and the machine never look at ownership.

**Cost accepted:** anyone with the URL sees every claimed domain. Correct for a
demo, wrong for production, and stated here rather than discovered.

## D2 · Two resolvers, as failover — not consensus

**Chosen:** Cloudflare DoH is primary; Google DoH is queried **only** when
Cloudflare returns `kind: 'error'`.

**Rejected:** querying both every time and requiring agreement.

**Why:** the single-resolver design had one real flaw — a Cloudflare outage
surfaced to users as `DNS_UNREACHABLE`, a verdict about *their* DNS caused by
*our* dependency. Failover fixes exactly that, for one extra request on the rare
error path and no change to the decision ladder: exactly one outcome still
reaches `diagnose()`, so no new state, no new code, no new tests.

Consensus would additionally catch mid-propagation disagreement, but it doubles
every check's latency and introduces a state the UI must explain. That trade
isn't worth it while the ladder is the thing being demonstrated. SPEC §12 keeps
the design.

**Honest caveat, unchanged by this:** two resolvers queried from one server share
an egress IP. That is two cache pools, not two vantage points. Real multi-vantage
verification means checkers in multiple regions — infrastructure, not config.

**Verified before adopting** (real queries, not assumption):

| | Cloudflare | Google |
|---|---|---|
| TXT `data` | `"\"MS=ms44452932\""` — escaped quotes | `MS=ms44452932` — bare |
| `name` | `github.com` | `github.com.` — trailing dot |
| Negative SOA TTL, same query | 86400 | 1800 |

Each adapter therefore owns its own normalization, which is why parsing lives in
the adapter rather than in shared code. Google returning a bare value would be
silently mis-parsed by a quote-stripper written for Cloudflare.

## D3 · The record stays at `_claim.<domain>`

**Chosen:** TXT at `_claim.<domain>` with value `verify=<token>`. Unchanged from
the original spec, but re-examined and kept deliberately.

**Rejected:** apex TXT with a vendor-prefixed key
(`verify-domain-verification=<token>`), which is what Google, Apple, Atlassian,
Calendly, Jamf, Loom and Miro all use — verified by reading github.com's live
apex TXT records.

**Why the industry pattern loses here:** it would delete two of the six
diagnosis codes. `RECORD_NAME_MISSING` becomes unreachable, because the apex
always exists — NXDOMAIN there means the *domain* doesn't exist, a different
finding. And `ZONE_NAME_APPENDED` — the doubled-name bug the appended probe is
built to catch — largely stops happening, because there is no host field for a
provider to append the zone to. The apex convention is right for products whose
verification is a yes/no; this product's entire value is the diagnosis.

The collision risk that normally justifies a vendor prefix does not apply at a
scoped name: nothing else writes to `_claim`.

## D4 · UI never names a check interval

**Chosen:** "We keep checking while you're here", plus the concrete
`next_check_at` timestamp from the API.

**Rejected:** "We check every 30 seconds while you're here, and daily once
verified", which an earlier design draft specified.

**Why:** it isn't true. Checks run on read and only when `next_check_at` is due,
and the backoff in SPEC §6 pushes that out as failures accumulate. A visible
next-check time is both honest and more useful than an interval. This is
invariant 6 applied to the invariant's own source document.

## D5 · Pinned toolchain

- **Drizzle 0.44.x** — v1 is at `1.0.0-rc.4`. Pinned to stable deliberately.
- **TypeScript 5.9.x** — `typescript@latest` is now **7.x, the Go port**. Next 16
  does not list it as supported, and `tsconfig.json` uses the `next` TS
  language-service plugin. An unpinned `^` here silently swaps the compiler.
- **`packageManager: pnpm@11.15.1`** — CI's `pnpm/action-setup@v4` takes no
  version input and reads this field. Without it CI fails at install.
- **`uuid` column type, not `text`** — both hold a uuidv7 minted app-side, but
  `uuid` validates format in the database, stores 16 bytes instead of ~37, and
  keeps foreign keys declarable. `text` would accept `''` and let two rows spell
  the same id differently.

---

## Scope

### In

Domain claim and normalization (PSL rejection, IDN), the DoH resolver layer with
its `QueryOutcome` union, the six-code diagnosis ladder, the token, the
three-state lifecycle machine, check-on-read plus a daily cron sweep, the
appended-name probe, provider detection, and the UI that renders all of it.

### Out, deliberately

| Not built | Why |
|---|---|
| Accounts and sessions | D1 |
| Multi-resolver consensus | D2 — failover ships; consensus is designed in SPEC §12 |
| Hysteresis (`temporarily_failed`, `revoked`) | The 5 enum values ship so the states are addable without a migration; the transitions are not built. Full table is in the README as designed-not-built. |
| DomainConnect | A per-provider integration surface; detection plus a deep link gets most of the value |
| Soft delete, timeline pagination | Volume doesn't justify either at this scale |
| DoH response caching | A verification product wants fresh answers |
| Retries inside a check | The schedule *is* the retry mechanism |
| Queue infrastructure | `next_check_at` + `SKIP LOCKED` is the queue at this scale |
| DNSSEC validation | Doesn't change any of the six diagnoses |
| Integration tests against real fixture zones | The gold standard for this engine, and the first thing to add after submission |

### Known limitations

1. **The domain list is public to anyone with the URL** (D1).
2. **Two resolvers, one vantage point** — shared egress IP, so geographic
   propagation differences are invisible (D2).
3. **Claim expiry runs on a daily cron**, so a 72h TTL expires somewhere in
   72–96h. No copy promises the exact hour.
4. **Migrations are applied by hand**, not by CI. Deploy and schema change are
   two separate acts, and nothing enforces their order.
