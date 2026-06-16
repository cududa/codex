import { concernMap } from "../../domain/concernMap.js";
import type { ConcernAreaSlug } from "../../domain/schemas/concernDetector/index.js";
import { lineStartsFor, literalOccurrences, rangeForOffsets } from "./sourceText.js";
import type { SourceFileInput, TextScanHit, TextScanHitKind } from "./types.js";

type MarkerCandidate = {
  marker: string;
  hitKind: TextScanHitKind;
  concernSlug: ConcernAreaSlug;
};

type MarkerIndexEntry = {
  marker: string;
  hitKind: TextScanHitKind;
  concernSlugs: ConcernAreaSlug[];
};

const scannableExtensions = new Set([".json", ".md", ".sql", ".ts", ".tsx"]);

export function isTextScannablePath(filePath: string): boolean {
  const dotIndex = filePath.lastIndexOf(".");
  return dotIndex !== -1 && scannableExtensions.has(filePath.slice(dotIndex));
}

export function scanTextFile(source: SourceFileInput): TextScanHit[] {
  const lineStarts = lineStartsFor(source.content);
  const hits: TextScanHit[] = [];
  const seen = new Set<string>();

  for (const markerEntry of buildMarkerIndex()) {
    for (const occurrence of literalOccurrences(source.content, markerEntry.marker)) {
      if (!isDelimitedOccurrence(source.content, occurrence.start, occurrence.end, markerEntry.marker)) {
        continue;
      }
      const range = rangeForOffsets(lineStarts, occurrence.start, occurrence.end);
      const hit = {
        path: source.path,
        hitKind: markerEntry.hitKind,
        hitKey: hitKeyFor(source.path, markerEntry.hitKind, markerEntry.marker, range.startByte),
        marker: markerEntry.marker,
        concernSlugs: markerEntry.concernSlugs,
        ...range,
      };
      addHit(hits, seen, hit);
    }
  }

  if (source.path.endsWith(".sql")) {
    for (const tableHit of scanSqlTables(source, lineStarts)) {
      addHit(hits, seen, tableHit);
    }
  }

  return sortScanHits(hits);
}

export function scanTextFiles(sources: readonly SourceFileInput[]): TextScanHit[] {
  return sortScanHits(sources.flatMap(scanTextFile));
}

export function sortScanHits(hits: readonly TextScanHit[]): TextScanHit[] {
  return [...hits].sort(compareScanHits);
}

function buildMarkerIndex(): MarkerIndexEntry[] {
  const byKey = new Map<string, MarkerIndexEntry>();

  for (const entry of concernMap) {
    const candidates: MarkerCandidate[] = [
      ...entry.seedStringMarkers.map((marker) => ({
        marker,
        hitKind: classifyMarker(marker, entry.slug),
        concernSlug: entry.slug,
      })),
      ...entry.seedTemplateMarkers.map((marker) => ({
        marker,
        hitKind: "prompt_marker" as const,
        concernSlug: entry.slug,
      })),
      ...entry.seedSymbols.flatMap((symbol) => symbolCandidates(symbol, entry.slug)),
    ];

    for (const candidate of candidates) {
      const key = `${candidate.hitKind}\0${candidate.marker}`;
      const existing = byKey.get(key);
      if (existing === undefined) {
        byKey.set(key, {
          marker: candidate.marker,
          hitKind: candidate.hitKind,
          concernSlugs: [candidate.concernSlug],
        });
        continue;
      }
      if (!existing.concernSlugs.includes(candidate.concernSlug)) {
        existing.concernSlugs.push(candidate.concernSlug);
      }
    }
  }

  return [...byKey.values()]
    .map((entry) => ({
      ...entry,
      concernSlugs: [...entry.concernSlugs].sort(),
    }))
    .sort((left, right) => {
      const lengthDiff = right.marker.length - left.marker.length;
      if (lengthDiff !== 0) {
        return lengthDiff;
      }
      return compareStrings(`${left.hitKind}:${left.marker}`, `${right.hitKind}:${right.marker}`);
    });
}

function symbolCandidates(symbol: string, concernSlug: ConcernAreaSlug): MarkerCandidate[] {
  if (isRpcMethodName(symbol)) {
    return [{ marker: symbol, hitKind: "rpc_method", concernSlug }];
  }
  if (isConfigKey(symbol, concernSlug)) {
    return [{ marker: symbol, hitKind: "config_key", concernSlug }];
  }
  if (isToolName(symbol, concernSlug)) {
    return [{ marker: symbol, hitKind: "tool_name", concernSlug }];
  }
  return [];
}

function classifyMarker(marker: string, concernSlug: ConcernAreaSlug): TextScanHitKind {
  if (isHiddenContextTag(marker, concernSlug)) {
    return "hidden_context_tag";
  }
  if (isRpcMethodName(marker)) {
    return "rpc_method";
  }
  if (isConfigKey(marker, concernSlug)) {
    return "config_key";
  }
  if (isToolName(marker, concernSlug)) {
    return "tool_name";
  }
  return "prompt_marker";
}

function isHiddenContextTag(marker: string, concernSlug: ConcernAreaSlug): boolean {
  return concernSlug === "hidden-context" && (marker.startsWith("<") || marker.startsWith("# AGENTS.md "));
}

function isRpcMethodName(marker: string): boolean {
  return /^[a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)+$/.test(marker);
}

function isConfigKey(marker: string, concernSlug: ConcernAreaSlug): boolean {
  if (!/^[a-z][a-z0-9_]*$/.test(marker)) {
    return false;
  }
  return concernSlug === "permission-defaults" || marker.endsWith("_instructions") || marker.endsWith("_file");
}

function isToolName(marker: string, concernSlug: ConcernAreaSlug): boolean {
  if (!/^[a-z][a-z0-9_]*$/.test(marker)) {
    return false;
  }
  return concernSlug === "tool-affordances" || ["create_goal", "get_goal", "update_goal"].includes(marker);
}

function scanSqlTables(source: SourceFileInput, lineStarts: readonly number[]): TextScanHit[] {
  const hits: TextScanHit[] = [];
  const tablePattern = /\b(?:CREATE\s+TABLE|ALTER\s+TABLE|DROP\s+TABLE|REFERENCES)\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?["`]?([A-Za-z_][A-Za-z0-9_]*)["`]?/gi;

  for (const match of source.content.matchAll(tablePattern)) {
    const tableName = match[1];
    const index = match.index;
    if (tableName === undefined || index === undefined) {
      continue;
    }
    const start = source.content.indexOf(tableName, index);
    if (start === -1) {
      continue;
    }
    const range = rangeForOffsets(lineStarts, start, start + tableName.length);
    hits.push({
      path: source.path,
      hitKind: "migration_table",
      hitKey: hitKeyFor(source.path, "migration_table", tableName, range.startByte),
      marker: tableName,
      concernSlugs: concernSlugsForSqlTable(source.path, tableName),
      ...range,
    });
  }

  return hits;
}

function concernSlugsForSqlTable(filePath: string, tableName: string): ConcernAreaSlug[] {
  const normalized = `${filePath}/${tableName}`.toLowerCase();
  const slugs = new Set<ConcernAreaSlug>();

  if (normalized.includes("goal")) {
    slugs.add("goal-behavior");
  }
  if (normalized.includes("context") || normalized.includes("compact") || normalized.includes("rollout") || normalized.includes("history")) {
    slugs.add("context-compaction");
  }
  if (normalized.includes("permission") || normalized.includes("sandbox")) {
    slugs.add("permission-defaults");
  }
  for (const entry of concernMap) {
    if (entry.seedPaths.some((seedPath) => normalizePath(filePath).endsWith(normalizePath(seedPath.path)))) {
      slugs.add(entry.slug);
    }
  }

  return [...(slugs.size > 0 ? slugs : new Set<ConcernAreaSlug>(["context-compaction"]))].sort();
}

function isDelimitedOccurrence(content: string, start: number, end: number, marker: string): boolean {
  if (!isIdentifierLike(marker)) {
    return true;
  }
  return !isIdentifierCharacter(content[start - 1]) && !isIdentifierCharacter(content[end]);
}

function isIdentifierLike(marker: string): boolean {
  return /^[A-Za-z0-9_]+$/.test(marker);
}

function isIdentifierCharacter(char: string | undefined): boolean {
  return char !== undefined && /[A-Za-z0-9_]/.test(char);
}

function addHit(hits: TextScanHit[], seen: Set<string>, hit: TextScanHit): void {
  const duplicateKey = `${hit.path}\0${hit.hitKind}\0${hit.marker}\0${hit.startByte}\0${hit.endByte}`;
  if (seen.has(duplicateKey)) {
    return;
  }
  seen.add(duplicateKey);
  hits.push(hit);
}

function hitKeyFor(path: string, hitKind: TextScanHitKind, marker: string, startByte: number): string {
  return `text:${path}:${hitKind}:${encodeMarker(marker)}:${startByte}`;
}

function encodeMarker(marker: string): string {
  return marker.replaceAll("%", "%25").replaceAll("/", "%2F").replaceAll(" ", "%20");
}

function compareScanHits(left: TextScanHit, right: TextScanHit): number {
  return (
    compareStrings(left.path, right.path) ||
    left.startByte - right.startByte ||
    left.endByte - right.endByte ||
    compareStrings(left.hitKind, right.hitKind) ||
    compareStrings(left.marker, right.marker)
  );
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right);
}

function normalizePath(value: string): string {
  return value.replaceAll("\\", "/");
}
