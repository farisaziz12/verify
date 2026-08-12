/** Joins class names, dropping the falsy ones. */
export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}
