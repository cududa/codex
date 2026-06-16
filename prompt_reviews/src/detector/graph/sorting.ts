import type { ConcernGraphBuildEdge, ConcernGraphBuildNode } from "./types.js";

export function sortGraphNodes(nodes: readonly ConcernGraphBuildNode[]): ConcernGraphBuildNode[] {
  return [...nodes].sort(compareGraphNodes);
}

export function sortGraphEdges(edges: readonly ConcernGraphBuildEdge[]): ConcernGraphBuildEdge[] {
  return [...edges].sort(compareGraphEdges);
}

function compareGraphNodes(left: ConcernGraphBuildNode, right: ConcernGraphBuildNode): number {
  return (
    left.concernSlug.localeCompare(right.concernSlug) ||
    left.nodeKind.localeCompare(right.nodeKind) ||
    left.nodeKey.localeCompare(right.nodeKey)
  );
}

function compareGraphEdges(left: ConcernGraphBuildEdge, right: ConcernGraphBuildEdge): number {
  return (
    left.concernSlug.localeCompare(right.concernSlug) ||
    left.edgeKind.localeCompare(right.edgeKind) ||
    left.edgeKey.localeCompare(right.edgeKey)
  );
}

