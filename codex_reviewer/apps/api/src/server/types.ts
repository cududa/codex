import type { Logger } from "pino";
import type { ApiConfig } from "../config/env.js";
import type { ReviewIngestService } from "../review/ingest-service.js";
import type { ReviewReadStore } from "../review/read-store.js";
import type { ReviewWriteStore } from "../review/write-store.js";

export type ApiDependencies = {
  config: ApiConfig;
  logger: Logger;
  reviewIngestService: ReviewIngestService;
  reviewReadStore: ReviewReadStore;
  reviewWriteStore: ReviewWriteStore;
};

export type ApiBindings = {
  Variables: {
    context: ApiDependencies;
  };
};
