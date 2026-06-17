import { describe, expect, it } from "vitest";
import { buildMonacoDiffBlockModel, lineNumberForModelLine, textForAbsoluteLine } from "./diffBlockModels";

describe("buildMonacoDiffBlockModel", () => {
  it("builds original and modified snippets with absolute line mappings", () => {
    const model = buildMonacoDiffBlockModel({
      id: "blk_1",
      commitFileId: "file_1",
      heading: "Example",
      oldStartLine: 10,
      oldEndLine: 12,
      newStartLine: 10,
      newEndLine: 13,
      patch: "@@ -10,3 +10,4 @@\n keep\n-old\n+new\n+extra\n tail",
      taggings: [],
      comments: [],
      decision: undefined,
      detectorFindings: [],
    });

    expect(model.originalText).toBe("keep\nold\ntail");
    expect(model.modifiedText).toBe("keep\nnew\nextra\ntail");
    expect(lineNumberForModelLine(model, "old", 2)).toBe(11);
    expect(lineNumberForModelLine(model, "new", 3)).toBe(12);
    expect(textForAbsoluteLine(model, "new", 12)).toBe("extra");
  });

  it("ignores no-newline metadata", () => {
    const model = buildMonacoDiffBlockModel({
      id: "blk_2",
      commitFileId: "file_2",
      oldStartLine: 1,
      oldEndLine: 1,
      newStartLine: 1,
      newEndLine: 1,
      patch: "@@ -1 +1 @@\n-old\n+new\n\\ No newline at end of file",
      taggings: [],
      comments: [],
      decision: undefined,
      detectorFindings: [],
    });

    expect(model.originalText).toBe("old");
    expect(model.modifiedText).toBe("new");
  });

  it("falls back for stored hunks with mismatched line counts", () => {
    const model = buildMonacoDiffBlockModel({
      id: "blk_3",
      commitFileId: "file_3",
      oldStartLine: 5,
      oldEndLine: 7,
      newStartLine: 5,
      newEndLine: 8,
      patch: "@@ -5,3 +5,4 @@\n-old\n+new",
      taggings: [],
      comments: [],
      decision: undefined,
      detectorFindings: [],
    });

    expect(model.originalText).toBe("old");
    expect(model.modifiedText).toBe("new");
    expect(lineNumberForModelLine(model, "old", 1)).toBe(5);
    expect(lineNumberForModelLine(model, "new", 1)).toBe(5);
  });
});
