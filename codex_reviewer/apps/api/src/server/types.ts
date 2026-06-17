import type { Logger } from "pino";
import type { ApiConfig } from "../config/env.js";

export type ApiDependencies = {
  config: ApiConfig;
  logger: Logger;
};

export type ApiBindings = {
  Variables: {
    context: ApiDependencies;
  };
};
