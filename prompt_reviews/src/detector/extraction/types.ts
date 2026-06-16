import type { ConcernAreaSlug } from "../../domain/schemas/concernDetector/index.js";

export type SourceRange = {
  startByte: number;
  endByte: number;
  startLine: number;
  endLine: number;
};

export type ExtractedNodeKind =
  | "file"
  | "rust_item"
  | "rust_impl"
  | "rust_trait_impl"
  | "rust_function"
  | "rust_enum_variant"
  | "rust_call_path"
  | "rust_variant_reference"
  | "rust_string_marker"
  | "rust_include_target"
  | "rust_registration_array"
  | "rust_registration_item"
  | "text_marker"
  | "tool_name"
  | "rpc_method"
  | "config_key"
  | "migration_table"
  | "hidden_context_tag";

export type ExtractedEdgeKind =
  | "contains"
  | "calls"
  | "implements"
  | "registration"
  | "include"
  | "role_marker"
  | "matches_variant"
  | "constructs_variant"
  | "matches_marker";

export type ExtractedNode = SourceRange & {
  path: string;
  nodeKind: ExtractedNodeKind;
  nodeKey: string;
  symbol?: string;
  marker?: string;
};

export type ExtractedEdge = SourceRange & {
  path: string;
  edgeKind: ExtractedEdgeKind;
  edgeKey: string;
  fromNodeKey: string;
  toNodeKey: string;
  symbol?: string;
  marker?: string;
};

export type TextScanHitKind =
  | "prompt_marker"
  | "tool_name"
  | "rpc_method"
  | "config_key"
  | "migration_table"
  | "hidden_context_tag";

export type TextScanHit = SourceRange & {
  path: string;
  hitKind: TextScanHitKind;
  hitKey: string;
  marker: string;
  concernSlugs: ConcernAreaSlug[];
};

export type ExtractionOutput = {
  nodes: ExtractedNode[];
  edges: ExtractedEdge[];
  scanHits: TextScanHit[];
};

export type SourceFileInput = {
  path: string;
  content: string;
};
