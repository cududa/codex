import type { DetectorFindingInsert } from "../../repositories/detectorRepository.js";
import type { CommitFileDiffMappingInput } from "../diff/diffMapping.js";
import type { ConcernGraphBuildResult } from "../graph/index.js";

export type DetectorCommitInput = {
  commitId: string;
  versionId?: string | null;
  files: DetectorCommitFileInput[];
};

export type DetectorCommitFileInput = Omit<CommitFileDiffMappingInput, "id"> & {
  commitFileId: string;
};

export type BuildDetectorFindingsInput = {
  runId: string;
  graph: ConcernGraphBuildResult;
  commits: DetectorCommitInput[];
};

export type BuiltDetectorFinding = DetectorFindingInsert;
