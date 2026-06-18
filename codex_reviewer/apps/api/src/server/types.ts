import type { Logger } from "pino";
import type { ApiConfig } from "../config/env.js";
import type { ReviewReadStore } from "../review/read-store.js";

export type ApiDependencies = {
  config: ApiConfig;
  logger: Logger;
  reviewReadStore: ReviewReadStore;
};

export type ApiBindings = {
  Variables: {
    context: ApiDependencies;
  };
};
