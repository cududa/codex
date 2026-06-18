import type { Logger } from "pino";
import type { ApiConfig } from "../config/env.js";
import type { ReviewWriteStore } from "../review/write-store.js";

export type ApiDependencies = {
  config: ApiConfig;
  logger: Logger;
  reviewWriteStore: ReviewWriteStore;
};

export type ApiBindings = {
  Variables: {
    context: ApiDependencies;
  };
};
