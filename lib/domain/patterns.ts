/** Characters legal in a DNS name, post-punycode. Rejects uppercase — normalise first. */
export const ASCII_HOSTNAME = /^[a-z0-9.-]+$/

/** An empty label (`a..b`), or a leading or trailing dot or hyphen. Matching means reject. */
export const MALFORMED_STRUCTURE = /\.\.|^[.-]|[.-]$/

/** A leading `www.` label only — `wwwx.example.com` and `my.www.example.com` do not match. */
export const WWW_PREFIX = /^www\./
