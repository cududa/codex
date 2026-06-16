import { randomUUID } from "node:crypto";

export function createDbId(prefix?: string): string {
  const id = randomUUID();
  return prefix === undefined ? id : `${prefix}_${id}`;
}
