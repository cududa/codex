import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as relations from "./relations.js";
import * as schema from "./schema.js";

export type PromptReviewsDatabase = BetterSQLite3Database<typeof fullSchema>;

const fullSchema = { ...schema, ...relations };

export type OpenPromptReviewsDatabase = {
  db: PromptReviewsDatabase;
  sqlite: Database.Database;
  close: () => void;
};

export function openPromptReviewsDatabase(filename: string): OpenPromptReviewsDatabase {
  const sqlite = new Database(filename);
  sqlite.pragma("foreign_keys = ON");

  return {
    db: drizzle(sqlite, { schema: fullSchema }),
    sqlite,
    close: () => sqlite.close(),
  };
}
