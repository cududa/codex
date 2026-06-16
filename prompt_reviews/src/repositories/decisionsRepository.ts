import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import type { DecisionScopeType, DecisionStatus } from "../domain/enums.js";
import { commitFiles, commits, decisions, versions } from "../db/schema.js";
import { unixSecondsNow } from "../db/timestamps.js";
import type { RepositoryDatabase } from "./database.js";

export type DecisionRow = typeof decisions.$inferSelect;
export type DecisionInsert = typeof decisions.$inferInsert;
export type DecisionTarget = {
  scope: DecisionScopeType;
  targetId: string;
};

const activeDecisionStatuses = ["proposed"] as const satisfies readonly DecisionStatus[];

export function createDecision(db: RepositoryDatabase, values: DecisionInsert): DecisionRow {
  return db.insert(decisions).values(values).returning().get();
}

export type DecisionUpdate = Partial<
  Pick<
    DecisionRow,
    | "status"
    | "outcome"
    | "rationale"
    | "finalizedByActorType"
    | "finalizedByActorId"
    | "finalizedByDisplayName"
    | "riskLevel"
    | "confidence"
    | "updatedAt"
    | "finalizedAt"
  >
>;

export function updateDecision(db: RepositoryDatabase, id: string, values: DecisionUpdate): DecisionRow | undefined {
  return db
    .update(decisions)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(decisions.id, id))
    .returning()
    .get();
}

export function findActiveDecisionByTarget(
  db: RepositoryDatabase,
  target: DecisionTarget,
  statuses: readonly DecisionStatus[] = activeDecisionStatuses,
): DecisionRow | undefined {
  if (statuses.length === 0) {
    return undefined;
  }
  return db
    .select()
    .from(decisions)
    .where(
      and(
        eq(decisions.scope, target.scope),
        decisionTargetCondition(target),
        inArray(decisions.status, statuses),
      ),
    )
    .orderBy(asc(decisions.createdAt), asc(decisions.id))
    .get();
}

export function listVersionsMissingActiveDecision(
  db: RepositoryDatabase,
  params: { repositoryId: string; statuses?: readonly DecisionStatus[] },
): (typeof versions.$inferSelect)[] {
  const statuses = params.statuses ?? activeDecisionStatuses;
  return db
    .select({ version: versions })
    .from(versions)
    .leftJoin(
      decisions,
      and(
        eq(decisions.scope, "version"),
        eq(decisions.versionId, versions.id),
        inArray(decisions.status, statuses),
      ),
    )
    .where(and(eq(versions.repositoryId, params.repositoryId), isNull(decisions.id)))
    .orderBy(asc(versions.createdAt), asc(versions.id))
    .all()
    .map((row) => row.version);
}

export function listCommitsMissingActiveDecision(
  db: RepositoryDatabase,
  params: { versionId: string; statuses?: readonly DecisionStatus[] },
): (typeof commits.$inferSelect)[] {
  const statuses = params.statuses ?? activeDecisionStatuses;
  return db
    .select({ commit: commits })
    .from(commits)
    .leftJoin(
      decisions,
      and(
        eq(decisions.scope, "commit"),
        eq(decisions.commitId, commits.id),
        inArray(decisions.status, statuses),
      ),
    )
    .where(and(eq(commits.versionId, params.versionId), isNull(decisions.id)))
    .orderBy(asc(commits.ordinal), asc(commits.id))
    .all()
    .map((row) => row.commit);
}

export function listCommitFilesMissingActiveDecision(
  db: RepositoryDatabase,
  params: { commitId?: string; versionId?: string; statuses?: readonly DecisionStatus[] },
): (typeof commitFiles.$inferSelect)[] {
  const statuses = params.statuses ?? activeDecisionStatuses;
  const filters = [isNull(decisions.id)];
  if (params.commitId !== undefined) {
    filters.push(eq(commitFiles.commitId, params.commitId));
  }
  if (params.versionId !== undefined) {
    filters.push(eq(commits.versionId, params.versionId));
  }

  return db
    .select({ file: commitFiles })
    .from(commitFiles)
    .innerJoin(commits, eq(commits.id, commitFiles.commitId))
    .leftJoin(
      decisions,
      and(
        eq(decisions.scope, "commit_file"),
        eq(decisions.commitFileId, commitFiles.id),
        inArray(decisions.status, statuses),
      ),
    )
    .where(and(...filters))
    .orderBy(asc(commits.ordinal), asc(commitFiles.createdAt), asc(commitFiles.id))
    .all()
    .map((row) => row.file);
}

function decisionTargetCondition(target: DecisionTarget) {
  if (target.scope === "version") {
    return eq(decisions.versionId, target.targetId);
  }
  if (target.scope === "commit") {
    return eq(decisions.commitId, target.targetId);
  }
  return eq(decisions.commitFileId, target.targetId);
}
