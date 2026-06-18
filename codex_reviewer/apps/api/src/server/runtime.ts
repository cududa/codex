import pino from "pino";
import { loadApiConfig } from "../config/env.js";
import { createDatabaseConnection } from "../db/client.js";
import { createReviewWriteStore } from "../review/write-store.js";
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
    reviewWriteStore: createReviewWriteStore(connection.db),
  };
}
