import pino from "pino";
import { loadApiConfig } from "../config/env.js";
import { createDatabaseConnection } from "../db/client.js";
import { createReviewReadStore } from "../review/read-store.js";
import type { ApiDependencies } from "./types.js";

export function createRuntimeDependencies(): ApiDependencies {
  const config = loadApiConfig();
  const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
  });
  const connection = createDatabaseConnection(config.databaseUrl);

  return {
    config,
    logger,
    reviewReadStore: createReviewReadStore(connection.db),
  };
}
