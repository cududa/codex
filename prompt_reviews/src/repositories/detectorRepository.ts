import { and, asc, desc, eq, inArray, notInArray } from "drizzle-orm";
import {
  concernGraphEdges,
  concernGraphNodes,
  detectorFindings,
  detectorRuns,
} from "../db/schema.js";
import { unixSecondsNow } from "../db/timestamps.js";
import type { DetectorFindingSummary } from "../domain/schemas/index.js";
import type { RepositoryDatabase } from "./database.js";

export type ConcernGraphNodeRow = typeof concernGraphNodes.$inferSelect;
export type ConcernGraphNodeInsert = typeof concernGraphNodes.$inferInsert;
export type ConcernGraphEdgeRow = typeof concernGraphEdges.$inferSelect;
export type ConcernGraphEdgeInsert = typeof concernGraphEdges.$inferInsert;
export type DetectorRunRow = typeof detectorRuns.$inferSelect;
export type DetectorRunInsert = typeof detectorRuns.$inferInsert;
export type DetectorFindingRow = typeof detectorFindings.$inferSelect;
export type DetectorFindingInsert = typeof detectorFindings.$inferInsert;

export function createDetectorRun(db: RepositoryDatabase, values: DetectorRunInsert): DetectorRunRow {
  return db.insert(detectorRuns).values(values).returning().get();
}

export function updateDetectorRun(
  db: RepositoryDatabase,
  id: string,
  values: Partial<Omit<DetectorRunInsert, "id" | "createdAt">>,
): DetectorRunRow | undefined {
  return db
    .update(detectorRuns)
    .set({ ...values, updatedAt: values.updatedAt ?? unixSecondsNow() })
    .where(eq(detectorRuns.id, id))
    .returning()
    .get();
}

export function findDetectorRunById(db: RepositoryDatabase, id: string): DetectorRunRow | undefined {
  return db.select().from(detectorRuns).where(eq(detectorRuns.id, id)).get();
}

export function listDetectorRunsByVersion(db: RepositoryDatabase, versionId: string): DetectorRunRow[] {
  return db
    .select()
    .from(detectorRuns)
    .where(eq(detectorRuns.versionId, versionId))
    .orderBy(desc(detectorRuns.startedAt), desc(detectorRuns.id))
    .all();
}

export function listDetectorRunsByRepository(db: RepositoryDatabase, repositoryId: string): DetectorRunRow[] {
  return db
    .select()
    .from(detectorRuns)
    .where(eq(detectorRuns.repositoryId, repositoryId))
    .orderBy(desc(detectorRuns.createdAt), desc(detectorRuns.id))
    .all();
}

export function upsertConcernGraphNode(db: RepositoryDatabase, values: ConcernGraphNodeInsert): ConcernGraphNodeRow {
  const updatedAt = values.updatedAt ?? unixSecondsNow();
  const insertValues = {
    ...values,
    isSeed: values.isSeed ?? false,
    isKnownMissing: values.isKnownMissing ?? false,
    metadataJson: values.metadataJson ?? "{}",
  };

  return db
    .insert(concernGraphNodes)
    .values(insertValues)
    .onConflictDoUpdate({
      target: concernGraphNodes.nodeKey,
      set: {
        concernSlug: values.concernSlug,
        nodeKind: values.nodeKind,
        path: values.path ?? null,
        symbol: values.symbol ?? null,
        marker: values.marker ?? null,
        displayName: values.displayName ?? null,
        description: values.description ?? null,
        sourceKind: values.sourceKind,
        sourceRef: values.sourceRef ?? null,
        isSeed: insertValues.isSeed,
        isKnownMissing: insertValues.isKnownMissing,
        metadataJson: insertValues.metadataJson,
        updatedAt,
      },
    })
    .returning()
    .get();
}

export function replaceConcernGraphNodes(
  db: RepositoryDatabase,
  params: {
    concernSlug: string;
    sourceKind: ConcernGraphNodeRow["sourceKind"];
    nodes: ConcernGraphNodeInsert[];
  },
): ConcernGraphNodeRow[] {
  const keys = params.nodes.map((node) => node.nodeKey);
  const staleFilter =
    keys.length === 0
      ? and(eq(concernGraphNodes.concernSlug, params.concernSlug), eq(concernGraphNodes.sourceKind, params.sourceKind))
      : and(
          eq(concernGraphNodes.concernSlug, params.concernSlug),
          eq(concernGraphNodes.sourceKind, params.sourceKind),
          notInArray(concernGraphNodes.nodeKey, keys),
        );

  db.delete(concernGraphNodes).where(staleFilter).run();

  return params.nodes.map((node) =>
    upsertConcernGraphNode(db, {
      ...node,
      concernSlug: params.concernSlug,
      sourceKind: params.sourceKind,
    }),
  );
}

export function findConcernGraphNodeByKey(db: RepositoryDatabase, nodeKey: string): ConcernGraphNodeRow | undefined {
  return db.select().from(concernGraphNodes).where(eq(concernGraphNodes.nodeKey, nodeKey)).get();
}

export function listConcernGraphNodes(
  db: RepositoryDatabase,
  filter: { concernSlug?: string; sourceKind?: ConcernGraphNodeRow["sourceKind"] } = {},
): ConcernGraphNodeRow[] {
  return db
    .select()
    .from(concernGraphNodes)
    .where(
      and(
        filter.concernSlug === undefined ? undefined : eq(concernGraphNodes.concernSlug, filter.concernSlug),
        filter.sourceKind === undefined ? undefined : eq(concernGraphNodes.sourceKind, filter.sourceKind),
      ),
    )
    .orderBy(asc(concernGraphNodes.concernSlug), asc(concernGraphNodes.nodeKey))
    .all();
}

export function upsertConcernGraphEdge(db: RepositoryDatabase, values: ConcernGraphEdgeInsert): ConcernGraphEdgeRow {
  const updatedAt = values.updatedAt ?? unixSecondsNow();
  const insertValues = { ...values, metadataJson: values.metadataJson ?? "{}" };

  return db
    .insert(concernGraphEdges)
    .values(insertValues)
    .onConflictDoUpdate({
      target: concernGraphEdges.edgeKey,
      set: {
        concernSlug: values.concernSlug,
        edgeKind: values.edgeKind,
        fromNodeId: values.fromNodeId,
        toNodeId: values.toNodeId,
        sourceKind: values.sourceKind,
        sourceRef: values.sourceRef ?? null,
        metadataJson: insertValues.metadataJson,
        updatedAt,
      },
    })
    .returning()
    .get();
}

export function replaceConcernGraphEdges(
  db: RepositoryDatabase,
  params: {
    concernSlug: string;
    sourceKind: ConcernGraphEdgeRow["sourceKind"];
    edges: ConcernGraphEdgeInsert[];
  },
): ConcernGraphEdgeRow[] {
  const keys = params.edges.map((edge) => edge.edgeKey);
  const staleFilter =
    keys.length === 0
      ? and(eq(concernGraphEdges.concernSlug, params.concernSlug), eq(concernGraphEdges.sourceKind, params.sourceKind))
      : and(
          eq(concernGraphEdges.concernSlug, params.concernSlug),
          eq(concernGraphEdges.sourceKind, params.sourceKind),
          notInArray(concernGraphEdges.edgeKey, keys),
        );

  db.delete(concernGraphEdges).where(staleFilter).run();

  return params.edges.map((edge) =>
    upsertConcernGraphEdge(db, {
      ...edge,
      concernSlug: params.concernSlug,
      sourceKind: params.sourceKind,
    }),
  );
}

export function listConcernGraphEdges(
  db: RepositoryDatabase,
  filter: { concernSlug?: string; sourceKind?: ConcernGraphEdgeRow["sourceKind"]; fromNodeId?: string; toNodeId?: string } = {},
): ConcernGraphEdgeRow[] {
  return db
    .select()
    .from(concernGraphEdges)
    .where(
      and(
        filter.concernSlug === undefined ? undefined : eq(concernGraphEdges.concernSlug, filter.concernSlug),
        filter.sourceKind === undefined ? undefined : eq(concernGraphEdges.sourceKind, filter.sourceKind),
        filter.fromNodeId === undefined ? undefined : eq(concernGraphEdges.fromNodeId, filter.fromNodeId),
        filter.toNodeId === undefined ? undefined : eq(concernGraphEdges.toNodeId, filter.toNodeId),
      ),
    )
    .orderBy(asc(concernGraphEdges.concernSlug), asc(concernGraphEdges.edgeKey))
    .all();
}

export function replaceDetectorFindingsForRun(
  db: RepositoryDatabase,
  runId: string,
  findings: DetectorFindingInsert[],
): DetectorFindingRow[] {
  db.delete(detectorFindings).where(eq(detectorFindings.runId, runId)).run();
  if (findings.length === 0) {
    return [];
  }
  return db.insert(detectorFindings).values(findings.map((finding) => ({ ...finding, runId }))).returning().all();
}

export function listDetectorFindingsByRun(db: RepositoryDatabase, runId: string): DetectorFindingRow[] {
  return db
    .select()
    .from(detectorFindings)
    .where(eq(detectorFindings.runId, runId))
    .orderBy(asc(detectorFindings.concernSlug), asc(detectorFindings.findingKey))
    .all();
}

export function listDetectorFindingsByTarget(
  db: RepositoryDatabase,
  target: { targetType: DetectorFindingRow["targetType"]; targetId: string },
): DetectorFindingRow[] {
  return db
    .select()
    .from(detectorFindings)
    .where(and(eq(detectorFindings.targetType, target.targetType), eq(detectorFindings.targetId, target.targetId)))
    .orderBy(desc(detectorFindings.createdAt), desc(detectorFindings.id))
    .all();
}

export function listDetectorFindingsByCommitIds(db: RepositoryDatabase, commitIds: readonly string[]): DetectorFindingRow[] {
  if (commitIds.length === 0) {
    return [];
  }
  return db
    .select()
    .from(detectorFindings)
    .where(inArray(detectorFindings.commitId, [...commitIds]))
    .orderBy(asc(detectorFindings.commitId), asc(detectorFindings.concernSlug), asc(detectorFindings.findingKey))
    .all();
}

export function listDetectorFindingsByCommitFileIds(
  db: RepositoryDatabase,
  commitFileIds: readonly string[],
): DetectorFindingRow[] {
  if (commitFileIds.length === 0) {
    return [];
  }
  return db
    .select()
    .from(detectorFindings)
    .where(inArray(detectorFindings.commitFileId, [...commitFileIds]))
    .orderBy(asc(detectorFindings.commitFileId), asc(detectorFindings.concernSlug), asc(detectorFindings.findingKey))
    .all();
}

export function listDetectorFindingsByDiffBlockIds(
  db: RepositoryDatabase,
  diffBlockIds: readonly string[],
): DetectorFindingRow[] {
  if (diffBlockIds.length === 0) {
    return [];
  }
  return db
    .select()
    .from(detectorFindings)
    .where(inArray(detectorFindings.diffBlockId, [...diffBlockIds]))
    .orderBy(asc(detectorFindings.diffBlockId), asc(detectorFindings.concernSlug), asc(detectorFindings.findingKey))
    .all();
}

export function listDetectorFindingSummariesByVersion(
  db: RepositoryDatabase,
  versionId: string,
): DetectorFindingSummary[] {
  const rows = db.select().from(detectorFindings).where(eq(detectorFindings.versionId, versionId)).all();
  const groups = new Map<string, DetectorFindingSummary>();

  for (const row of rows) {
    const key = `${row.concernSlug}\0${row.targetType}\0${row.targetId}`;
    const existing = groups.get(key);
    if (existing === undefined) {
      groups.set(key, {
        concernSlug: row.concernSlug as DetectorFindingSummary["concernSlug"],
        targetType: row.targetType,
        targetId: row.targetId,
        count: 1,
        evidenceSummaries: [row.summary],
      });
      continue;
    }

    existing.count += 1;
    addEvidenceSummary(existing.evidenceSummaries, row.summary);
  }

  return [...groups.values()].sort((left, right) =>
    left.concernSlug.localeCompare(right.concernSlug) ||
    left.targetType.localeCompare(right.targetType) ||
    left.targetId.localeCompare(right.targetId),
  );
}

function addEvidenceSummary(summaries: string[], summary: string): void {
  if (!summaries.includes(summary) && summaries.length < 5) {
    summaries.push(summary);
  }
}

export function deleteDetectorRunsByVersion(db: RepositoryDatabase, versionId: string): DetectorRunRow[] {
  const runIds = db.select({ id: detectorRuns.id }).from(detectorRuns).where(eq(detectorRuns.versionId, versionId)).all();
  if (runIds.length === 0) {
    return [];
  }
  return db.delete(detectorRuns).where(inArray(detectorRuns.id, runIds.map((row) => row.id))).returning().all();
}
