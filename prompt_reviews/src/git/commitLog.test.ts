import { describe, expect, it } from "vitest";
import { parseGitCommitLog } from "./commitLog.js";

describe("parseGitCommitLog", () => {
  it("parses commits in the order git emits them with parent and author metadata", () => {
    const output = [
      ["a".repeat(40), "0".repeat(40), "Alice", "alice@example.test", "100", "First subject\n\nFirst body"].join("\0"),
      ["b".repeat(40), "a".repeat(40), "Bob", "bob@example.test", "200", "Second subject"].join("\0"),
    ].join("\x1e");

    expect(parseGitCommitLog(output)).toEqual([
      {
        sha: "a".repeat(40),
        parentSha: "0".repeat(40),
        subject: "First subject",
        body: "First body",
        authorName: "Alice",
        authorEmail: "alice@example.test",
        committedAt: 100,
      },
      {
        sha: "b".repeat(40),
        parentSha: "a".repeat(40),
        subject: "Second subject",
        body: null,
        authorName: "Bob",
        authorEmail: "bob@example.test",
        committedAt: 200,
      },
    ]);
  });
});
