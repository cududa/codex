import type { ConcernGraphEdgeKind } from "../../domain/enums.js";
import type { ExtractedEdgeKind } from "../extraction/types.js";

export type MappedEdge = {
  edgeKind: ConcernGraphEdgeKind;
  direction: "forward" | "reverse";
  reason: string;
};

export function mappedExpansionEdges(edgeKind: ExtractedEdgeKind): MappedEdge[] {
  switch (edgeKind) {
    case "calls":
      return [
        { edgeKind: "calls", direction: "forward", reason: "The parent graph node calls this extracted symbol." },
        { edgeKind: "called_by", direction: "reverse", reason: "This extracted symbol calls the parent graph node." },
      ];
    case "include":
      return [{ edgeKind: "include_str", direction: "forward", reason: "The parent graph node includes this source text." }];
    case "registration":
      return [{ edgeKind: "registers", direction: "forward", reason: "The parent graph node registers this extracted item." }];
    case "role_marker":
      return [{ edgeKind: "maps_role", direction: "forward", reason: "The parent graph node maps this message role marker." }];
    case "matches_variant":
    case "constructs_variant":
      return [{ edgeKind: "maps_role", direction: "forward", reason: "The parent graph node references this role-like variant." }];
    case "matches_marker":
      return [{ edgeKind: "matches_marker", direction: "forward", reason: "The parent graph node contains this monitored marker." }];
    case "implements":
      return [{ edgeKind: "configures", direction: "forward", reason: "The parent graph node implements this extracted contract." }];
    case "contains":
      return [{ edgeKind: "owns_symbol", direction: "forward", reason: "The parent graph node owns this extracted symbol." }];
  }
}
