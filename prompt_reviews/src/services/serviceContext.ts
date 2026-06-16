import type { PromptReviewsDatabase } from "../db/client.js";
import { unixSecondsNow } from "../db/timestamps.js";
import { withRepositoryTransaction, type PromptReviewsTransaction, type RepositoryDatabase } from "../repositories/index.js";

export type TimeSource = () => number;

export type ServiceContext = {
  db: RepositoryDatabase;
  now: TimeSource;
};

export type RootServiceContext = ServiceContext & {
  db: PromptReviewsDatabase;
};

export type CreateServiceContextOptions = {
  db: PromptReviewsDatabase;
  now?: TimeSource;
};

export function createServiceContext(options: CreateServiceContextOptions): RootServiceContext {
  return {
    db: options.db,
    now: options.now ?? unixSecondsNow,
  };
}

export function withServiceTransaction<T>(
  context: RootServiceContext,
  work: (context: ServiceContext & { db: PromptReviewsTransaction }) => T,
): T {
  return withRepositoryTransaction(context.db, (tx) => work({ ...context, db: tx }));
}
