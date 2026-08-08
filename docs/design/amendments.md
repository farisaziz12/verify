# Design amendments

`prototype.html` is the source of truth for layout, states, and interactions.
Implement it pixel-faithfully EXCEPT for the following amendments, which apply
everywhere:

1. **Sentence case.** All copy in the prototype is lowercase ("add domain",
   "dns record", "couldn't check"). Implement in sentence case: "Add domain",
   "DNS record", "Couldn't check". Applies to headings, buttons, labels,
   status words, and body copy. Keep record names/values and the query trail
   exactly as-is (they are literal technical values).
2. **Token value format — resolved, no change.** The product is named Verify,
   so the prototype's `verify=<token>` is already the product-prefixed form.
3. **Cadence copy matches the real schedule.** The prototype says "we'll keep
   checking every 10 seconds" (status copy) and "checked every 10 seconds
   while pending" (list tooltip). The real model is check-on-read + daily cron
   (SPEC §6). Replace with **"We keep checking while you're here."** — and
   nothing more specific. An earlier draft said "every 30 seconds"; that is not
   a promise the system keeps, because a check runs on read only when
   `next_check_at` is due and backoff pushes that out. The "watching · every
   10s" label becomes "Watching" plus the next-check time from the API
   (`next_check_at`), which is the one honest number available. The UI must
   never promise a cadence the system doesn't keep (invariant 6).
4. **Fonts & surfaces.** JetBrains Mono → CommitMono (fallback ui-monospace);
   page `#0a0a0a` → `#000`; flat borders `#232323`/`#1c1c1c` → low-alpha white
   (`rgba(255,255,255,0.08)` / `rgba(255,255,255,0.05)`). Inter stays.

Also carried over from the build spec (not visible in the prototype):

- The negative-cache advisory is a conditional extra line in the status card,
  rendered only when a check's notes include it (SPEC §3.4).
- Provider detection (PLAN #9) auto-opens the detected provider's accordion
  and pre-fills the "open your DNS settings" link; the accordions otherwise
  behave exactly as prototyped.
- Timestamps render in client components only (hydration safety), formatted
  as in the prototype (HH:MM:SS + relative).
