import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync } from "node:fs";
import * as schema from "./schema/index.js";

export type ReviewDatabase = LibSQLDatabase<typeof schema>;

export type ReviewDatabaseConnection = {
  client: Client;
  db: ReviewDatabase;
};

export function createDatabaseConnection(databaseUrl: string): ReviewDatabaseConnection {
  ensureDatabaseDirectory(databaseUrl);
  const client = createClient({ url: databaseUrl });
  return {
    client,
    db: drizzle(client, { schema }),
  };
}

function ensureDatabaseDirectory(databaseUrl: string): void {
  if (!databaseUrl.startsWith("file:")) {
    return;
  }

  const pathPart = databaseUrl.slice("file:".length);
  if (pathPart === ":memory:" || pathPart.length === 0) {
    return;
  }

  const filePath = pathPart.startsWith("/") ? pathPart : fileURLToPath(new URL(pathPart, `file://${process.cwd()}/`));
  mkdirSync(dirname(filePath), { recursive: true });
}
