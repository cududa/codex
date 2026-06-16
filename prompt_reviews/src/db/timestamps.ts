import { sql } from "drizzle-orm";

export function unixSecondsNow(): number {
  return Math.floor(Date.now() / 1000);
}

export const sqliteUnixSecondsNow = sql`(unixepoch())`;
