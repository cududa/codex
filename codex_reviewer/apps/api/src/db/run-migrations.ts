import pino from "pino";
import { loadApiConfig } from "../config/env.js";
import { createDatabaseConnection } from "./client.js";
import { migrateDatabase } from "./migrate.js";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });
const config = loadApiConfig();
const connection = createDatabaseConnection(config.databaseUrl);

try {
  await migrateDatabase(connection.client);
  logger.info({ databaseUrl: config.databaseUrl }, "Codex Reviewer database migrated");
} finally {
  connection.client.close();
}
