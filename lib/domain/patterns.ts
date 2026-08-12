/** Expects a post-punycode, lowercased name. */
export const ASCII_HOSTNAME = /^[a-z0-9.-]+$/

/** Matching means reject. */
export const MALFORMED_STRUCTURE = /\.\.|^[.-]|[.-]$/

export const WWW_PREFIX = /^www\./
