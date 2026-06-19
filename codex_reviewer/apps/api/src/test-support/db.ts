import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createDatabaseConnection, type ReviewDatabaseConnection } from "../db/client.js";
import { migrateDatabase } from "../db/migrate.js";

const tempDirectories: string[] = [];

export async function migratedTestConnection(): Promise<ReviewDatabaseConnection> {
  const connection = createUnmigratedTestConnection();
  await migrateDatabase(connection.client);
  return connection;
}

export function createUnmigratedTestConnection(): ReviewDatabaseConnection {
  const directory = mkdtempSync(join(tmpdir(), "codex-reviewer-"));
  tempDirectories.push(directory);
  return createDatabaseConnection(`file:${join(directory, "review.db")}`);
}

export function cleanupTestDatabases(): void {
  for (const directory of tempDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
}
