import pino from "pino";
import { loadApiConfig } from "../config/env.js";
import type { ApiDependencies } from "./types.js";

export function createRuntimeDependencies(): ApiDependencies {
  const config = loadApiConfig();
  const logger = pino({
    level: process.env.LOG_LEVEL ?? "info",
  });

  return {
    config,
    logger,
  };
}
