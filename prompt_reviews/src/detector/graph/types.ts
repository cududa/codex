import type {
  ConcernAreaSlug,
} from "../../domain/schemas/concernDetector/index.js";
import type { ConcernGraphEdgeKind, ConcernGraphNodeKind, ConcernGraphSourceKind } from "../../domain/enums.js";
import type { ExtractionOutput } from "../extraction/types.js";

export type GraphSourceContext = {
  detectorVersion?: number;
  sourceRef?: string;
  sourceRunId?: string;
};

export type BuildConcernGraphOptions = GraphSourceContext & {
  maxExpansionDepth?: number;
};

export type BuildConcernGraphInput = BuildConcernGraphOptions & {
  extraction?: ExtractionOutput;
};

export type ConcernGraphBuildNode = {
  concernSlug: ConcernAreaSlug;
  nodeKey: string;
  nodeKind: ConcernGraphNodeKind;
  path?: string;
  symbol?: string;
  marker?: string;
  displayName?: string;
  description?: string;
  sourceKind: ConcernGraphSourceKind;
  sourceRef?: string;
  isSeed: boolean;
  isKnownMissing: boolean;
  metadata: Record<string, unknown>;
};

export type ConcernGraphBuildEdge = {
  concernSlug: ConcernAreaSlug;
  edgeKey: string;
  edgeKind: ConcernGraphEdgeKind;
  fromNodeKey: string;
  toNodeKey: string;
  sourceKind: ConcernGraphSourceKind;
  sourceRef?: string;
  metadata: Record<string, unknown>;
};

export type ConcernGraphBuildResult = {
  nodes: ConcernGraphBuildNode[];
  edges: ConcernGraphBuildEdge[];
};
