# Verify

Verify checks domain ownership using a TXT record. When verification fails, it stores
the diagnosis and tells the user what to change.

![Domains with verified and failed checks](assets/domains-list.png)

## Quick start

You need:

- Node.js 22 or later
- pnpm 11.15.1
- A Postgres database

The Node.js and pnpm versions are pinned in `package.json`. The app was developed
against [Neon](https://neon.com/), but any Postgres URL accepted by the driver will work.

Install the dependencies and create a local environment file:

```sh
pnpm install
cp .env.example .env
```

Set `DATABASE_URL` in `.env`. Leave `SITE_PASSWORD` empty for local development.
Set `SITE_PASSWORD` on Vercel (Production and Preview) to require a password;
access lasts one hour.

Run the migrations, then start the development server:

```sh
pnpm db:migrate
pnpm dev
```

Open `http://localhost:3000`.

## Verify a domain

Add a domain from the domains page. Verify creates a 26-character token and shows the
TXT record to publish:

```text
name   _claim.<your-domain>
type   TXT
value  verify=<26-character token>
```

Add the record through your DNS provider.

Keep the domain detail page open. It rechecks DNS periodically and updates the result
when the record appears.

To reproduce the failure states, publish the record with an incorrect value.

## Verification results

Verify stores a diagnosis with the result so the interface can show the corresponding correction.

| DNS response | Result | Correction |
|---|---|---|
| Expected token at `_claim.<domain>` | Verified | None |
| Expected token at `_claim.<domain>.<domain>` | Wrong record name | Enter only `_claim` in the provider's host field |
| TXT record at the expected name with a different value | Value mismatch | Replace the value with the expected token |
| No usable TXT answer yet | Verification pending | Check the record and wait for DNS caches to expire |
| DNS lookup cannot be completed | Check failed | Retry the check after the DNS error clears |

The detail page shows the expected token beside the value returned by DNS when they do
not match. This makes quoting, spacing, and copy-and-paste errors visible.

## How a check runs

```mermaid
sequenceDiagram
    actor User
    participant Browser
    participant App as Next.js app
    participant DB as Postgres
    participant Resolver as DNS-over-HTTPS resolver
    participant DNS as Authoritative DNS

    User->>Browser: Add a domain
    Browser->>App: Create verification
    App->>DB: Store domain and token
    App-->>Browser: Show TXT name and value

    User->>DNS: Publish TXT record

    loop While the detail page is open
        Browser->>App: Request verification
        App->>Resolver: Query _claim.example.com
        Resolver->>DNS: Resolve TXT record
        DNS-->>Resolver: Return DNS answer
        Resolver-->>App: Return TXT values or an error
        App->>DB: Store result and diagnosis
        App-->>Browser: Return status and correction
    end
```

The browser queries a Next.js API handler, which initiates a TXT record lookup and compares
it to the stored token, saves a diagnosis, and returns the current status.

Verify also checks the repeated hostname form:

```text
_claim.example.com.example.com
```

This catches a common DNS-provider mistake. A user enters the full record name even though the provider automatically appends the domain.

## Why store the diagnosis?

We save the diagnosis so it is still there after a page reload and the UI can say why a check failed, without needing to re-calculate the result.

The following failures are separately recognized and separately handled:

- no record found
- record at the wrong hostname
- record with the wrong value
- DNS lookup failed

Each case requires a different response. Retrying will not fix a record published at the wrong hostname, and replacing the token will not fix a DNS lookup failure.

## DNS behavior

DNS changes are not immediate. A provider may publish a record quickly while recursive
resolvers continue returning an older cached response until its TTL expires.

A failed check therefore records what DNS returned at that time. It does not assume
that every missing answer is a permanent configuration error.

## Environment variables

| Variable | Required | Purpose |
|---|---:|---|
| `DATABASE_URL` | Yes | Postgres connection string |

Example:

```dotenv
DATABASE_URL=postgresql://user:password@host/database
```

## Commands

```sh
pnpm dev
```

Starts the Next.js development server.

```sh
pnpm db:migrate
```

Applies the database migrations.

```sh
pnpm check
```

Runs Biome and `tsc --noEmit`.

```sh
pnpm test
```

Runs the 149-test Vitest suite.

```sh
pnpm build
```

Creates a production build.

Run the full local check with:

```sh
pnpm check
pnpm test
pnpm build
```

## Architecture

Verification is a thin pure core with I/O at the edges:

1. **DNS** (`lib/dns/`) — DoH adapters return a `QueryOutcome` value; transport
   failures never throw past the adapter.
2. **Diagnose** (`lib/verification/diagnose.ts`) — turns outcomes into a diagnosis
   code (match, doubled hostname, mismatch, missing, unreachable).
3. **Machine** (`lib/verification/machine.ts`) — the only producer of status
   changes; schedules `next_check_at`.
4. **Engine** (`lib/verification/engine.ts`) — shared by manual and automatic
   checks; performs lookups and returns data for the caller to persist.

Design choices and deliberate non-goals live in [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Implementation notes

### Tokens

Each domain gets its own 26-character verification token:

```text
verify=<token>
```

The `verify=` prefix separates these records from unrelated TXT values at the same
hostname.

### DNS lookups

Checks use DNS-over-HTTPS rather than the machine's local resolver. This gives the
application a structured DNS response that can be classified before the result is stored.

### Rechecks

Rechecks run while the detail page is open. There is no background verification job
(out of scope).

### Product features

- **Accounts and private workspaces** — There is no per-user authentication or
  ownership. When `SITE_PASSWORD` is set, a shared password is required and access
  lasts one hour. Anyone who gets in still sees every domain in the deployment.
  With the variable unset, the app is open to anyone with the URL.
- **Notifications** — no email or webhooks when a domain verifies, drifts, or expires.

### Lifecycle depth

- **Record drift** — a verified domain stays verified if the TXT record later goes missing
  or changes, even though domain ownership can change over time. Status never moves back.
- **Background checks** — there is no cron sweep. DNS is only queried on the detail page.
- **Reserved statuses** — the database enum still includes `expired`,
  `temporarily_failed`, and `revoked`, but the machine never writes them. Unused
  failure-counter columns were removed; see D6 in `docs/DECISIONS.md`.

### Scale and polish

- **Domain list features** — no pagination, search, or filtering.
- **Check history pagination** — the activity timeline shows only the most recent checks,
  rather than the full history.
- **Mobile-specific layout work** — the UI is responsive, but layouts were not redesigned
  or optimized specifically for mobile.
- **Provider-specific setup guides** — DNS instructions stay basic rather than covering
  each provider in depth.
- **Multi-resolver consensus** — checks use Cloudflare first. If Cloudflare fails, the
  platform tries Google instead. This prevents a Cloudflare outage from being reported as
  a problem with the user's DNS.

  The platform does not query both services every time. Doing that would make checks slower
  and create another result to explain when they differ. Both queries also come from
  the same server, so this does not test DNS from different parts of the world.

- **Integration tests** — the test suite replays saved DNS responses. This makes the results
  repeatable and keeps CI fast, but it does not test real DNS lookups or propagation.

  The next test to add should use a domain we control: publish a TXT record, run the
  check, and confirm that the app reports the correct result.
- **CI migrations** — database migrations are applied manually, not enforced in the deploy
  pipeline.