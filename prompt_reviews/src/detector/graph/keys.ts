import type { ConcernGraphEdgeKind, ConcernGraphNodeKind } from "../../domain/enums.js";
import type { ConcernAreaSlug } from "../../domain/schemas/concernDetector/index.js";

export function concernNodeKey(
  concernSlug: ConcernAreaSlug,
  nodeKind: ConcernGraphNodeKind,
  identity: string,
): string {
  return ["concern", concernSlug, nodeKind, encodeKeyPart(identity)].join(":");
}

export function extractionGraphNodeKey(concernSlug: ConcernAreaSlug, extractionNodeKey: string): string {
  return ["concern", concernSlug, "extracted", encodeKeyPart(extractionNodeKey)].join(":");
}

export function scanHitGraphNodeKey(concernSlug: ConcernAreaSlug, hitKey: string): string {
  return ["concern", concernSlug, "scan", encodeKeyPart(hitKey)].join(":");
}

export function concernEdgeKey(
  concernSlug: ConcernAreaSlug,
  edgeKind: ConcernGraphEdgeKind,
  fromNodeKey: string,
  toNodeKey: string,
): string {
  return ["concern-edge", concernSlug, edgeKind, encodeKeyPart(fromNodeKey), encodeKeyPart(toNodeKey)].join(":");
}

function encodeKeyPart(value: string): string {
  return encodeURIComponent(value).replaceAll(":", "%3A");
}
