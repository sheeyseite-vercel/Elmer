// Server Actions accept ~1 MB bodies by default, so keep CSVs well below that.
export const MAX_CSV_CHARS = 700_000;
export const MAX_CSV_ROWS = 20_000;
