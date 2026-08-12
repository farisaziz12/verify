/**
 * The grid the header and every row share.
 *
 * Below `sm` the last-checked column is dropped: 150px and 110px of fixed columns leave a
 * domain name about 50px on a phone.
 */
export const COLUMNS = 'grid grid-cols-[1fr_auto] gap-3 sm:grid-cols-[1fr_150px_110px] sm:gap-4'

/** A body row: the shared grid plus its own padding and divider. */
export const ROW = `${COLUMNS} border-edge-subtle items-center border-b px-4 py-3.5`
