import type {
  ConcernGraphEdgeInsert,
  ConcernGraphEdgeRow,
  ConcernGraphNodeInsert,
  ConcernGraphNodeRow,
  RepositoryDatabase,
} from "../../repositories/index.js";
import {
  findConcernGraphNodeByKey,
  upsertConcernGraphEdge,
  upsertConcernGraphNode,
} from "../../repositories/index.js";
import type { ConcernGraphBuildEdge, ConcernGraphBuildNode, ConcernGraphBuildResult } from "./types.js";

export type PersistConcernGraphExpansionResult = {
  graphNodes: ConcernGraphNodeRow[];
  graphEdges: ConcernGraphEdgeRow[];
};

export type PersistConcernGraphExpansionOptions = {
  sourceKinds?: readonly ConcernGraphBuildNode["sourceKind"][];
};

export function persistConcernGraphExpansion(
  db: RepositoryDatabase,
  graph: ConcernGraphBuildResult,
  options: PersistConcernGraphExpansionOptions = {},
): PersistConcernGraphExpansionResult {
  const sourceKinds = options.sourceKinds === undefined ? undefined : new Set(options.sourceKinds);
  const graphNodes = graph.nodes
    .filter((node) => sourceKinds === undefined || sourceKinds.has(node.sourceKind))
    .map((node) => upsertConcernGraphNode(db, toGraphNodeInsert(node)));
  const nodesByKey = new Map(graphNodes.map((node) => [node.nodeKey, node]));
  const graphEdges = graph.edges
    .filter((edge) => sourceKinds === undefined || sourceKinds.has(edge.sourceKind))
    .map((edge) => upsertConcernGraphEdge(db, toGraphEdgeInsert(db, edge, nodesByKey)));

  return {
    graphNodes: sortRowsByKey(graphNodes, "nodeKey"),
    graphEdges: sortRowsByKey(graphEdges, "edgeKey"),
  };
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
  db: RepositoryDatabase,
  edge: ConcernGraphBuildEdge,
  nodesByKey: ReadonlyMap<string, ConcernGraphNodeRow>,
): ConcernGraphEdgeInsert {
  const fromNode = nodesByKey.get(edge.fromNodeKey) ?? findConcernGraphNodeByKey(db, edge.fromNodeKey);
  const toNode = nodesByKey.get(edge.toNodeKey) ?? findConcernGraphNodeByKey(db, edge.toNodeKey);
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

function sortRowsByKey<T extends Record<TKey, string>, TKey extends keyof T>(rows: T[], key: TKey): T[] {
  return [...rows].sort((left, right) => left[key].localeCompare(right[key]));
}
