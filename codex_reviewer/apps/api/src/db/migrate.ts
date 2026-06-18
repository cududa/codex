import type { Client } from "@libsql/client";
import { databaseMigrations, type DatabaseMigration } from "./migrations/index.js";

export async function migrateDatabase(
  client: Client,
  migrations: DatabaseMigration[] = databaseMigrations,
): Promise<void> {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  for (const migration of migrations) {
    const existing = await client.execute({
      sql: "SELECT id FROM schema_migrations WHERE id = ?",
      args: [migration.id],
    });
    if (existing.rows.length > 0) {
      continue;
    }

    await client.execute("BEGIN");
    try {
      for (const statement of migration.statements) {
        await client.execute(statement);
      }
      await client.execute({
        sql: "INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)",
        args: [migration.id, new Date().toISOString()],
      });
      await client.execute("COMMIT");
    } catch (error) {
      await client.execute("ROLLBACK");
      throw error;
    }
  }
}
