import type { ChangeType } from "../domain/enums.js";

export type GitChangedFile = {
  oldPath: string | null;
  newPath: string | null;
  changeType: ChangeType;
  additions: number;
  deletions: number;
};

export type GitChangedFilesInput = {
  nameStatus: string;
  numstat: string;
  summary?: string;
};

type PathPair = {
  oldPath: string | null;
  newPath: string | null;
};

type LineStats = {
  additions: number;
  deletions: number;
};

export function parseGitChangedFiles(input: GitChangedFilesInput): GitChangedFile[] {
  const stats = parseNumstat(input.numstat);
  const modeChangedPaths = parseModeChangedPaths(input.summary ?? "");

  return input.nameStatus
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseNameStatusLine(line, stats, modeChangedPaths));
}

function parseNameStatusLine(line: string, stats: Map<string, LineStats>, modeChangedPaths: Set<string>): GitChangedFile {
  const [status, firstPath, secondPath] = line.split("\t");
  if (status === undefined || firstPath === undefined) {
    throw new Error(`Invalid git name-status line: ${line}`);
  }

  const changeType = changeTypeFromStatus(status);
  const pathPair = pathsFromStatus(changeType, firstPath, secondPath);
  const normalizedChangeType =
    changeType === "modified" && pathPair.newPath !== null && modeChangedPaths.has(pathPair.newPath)
      ? "mode_changed"
      : changeType;
  const lineStats = findStats(stats, pathPair);

  return {
    ...pathPair,
    changeType: normalizedChangeType,
    additions: lineStats.additions,
    deletions: lineStats.deletions,
  };
}

function changeTypeFromStatus(status: string): ChangeType {
  const code = status[0];
  switch (code) {
    case "A":
      return "added";
    case "M":
      return "modified";
    case "D":
      return "deleted";
    case "R":
      return "renamed";
    case "C":
      return "copied";
    case "T":
      return "mode_changed";
    default:
      throw new Error(`Unsupported git file status: ${status}`);
  }
}

function pathsFromStatus(changeType: ChangeType, firstPath: string, secondPath: string | undefined): PathPair {
  switch (changeType) {
    case "added":
      return { oldPath: null, newPath: firstPath };
    case "deleted":
      return { oldPath: firstPath, newPath: null };
    case "modified":
    case "mode_changed":
      return { oldPath: firstPath, newPath: firstPath };
    case "renamed":
    case "copied":
      if (secondPath === undefined) {
        throw new Error(`${changeType} git status is missing destination path.`);
      }
      return { oldPath: firstPath, newPath: secondPath };
  }
}

function parseNumstat(output: string): Map<string, LineStats> {
  const stats = new Map<string, LineStats>();
  for (const line of output.split(/\r?\n/)) {
    if (line.trim().length === 0) {
      continue;
    }
    const [additionsText, deletionsText, ...pathParts] = line.split("\t");
    const pathText = pathParts.join("\t");
    const pathPair = parseNumstatPath(pathText);
    stats.set(pathKey(pathPair), {
      additions: parseStat(additionsText),
      deletions: parseStat(deletionsText),
    });
  }
  return stats;
}

function parseNumstatPath(pathText: string): PathPair {
  const bracePair = parseBraceRename(pathText);
  if (bracePair !== null) {
    return bracePair;
  }

  const arrow = " => ";
  if (pathText.includes(arrow)) {
    const [oldPath, newPath] = pathText.split(arrow);
    return { oldPath: oldPath ?? null, newPath: newPath ?? null };
  }

  return { oldPath: pathText, newPath: pathText };
}

function parseBraceRename(pathText: string): PathPair | null {
  const match = /^(?<prefix>.*)\{(?<old>.+) => (?<next>.+)\}(?<suffix>.*)$/.exec(pathText);
  if (match?.groups === undefined) {
    return null;
  }

  const { prefix, old, next, suffix } = match.groups;
  return {
    oldPath: `${prefix}${old}${suffix}`,
    newPath: `${prefix}${next}${suffix}`,
  };
}

function parseStat(value: string | undefined): number {
  if (value === undefined || value === "-") {
    return 0;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseModeChangedPaths(summary: string): Set<string> {
  const paths = new Set<string>();
  for (const line of summary.split(/\r?\n/)) {
    const match = /^\s*mode change \d+ => \d+ (.+)$/.exec(line);
    if (match?.[1] !== undefined) {
      paths.add(match[1]);
    }
  }
  return paths;
}

function pathKey(pathPair: PathPair): string {
  return `${pathPair.oldPath ?? ""}\0${pathPair.newPath ?? ""}`;
}

function findStats(stats: Map<string, LineStats>, pathPair: PathPair): LineStats {
  const exact = stats.get(pathKey(pathPair));
  if (exact !== undefined) {
    return exact;
  }

  const path = pathPair.newPath ?? pathPair.oldPath;
  if (path !== null) {
    return stats.get(pathKey({ oldPath: path, newPath: path })) ?? { additions: 0, deletions: 0 };
  }

  return { additions: 0, deletions: 0 };
}
