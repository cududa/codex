import { describe, expect, it } from "vitest";
import {
  checkArchitecture,
  formatViolations,
  loadProjectSourceFiles,
} from "../../scripts/check-architecture";

describe("current project architecture", () => {
  it("keeps public contracts away from persistence row schemas and prototype modules", async () => {
    const files = await loadProjectSourceFiles(process.cwd());
    const violations = checkArchitecture(files);

    expect(formatViolations(violations)).toBe("");
  });
});
