/**
 * A hostname containing only characters legal in a DNS name, after punycoding.
 *
 * Accepts: lowercase letters, digits, dots, hyphens — so `xn--bcher-kva.de` passes.
 * Rejects: uppercase (normalisation should already have lowercased), underscores, spaces,
 * and any character an IDN should have been converted away from.
 *
 * Anchored at both ends, so a single illegal character anywhere fails the whole name.
 */
export const ASCII_HOSTNAME = /^[a-z0-9.-]+$/

/**
 * A hostname whose dots and hyphens are arranged in a way DNS cannot represent.
 *
 * Matches, and therefore rejects:
 *   - `..`        an empty label between two dots  (`a..b.com`)
 *   - `^[.-]`     a leading dot or hyphen          (`-bad.com`, `.example.com`)
 *   - `[.-]$`     a trailing dot or hyphen         (`example.com-`)
 *
 * The trailing *root* dot (`example.com.`) is legal and is stripped before this runs, so
 * reaching here with one means the input was malformed in some other way.
 */
export const MALFORMED_STRUCTURE = /\.\.|^[.-]|[.-]$/

/**
 * A leading `www.` label, which is stripped rather than claimed.
 *
 * Matches only at the start and only the full label, so `www.example.com` is trimmed while
 * `wwwx.example.com` and `my.www.example.com` are left alone.
 */
export const WWW_PREFIX = /^www\./
