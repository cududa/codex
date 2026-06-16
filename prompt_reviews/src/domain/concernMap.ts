import { goalAndCompactionConcernEntries } from "./concernMapData/goalContextEntries.js";
import { promptAndContextConcernEntries } from "./concernMapData/promptContextEntries.js";
import { toolAndPermissionConcernEntries } from "./concernMapData/toolPermissionEntries.js";

export const concernMapVersion = 1;

export const concernAreaSlugs = [
  "harness-prompts",
  "message-roles",
  "hidden-context",
  "goal-continuation",
  "goal-behavior",
  "context-compaction",
  "tool-affordances",
  "permission-defaults",
] as const;

export const concernMap = [
  ...promptAndContextConcernEntries,
  ...goalAndCompactionConcernEntries,
  ...toolAndPermissionConcernEntries,
] as const;

export const concernMapBySlug = new Map(concernMap.map((entry) => [entry.slug, entry]));
