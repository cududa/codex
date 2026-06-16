import { unixSecondsNow } from "../../db/timestamps.js";
import type {
  ConcernGraphSourceKind,
} from "../../domain/enums.js";
import type {
  ConcernAreaSlug,
} from "../../domain/schemas/concernDetector/index.js";
import type {
  ConcernGraphEdgeInsert,
  ConcernGraphEdgeRow,
  ConcernGraphNodeInsert,
  ConcernGraphNodeRow,
  DetectorFindingRow,
  DetectorRunInsert,
  DetectorRunRow,
} from "../../repositories/detectorRepository.js";
import {
  createDetectorRun,
  findDetectorRunById,
  replaceConcernGraphEdges,
  replaceConcernGraphNodes,
  replaceDetectorFindingsForRun,
  updateDetectorRun,
} from "../../repositories/detectorRepository.js";
import { withRepositoryTransaction, type RepositoryDatabase } from "../../repositories/index.js";
import type { ConcernGraphBuildEdge, ConcernGraphBuildNode, ConcernGraphBuildResult } from "../graph/index.js";
import { buildDetectorFindings } from "./findingBuilder.js";
import type { DetectorCommitInput } from "./types.js";

export type DetectorRunRequest = {
  id: string;
} & Pick<DetectorRunInsert, "repositoryId" | "runKind" | "concernMapVersion"> &
  Partial<
    Pick<
      DetectorRunInsert,
      "versionId" | "baseSha" | "targetSha" | "sourceRef" | "startedAt" | "createdAt" | "updatedAt"
    >
  >;

export type RunDetectorInput = {
  db: RepositoryDatabase;
  run: DetectorRunRequest;
  graph: ConcernGraphBuildResult;
  commits: DetectorCommitInput[];
  graphReplacementScopes?: GraphReplacementScope[];
};

export type RunDetectorResult = {
  run: DetectorRunRow;
  graphNodes: ConcernGraphNodeRow[];
  graphEdges: ConcernGraphEdgeRow[];
  findings: DetectorFindingRow[];
};

export type GraphReplacementScope = {
  concernSlug: ConcernAreaSlug;
  sourceKind: ConcernGraphSourceKind;
};

type ConcernSourceKey = `${string}\0${string}`;

export function runDetector(input: RunDetectorInput): RunDetectorResult {
  if (supportsTransactions(input.db)) {
    try {
      return withRepositoryTransaction(input.db, (tx) => runDetectorInRepository({ ...input, db: tx }, false));
    } catch (error) {
      markRunFailed(input.db, input.run, error);
      throw error;
    }
  }

  return runDetectorInRepository(input, true);
}

function runDetectorInRepository(input: RunDetectorInput, markFailedOnError: boolean): RunDetectorResult {
  let run: DetectorRunRow | undefined;

  try {
    run = ensureRunningRun(input.db, input.run);
    const graphReplacementScopes = replacementScopesFor(input.graph, input.graphReplacementScopes ?? []);
    const graphNodes = persistGraphNodes(input.db, input.graph.nodes, graphReplacementScopes);
    const graphEdges = persistGraphEdges(input.db, input.graph, graphNodes, graphReplacementScopes);
    const graphNodeIdsByKey = new Map(graphNodes.map((node) => [node.nodeKey, node.id]));
    const findings = replaceDetectorFindingsForRun(
      input.db,
      run.id,
      buildDetectorFindings({ runId: run.id, graph: input.graph, commits: input.commits }).map((finding) => ({
        ...finding,
        graphNodeId: graphNodeIdsByKey.get(finding.graphNodeKey ?? "") ?? null,
      })),
    );
    const completedAt = unixSecondsNow();
    const completed = updateDetectorRun(input.db, run.id, {
      status: "succeeded",
      completedAt,
      error: null,
      summaryJson: JSON.stringify({
        graphNodes: graphNodes.length,
        graphEdges: graphEdges.length,
        findings: findings.length,
      }),
      updatedAt: completedAt,
    });
    if (completed === undefined) {
      throw new Error(`Detector run disappeared before completion: ${run.id}`);
    }

    return { run: completed, graphNodes, graphEdges, findings };
  } catch (error) {
    if (markFailedOnError && run !== undefined) {
      markRunFailed(input.db, input.run, error);
    }
    throw error;
  }
}

function ensureRunningRun(db: RepositoryDatabase, request: DetectorRunRequest): DetectorRunRow {
  const startedAt = request.startedAt ?? unixSecondsNow();
  const values = {
    versionId: request.versionId ?? null,
    repositoryId: request.repositoryId,
    runKind: request.runKind,
    status: "running" as const,
    concernMapVersion: request.concernMapVersion,
    baseSha: request.baseSha ?? null,
    targetSha: request.targetSha ?? null,
    sourceRef: request.sourceRef ?? null,
    startedAt,
    completedAt: null,
    error: null,
    summaryJson: "{}",
    updatedAt: request.updatedAt ?? startedAt,
  };
  const existing = findDetectorRunById(db, request.id);
  if (existing !== undefined) {
    const updated = updateDetectorRun(db, request.id, values);
    if (updated === undefined) {
      throw new Error(`Failed to update detector run: ${request.id}`);
    }
    return updated;
  }

  return createDetectorRun(db, { id: request.id, createdAt: request.createdAt ?? startedAt, ...values });
}

function persistGraphNodes(
  db: RepositoryDatabase,
  nodes: readonly ConcernGraphBuildNode[],
  replacementScopes: readonly GraphReplacementScope[],
): ConcernGraphNodeRow[] {
  const persisted: ConcernGraphNodeRow[] = [];
  const nodesByGroup = groupItemsByConcernSource(nodes, graphNodeSourceKey);
  for (const scope of replacementScopes) {
    const key = replacementScopeKey(scope);
    const scopedNodes = nodesByGroup.get(key) ?? [];
    persisted.push(
      ...replaceConcernGraphNodes(db, {
        concernSlug: scope.concernSlug,
        sourceKind: scope.sourceKind,
        nodes: scopedNodes.map(toGraphNodeInsert),
      }),
    );
  }
  return sortRowsByKey(persisted, "nodeKey");
}

function persistGraphEdges(
  db: RepositoryDatabase,
  graph: ConcernGraphBuildResult,
  persistedNodes: readonly ConcernGraphNodeRow[],
  replacementScopes: readonly GraphReplacementScope[],
): ConcernGraphEdgeRow[] {
  const nodesByKey = new Map(persistedNodes.map((node) => [node.nodeKey, node]));
  const edgesByGroup = new Map<ConcernSourceKey, ConcernGraphBuildEdge[]>();
  for (const edge of graph.edges) {
    appendToGroup(edgesByGroup, graphEdgeSourceKey(edge), edge);
  }

  const persisted: ConcernGraphEdgeRow[] = [];
  for (const scope of replacementScopes) {
    const edges = edgesByGroup.get(replacementScopeKey(scope)) ?? [];
    persisted.push(
      ...replaceConcernGraphEdges(db, {
        concernSlug: scope.concernSlug,
        sourceKind: scope.sourceKind,
        edges: edges.map((edge) => toGraphEdgeInsert(edge, nodesByKey)),
      }),
    );
  }
  return sortRowsByKey(persisted, "edgeKey");
}

function toGraphNodeInsert(node: ConcernGraphBuildNode): ConcernGraphNodeInsert {
  return {
    concernSlug: node.concernSlug,
    nodeKey: node.nodeKey,
    nodeKind: node.nodeKind,
    path: node.path ?? null,
    symbol: node.symbol ?? null,
    marker: node.marker ?? null,
    displayName: node.displayName ?? null,
    description: node.description ?? null,
    sourceKind: node.sourceKind,
    sourceRef: node.sourceRef ?? null,
    isSeed: node.isSeed,
    isKnownMissing: node.isKnownMissing,
    metadataJson: JSON.stringify(node.metadata),
  };
}

function toGraphEdgeInsert(
  edge: ConcernGraphBuildEdge,
  nodesByKey: ReadonlyMap<string, ConcernGraphNodeRow>,
): ConcernGraphEdgeInsert {
  const fromNode = nodesByKey.get(edge.fromNodeKey);
  const toNode = nodesByKey.get(edge.toNodeKey);
  if (fromNode === undefined || toNode === undefined) {
    throw new Error(`Concern graph edge references missing node: ${edge.edgeKey}`);
  }

  return {
    concernSlug: edge.concernSlug,
    edgeKey: edge.edgeKey,
    edgeKind: edge.edgeKind,
    fromNodeId: fromNode.id,
    toNodeId: toNode.id,
    sourceKind: edge.sourceKind,
    sourceRef: edge.sourceRef ?? null,
    metadataJson: JSON.stringify(edge.metadata),
  };
}

function replacementScopesFor(
  graph: ConcernGraphBuildResult,
  explicitScopes: readonly GraphReplacementScope[],
): GraphReplacementScope[] {
  const scopes = new Map<ConcernSourceKey, GraphReplacementScope>();
  for (const scope of explicitScopes) {
    scopes.set(replacementScopeKey(scope), scope);
  }
  for (const node of graph.nodes) {
    scopes.set(graphNodeSourceKey(node), { concernSlug: node.concernSlug, sourceKind: node.sourceKind });
  }
  for (const edge of graph.edges) {
    scopes.set(graphEdgeSourceKey(edge), { concernSlug: edge.concernSlug, sourceKind: edge.sourceKind });
  }

  return [...scopes.values()].sort(
    (left, right) => left.concernSlug.localeCompare(right.concernSlug) || left.sourceKind.localeCompare(right.sourceKind),
  );
}

function groupItemsByConcernSource<T>(
  items: readonly T[],
  keyFor: (item: T) => ConcernSourceKey,
): Map<ConcernSourceKey, T[]> {
  const groups = new Map<ConcernSourceKey, T[]>();
  for (const item of items) {
    const key = keyFor(item);
    appendToGroup(groups, key, item);
  }
  return groups;
}

function graphNodeSourceKey(node: ConcernGraphBuildNode): ConcernSourceKey {
  return `${node.concernSlug}\0${node.sourceKind}`;
}

function graphEdgeSourceKey(edge: ConcernGraphBuildEdge): ConcernSourceKey {
  return `${edge.concernSlug}\0${edge.sourceKind}`;
}

function replacementScopeKey(scope: GraphReplacementScope): ConcernSourceKey {
  return `${scope.concernSlug}\0${scope.sourceKind}`;
}

function appendToGroup<T>(groups: Map<ConcernSourceKey, T[]>, key: ConcernSourceKey, item: T): void {
  const existing = groups.get(key);
  if (existing === undefined) {
    groups.set(key, [item]);
    return;
  }
  existing.push(item);
}

function sortRowsByKey<T extends Record<TKey, string>, TKey extends keyof T>(rows: T[], key: TKey): T[] {
  return [...rows].sort((left, right) => left[key].localeCompare(right[key]));
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return "Unknown detector run failure.";
}

function supportsTransactions(db: RepositoryDatabase): db is Parameters<typeof withRepositoryTransaction>[0] {
  return typeof (db as { transaction?: unknown }).transaction === "function";
}

function markRunFailed(db: RepositoryDatabase, request: DetectorRunRequest, error: unknown): void {
  const failedAt = unixSecondsNow();
  const values = {
    versionId: request.versionId ?? null,
    repositoryId: request.repositoryId,
    runKind: request.runKind,
    status: "failed" as const,
    concernMapVersion: request.concernMapVersion,
    baseSha: request.baseSha ?? null,
    targetSha: request.targetSha ?? null,
    sourceRef: request.sourceRef ?? null,
    startedAt: request.startedAt ?? failedAt,
    completedAt: failedAt,
    error: errorMessage(error),
    summaryJson: JSON.stringify({ error: errorMessage(error) }),
    updatedAt: failedAt,
  };

  if (findDetectorRunById(db, request.id) === undefined) {
    createDetectorRun(db, { id: request.id, createdAt: request.createdAt ?? failedAt, ...values });
    return;
  }
  updateDetectorRun(db, request.id, values);
}
