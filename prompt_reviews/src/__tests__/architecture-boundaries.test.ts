import { describe, expect, it } from "vitest";
import { checkArchitecture, type SourceFile } from "../../scripts/check-architecture";

function violationsFor(files: SourceFile[]): string[] {
  return checkArchitecture(files).map((violation) => violation.rule);
}

describe("architecture boundary checker", () => {
  it("rejects frontend imports from DB schema", () => {
    expect(
      violationsFor([
        {
          path: "web/src/features/review-workbench/model/state.ts",
          content: 'import { commits } from "../../../../../src/db/schema";',
        },
      ]),
    ).toContain("web-no-server-internals");
  });

  it("rejects API imports from generated row schemas", () => {
    expect(
      violationsFor([
        {
          path: "src/api/reviewRoutes.ts",
          content: 'import { commitRowSchema } from "../db/rowSchemas";',
        },
      ]),
    ).toEqual(expect.arrayContaining(["boundary-no-db-shape-leak", "generated-row-schema-boundary"]));
  });

  it("rejects services that import transport frameworks", () => {
    expect(
      violationsFor([
        {
          path: "src/services/commentService.ts",
          content: 'import Fastify from "fastify";',
        },
      ]),
    ).toContain("services-no-transport-or-ui-packages");
  });

  it("rejects primary workflow references to legacy generated artifact fields", () => {
    expect(
      violationsFor([
        {
          path: "src/services/reviewService.ts",
          content: 'const payload = { reviewPath: "prompt_reviews/old.prompt-review.md" };',
        },
      ]),
    ).toContain("no-primary-legacy-review-artifacts");
  });

  it("rejects new architecture imports from prototype modules", () => {
    expect(
      violationsFor([
        {
          path: "src/services/commentService.ts",
          content: 'import { CommentStore } from "../store";',
        },
      ]),
    ).toContain("prototype-module-quarantine");
  });

  it("rejects shared domain imports from server-only modules", () => {
    expect(
      violationsFor([
        {
          path: "src/domain/schemas/comments.ts",
          content: 'import { CommentStore } from "../../store";',
        },
      ]),
    ).toEqual(expect.arrayContaining(["prototype-module-quarantine", "domain-browser-safe-boundary"]));
  });

  it("rejects shared domain imports from Node built-ins", () => {
    expect(
      violationsFor([
        {
          path: "src/domain/jsonSchemas.ts",
          content: 'import { writeFile } from "node:fs/promises";',
        },
      ]),
    ).toContain("domain-browser-safe-boundary");
  });

  it("rejects oversized source files", () => {
    expect(
      violationsFor([
        {
          path: "src/services/giantService.ts",
          content: Array.from({ length: 501 }, (_, index) => `const value${index} = ${index};`).join("\n"),
        },
      ]),
    ).toContain("source-file-line-limit");
  });

  it("rejects too many direct files in a flat source directory", () => {
    expect(
      violationsFor(
        Array.from({ length: 13 }, (_, index) => ({
          path: `src/services/flat/file${index}.ts`,
          content: `export const value${index} = ${index};`,
        })),
      ),
    ).toContain("flat-directory-file-limit");
  });
});
