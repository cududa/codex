import type { PromptReviewsDatabase } from "../db/client.js";
import type { PopulateNextVersionParams, PopulateNextVersionResponse } from "../domain/schemas/index.js";
import { populateNextVersion, type PopulateNextVersionOptions } from "../ingestion/populateNextVersion.js";

export type IngestionService = {
  populateNextVersion: (params: PopulateNextVersionParams) => Promise<PopulateNextVersionResponse>;
};

export type IngestionServiceDependencies = PopulateNextVersionOptions & {
  db: PromptReviewsDatabase;
};

export function createIngestionService(dependencies: IngestionServiceDependencies): IngestionService {
  return {
    populateNextVersion: (params) => populateNextVersion(dependencies.db, params, dependencies),
  };
}
