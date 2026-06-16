export type ParsedDiffFile = {
  oldPath: string | null;
  newPath: string | null;
  patch: string;
  hunks: ParsedDiffHunk[];
};

export type ParsedDiffHunk = {
  heading: string | null;
  oldStartLine: number | null;
  oldEndLine: number | null;
  newStartLine: number | null;
  newEndLine: number | null;
  patch: string;
};

export function parseGitDiff(diff: string): ParsedDiffFile[] {
  return splitDiffSections(diff).map(parseDiffSection);
}

function splitDiffSections(diff: string): string[] {
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of diff.split(/\r?\n/)) {
    if (line.startsWith("diff --git ") && current.length > 0) {
      sections.push(current.join("\n").trimEnd());
      current = [];
    }
    if (line.length > 0 || current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    sections.push(current.join("\n").trimEnd());
  }

  return sections.filter((section) => section.length > 0);
}

function parseDiffSection(section: string): ParsedDiffFile {
  const lines = section.split(/\n/);
  const headerPaths = parseDiffGitHeader(lines[0] ?? "");
  let oldPath = headerPaths.oldPath;
  let newPath = headerPaths.newPath;

  for (const line of lines) {
    if (line.startsWith("--- ")) {
      oldPath = parsePatchPath(line.slice(4));
    } else if (line.startsWith("+++ ")) {
      newPath = parsePatchPath(line.slice(4));
    }
  }

  return {
    oldPath,
    newPath,
    patch: section,
    hunks: parseHunks(lines),
  };
}

function parseDiffGitHeader(header: string): { oldPath: string | null; newPath: string | null } {
  const match = /^diff --git a\/(.+) b\/(.+)$/.exec(header);
  if (match === null) {
    return { oldPath: null, newPath: null };
  }
  return { oldPath: match[1] ?? null, newPath: match[2] ?? null };
}

function parsePatchPath(value: string): string | null {
  if (value === "/dev/null") {
    return null;
  }
  if (value.startsWith("a/") || value.startsWith("b/")) {
    return value.slice(2);
  }
  return value;
}

function parseHunks(lines: string[]): ParsedDiffHunk[] {
  const hunks: ParsedDiffHunk[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (line.startsWith("@@ ")) {
      if (current.length > 0) {
        hunks.push(parseHunk(current));
      }
      current = [line];
    } else if (current.length > 0) {
      current.push(line);
    }
  }

  if (current.length > 0) {
    hunks.push(parseHunk(current));
  }

  return hunks;
}

function parseHunk(lines: string[]): ParsedDiffHunk {
  const header = lines[0] ?? "";
  const match = /^@@ -(?<oldStart>\d+)(?:,(?<oldCount>\d+))? \+(?<newStart>\d+)(?:,(?<newCount>\d+))? @@(?: (?<heading>.*))?$/.exec(
    header,
  );
  if (match?.groups === undefined) {
    throw new Error(`Invalid git diff hunk header: ${header}`);
  }

  const oldStart = Number.parseInt(match.groups.oldStart, 10);
  const oldCount = parseCount(match.groups.oldCount);
  const newStart = Number.parseInt(match.groups.newStart, 10);
  const newCount = parseCount(match.groups.newCount);

  return {
    heading: match.groups.heading?.trim() || null,
    oldStartLine: oldCount > 0 ? oldStart : null,
    oldEndLine: oldCount > 0 ? oldStart + oldCount - 1 : null,
    newStartLine: newCount > 0 ? newStart : null,
    newEndLine: newCount > 0 ? newStart + newCount - 1 : null,
    patch: lines.join("\n").trimEnd(),
  };
}

function parseCount(value: string | undefined): number {
  return value === undefined ? 1 : Number.parseInt(value, 10);
}
