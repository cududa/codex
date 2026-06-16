import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import type { OpenPromptReviewsDatabase } from "./client.js";

export type MigrationOptions = {
  migrationsFolder?: string;
};

export function migratePromptReviewsDatabase(
  database: OpenPromptReviewsDatabase,
  options: MigrationOptions = {},
): void {
  database.sqlite.pragma("foreign_keys = ON");
  migrate(database.db, { migrationsFolder: options.migrationsFolder ?? "drizzle" });
  database.sqlite.pragma("foreign_keys = ON");
}
