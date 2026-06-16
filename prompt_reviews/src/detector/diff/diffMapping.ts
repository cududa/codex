export type DiffMappingSide = "old" | "new";
export type DiffMappingKind = "changed_lines" | "path_only";

export type DiffBlockMappingInput = {
  id: string;
  commitFileId: string;
  ordinal?: number | null;
  oldStartLine?: number | null;
  oldEndLine?: number | null;
  newStartLine?: number | null;
  newEndLine?: number | null;
  patch: string;
};

export type CommitFileDiffMappingInput = {
  id: string;
  oldPath?: string | null;
  newPath?: string | null;
  diffBlocks: readonly DiffBlockMappingInput[];
};

export type SourceRangeMappingInput = {
  path: string;
  startLine: number;
  endLine: number;
};

export type DiffLineMapping = {
  mappingKey: string;
  mappingKind: DiffMappingKind;
  commitFileId: string;
  diffBlockId: string | null;
  diffBlockOrdinal: number | null;
  path: string | null;
  side: DiffMappingSide | null;
  startLine: number | null;
  endLine: number | null;
  oldStartLine: number | null;
  oldEndLine: number | null;
  newStartLine: number | null;
  newEndLine: number | null;
  reason: string;
};

type ParsedLineRun = {
  side: DiffMappingSide;
  startLine: number;
  endLine: number;
};

export type ChangedLineRun = ParsedLineRun;

type HunkCursor = {
  oldLine: number;
  newLine: number;
};

const sideOrder: Record<DiffMappingSide, number> = {
  old: 0,
  new: 1,
};

export function mapCommitFileDiff(file: CommitFileDiffMappingInput): DiffLineMapping[] {
  const mappings = sortedDiffBlocks(file.diffBlocks).flatMap((block) => mapDiffBlock(file, block));
  return sortMappings(mappings);
}

export function mapSourceRangeToDiff(
  file: CommitFileDiffMappingInput,
  sourceRange: SourceRangeMappingInput,
): DiffLineMapping[] {
  const changedMappings = mapCommitFileDiff(file).filter((mapping) => mapping.mappingKind === "changed_lines");
  const overlaps = changedMappings
    .filter((mapping) => mapping.path === sourceRange.path && mapping.side !== null)
    .flatMap((mapping) => intersectMapping(mapping, sourceRange));

  if (overlaps.length > 0) {
    return sortMappings(overlaps);
  }

  if (!pathMatchesFile(file, sourceRange.path)) {
    return [];
  }

  return [pathOnlyFileMapping(file, "path_matches_without_changed_line_overlap")];
}

export function extractChangedLineRuns(patch: string): ChangedLineRun[] {
  return runsFromPatch(patch);
}

function mapDiffBlock(file: CommitFileDiffMappingInput, block: DiffBlockMappingInput): DiffLineMapping[] {
  const runs = runsFromPatch(block.patch);
  if (runs.length === 0) {
    return [pathOnlyBlockMapping(file, block, pathOnlyBlockReason(block))];
  }

  return runs.map((run) => lineRunToBlockMapping(file, block, run));
}

function runsFromPatch(patch: string): ParsedLineRun[] {
  const runs: ParsedLineRun[] = [];
  let cursor: HunkCursor | null = null;

  for (const line of patch.split(/\r?\n/)) {
    const hunk = parseHunkHeader(line);
    if (hunk !== null) {
      cursor = hunk;
      continue;
    }
    if (cursor === null || line.startsWith("\\")) {
      continue;
    }

    if (isDeletionLine(line)) {
      appendRun(runs, "old", cursor.oldLine);
      cursor.oldLine += 1;
      continue;
    }
    if (isAdditionLine(line)) {
      appendRun(runs, "new", cursor.newLine);
      cursor.newLine += 1;
      continue;
    }
    if (isContextLine(line)) {
      cursor.oldLine += 1;
      cursor.newLine += 1;
    }
  }

  return runs;
}

function parseHunkHeader(line: string): HunkCursor | null {
  const match = /^@@ -(?<oldStart>\d+)(?:,(?<oldCount>\d+))? \+(?<newStart>\d+)(?:,(?<newCount>\d+))? @@/.exec(line);
  if (match?.groups === undefined) {
    return null;
  }
  return {
    oldLine: Number.parseInt(match.groups.oldStart, 10),
    newLine: Number.parseInt(match.groups.newStart, 10),
  };
}

function isDeletionLine(line: string): boolean {
  return line.startsWith("-") && !line.startsWith("---");
}

function isAdditionLine(line: string): boolean {
  return line.startsWith("+") && !line.startsWith("+++");
}

function isContextLine(line: string): boolean {
  return line.startsWith(" ");
}

function appendRun(runs: ParsedLineRun[], side: DiffMappingSide, line: number): void {
  const last = runs.at(-1);
  if (last?.side === side && last.endLine + 1 === line) {
    last.endLine = line;
    return;
  }
  runs.push({ side, startLine: line, endLine: line });
}

function lineRunToBlockMapping(
  file: CommitFileDiffMappingInput,
  block: DiffBlockMappingInput,
  run: ParsedLineRun,
): DiffLineMapping {
  const sideRange = sideRangeFields(run.side, run.startLine, run.endLine);
  return {
    mappingKey: mappingKey(file.id, block.id, "changed_lines", run.side, run.startLine, run.endLine),
    mappingKind: "changed_lines",
    commitFileId: file.id,
    diffBlockId: block.id,
    diffBlockOrdinal: block.ordinal ?? null,
    path: pathForSide(file, run.side),
    side: run.side,
    startLine: run.startLine,
    endLine: run.endLine,
    ...sideRange,
    reason: "changed_line_range_from_unified_diff_hunk",
  };
}

function pathOnlyBlockMapping(
  file: CommitFileDiffMappingInput,
  block: DiffBlockMappingInput,
  reason: string,
): DiffLineMapping {
  return {
    mappingKey: mappingKey(file.id, block.id, "path_only", null, null, null),
    mappingKind: "path_only",
    commitFileId: file.id,
    diffBlockId: block.id,
    diffBlockOrdinal: block.ordinal ?? null,
    path: preferredPath(file),
    side: null,
    startLine: null,
    endLine: null,
    oldStartLine: null,
    oldEndLine: null,
    newStartLine: null,
    newEndLine: null,
    reason,
  };
}

function pathOnlyFileMapping(file: CommitFileDiffMappingInput, reason: string): DiffLineMapping {
  return {
    mappingKey: mappingKey(file.id, null, "path_only", null, null, null),
    mappingKind: "path_only",
    commitFileId: file.id,
    diffBlockId: null,
    diffBlockOrdinal: null,
    path: preferredPath(file),
    side: null,
    startLine: null,
    endLine: null,
    oldStartLine: null,
    oldEndLine: null,
    newStartLine: null,
    newEndLine: null,
    reason,
  };
}

function pathOnlyBlockReason(block: DiffBlockMappingInput): string {
  return hasAnyHunkRange(block) ? "hunk_has_no_changed_line_ranges" : "diff_block_has_no_hunk_range";
}

function hasAnyHunkRange(block: DiffBlockMappingInput): boolean {
  return (
    block.oldStartLine !== null && block.oldStartLine !== undefined ||
    block.oldEndLine !== null && block.oldEndLine !== undefined ||
    block.newStartLine !== null && block.newStartLine !== undefined ||
    block.newEndLine !== null && block.newEndLine !== undefined
  );
}

function sideRangeFields(
  side: DiffMappingSide,
  startLine: number,
  endLine: number,
): Pick<DiffLineMapping, "oldStartLine" | "oldEndLine" | "newStartLine" | "newEndLine"> {
  return side === "old"
    ? { oldStartLine: startLine, oldEndLine: endLine, newStartLine: null, newEndLine: null }
    : { oldStartLine: null, oldEndLine: null, newStartLine: startLine, newEndLine: endLine };
}

function intersectMapping(mapping: DiffLineMapping, sourceRange: SourceRangeMappingInput): DiffLineMapping[] {
  if (mapping.startLine === null || mapping.endLine === null || mapping.side === null) {
    return [];
  }

  const startLine = Math.max(mapping.startLine, sourceRange.startLine);
  const endLine = Math.min(mapping.endLine, sourceRange.endLine);
  if (startLine > endLine) {
    return [];
  }

  return [
    {
      ...mapping,
      mappingKey: mappingKey(mapping.commitFileId, mapping.diffBlockId, "changed_lines", mapping.side, startLine, endLine),
      startLine,
      endLine,
      ...sideRangeFields(mapping.side, startLine, endLine),
      reason: "changed_line_range_overlaps_source_range",
    },
  ];
}

function pathForSide(file: CommitFileDiffMappingInput, side: DiffMappingSide): string | null {
  return side === "old" ? file.oldPath ?? null : file.newPath ?? null;
}

function preferredPath(file: CommitFileDiffMappingInput): string | null {
  return file.newPath ?? file.oldPath ?? null;
}

function pathMatchesFile(file: CommitFileDiffMappingInput, path: string): boolean {
  return file.oldPath === path || file.newPath === path;
}

function sortedDiffBlocks(blocks: readonly DiffBlockMappingInput[]): DiffBlockMappingInput[] {
  return [...blocks].sort((left, right) => (left.ordinal ?? 0) - (right.ordinal ?? 0) || left.id.localeCompare(right.id));
}

function sortMappings(mappings: readonly DiffLineMapping[]): DiffLineMapping[] {
  return [...mappings].sort((left, right) => {
    return (
      left.commitFileId.localeCompare(right.commitFileId) ||
      nullableNumber(left.diffBlockOrdinal) - nullableNumber(right.diffBlockOrdinal) ||
      nullableString(left.diffBlockId).localeCompare(nullableString(right.diffBlockId)) ||
      nullableString(left.path).localeCompare(nullableString(right.path)) ||
      nullableSide(left.side) - nullableSide(right.side) ||
      nullableNumber(left.startLine) - nullableNumber(right.startLine) ||
      nullableNumber(left.endLine) - nullableNumber(right.endLine) ||
      left.mappingKey.localeCompare(right.mappingKey)
    );
  });
}

function mappingKey(
  commitFileId: string,
  diffBlockId: string | null,
  kind: DiffMappingKind,
  side: DiffMappingSide | null,
  startLine: number | null,
  endLine: number | null,
): string {
  const blockPart = diffBlockId ?? "file";
  const sidePart = side ?? "path";
  const rangePart = startLine === null || endLine === null ? "path" : `${startLine}-${endLine}`;
  return `${commitFileId}:${blockPart}:${kind}:${sidePart}:${rangePart}`;
}

function nullableString(value: string | null): string {
  return value ?? "";
}

function nullableNumber(value: number | null | undefined): number {
  return value ?? -1;
}

function nullableSide(value: DiffMappingSide | null): number {
  return value === null ? 2 : sideOrder[value];
}
