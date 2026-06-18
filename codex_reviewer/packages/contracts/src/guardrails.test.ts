import { describe, expect, it } from "vitest";
import { formatViolations, readActiveSourceFiles, runGuardrails, sourceFile } from "./guardrails/scanner.js";
import type { GuardrailRuleId, GuardrailViolation } from "./guardrails/types.js";

describe("Stage 8 rewrite guardrails", () => {
  it("reports rule id, path, and snippet for every scan violation", () => {
    const file = sourceFile("apps/api/src/routes/bad.ts", 'export const BadRequestSchema = z.object({ tag: z.string() });');

    const violations = runGuardrails([file]);

    expect(violations.length).toBeGreaterThan(0);
    expect(violations.every((violation) => violation.ruleId.length > 0)).toBe(true);
    expect(violations.every((violation) => violation.filePath === file.relativePath)).toBe(true);
    expect(violations.every((violation) => violation.snippet.length > 0)).toBe(true);
  });

  it("fails prompt_reviews imports", () => {
    const violations = runGuardrails([
      sourceFile("apps/api/src/importer.ts", 'import { legacyThing } from "../../../prompt_reviews/web/src/thing";'),
    ]);

    expect(violations).toContainViolation("reshape-into-old-structures", "prompt_reviews");
  });

  it("fails old review vocabulary in active app, API, MCP, ingest, and detector code", () => {
    const violations = runGuardrails([
      sourceFile("apps/web/src/card.tsx", "const primaryTagSlug = commit.primaryTagSlug;"),
      sourceFile("apps/api/src/review.ts", 'const value = "needs_classification";'),
      sourceFile("apps/mcp/src/tools.ts", 'server.tool("classify_commit", {});'),
      sourceFile("packages/ingest/src/github.ts", "const taggings = upstream.taggings;"),
      sourceFile("packages/concern-map/src/detector.ts", "const outcome = detector.outcome;"),
      sourceFile("apps/web/src/panel.tsx", "const reviewActions = oldReview.actions;"),
    ]);

    expect(violations).toContainViolation("old-review-vocabulary", "primaryTagSlug");
    expect(violations).toContainViolation("old-review-vocabulary", "needs_classification");
    expect(violations).toContainViolation("old-review-vocabulary", "classify");
    expect(violations).toContainViolation("old-review-vocabulary", "taggings");
    expect(violations).toContainViolation("old-review-vocabulary", "outcome");
    expect(violations).toContainViolation("old-review-vocabulary", "reviewActions");
  });

  it("fails public schemas outside contracts", () => {
    const violations = runGuardrails([
      sourceFile("apps/api/src/routes/review.ts", "export const SetMarkRequestSchema = z.object({ reviewMark: z.string() });"),
      sourceFile("apps/web/src/shared/api/client.ts", "const ReviewResponseSchema = z.object({ id: z.string() });"),
      sourceFile("apps/api/src/routes/local.ts", "const body = z.object({ commitId: z.string() });"),
    ]);

    expect(violations).toContainViolation("public-schemas-outside-contracts", "SetMarkRequestSchema");
    expect(violations).toContainViolation("public-schemas-outside-contracts", "ReviewResponseSchema");
    expect(violations).toContainViolation("public-schemas-outside-contracts", "z.object");
  });

  it("allows public schemas inside contracts", () => {
    const violations = runGuardrails([
      sourceFile("packages/contracts/src/review/example.ts", "export const SetMarkCommandSchema = z.object({ reviewMark: z.string() });"),
    ]);

    expect(violations).not.toContainViolation("public-schemas-outside-contracts", "SetMarkCommandSchema");
  });

  it("fails local mirrored DTOs outside contracts", () => {
    const violations = runGuardrails([
      sourceFile("apps/web/src/model/review.ts", "type ReviewCommitView = { id: string; reviewMark: ReviewMark; concernAreas: string[] };"),
      sourceFile("apps/api/src/routes/types.ts", "interface ReviewLedgerResponse { id: string; entries: unknown[] }"),
    ]);

    expect(violations).toContainViolation("mirrored-local-dtos", "ReviewCommitView");
    expect(violations).toContainViolation("mirrored-local-dtos", "ReviewLedgerResponse");
  });

  it("fails canonical-to-old adapter and reshape code", () => {
    const violations = runGuardrails([
      sourceFile("apps/web/src/compat.ts", "function adaptConcernAreasToTags(concernAreas: ConcernArea[]) { return { tags: concernAreas }; }"),
      sourceFile("apps/api/src/status.ts", "const finalizationStatus = ReviewMarkSchema.parse(input.reviewMark);"),
      sourceFile("apps/api/src/notes.ts", "const decision = ReviewNoteSchema.parse(input);"),
    ]);

    expect(violations).toContainViolation("reshape-into-old-structures", "adaptConcernAreasToTags");
    expect(violations).toContainViolation("reshape-into-old-structures", "finalizationStatus");
    expect(violations).toContainViolation("reshape-into-old-structures", "decision");
  });

  it("fails generated schema authority", () => {
    const violations = runGuardrails([
      sourceFile("apps/api/src/openapi.ts", 'import schema from "./generated/openapi.json";'),
      sourceFile("apps/mcp/src/schema.ts", 'const raw = readFileSync("generated-schema.json", "utf8");'),
      sourceFile("apps/web/src/schema-types.ts", 'import type { paths } from "./generated/swagger-types";'),
    ]);

    expect(violations).toContainViolation("generated-schema-authority", "openapi");
    expect(violations).toContainViolation("generated-schema-authority", "generated-schema");
    expect(violations).toContainViolation("generated-schema-authority", "swagger-types");
  });

  it("fails old persistence and projection concepts", () => {
    const violations = runGuardrails([
      sourceFile("apps/api/src/db/schema/old.ts", 'const payload_json = text("payload_json");'),
      sourceFile("apps/api/src/projector.ts", "function materializedDocumentProjector() { return {}; }"),
      sourceFile("apps/api/src/db/schema/decision.ts", 'sqliteTable("decision_outcomes", {});'),
    ]);

    expect(violations).toContainViolation("old-persistence-or-projection", "payload_json");
    expect(violations).toContainViolation("old-persistence-or-projection", "materializedDocumentProjector");
    expect(violations).toContainViolation("old-persistence-or-projection", "decision_outcomes");
  });

  it("fails direct DB writes outside centralized persistence, migrations, and DB tests", () => {
    const violations = runGuardrails([
      sourceFile("apps/api/src/routes/review.ts", "await db.insert(reviewCommits).values(input);"),
      sourceFile("apps/api/src/routes/raw.ts", 'await connection.client.execute("INSERT INTO review_commits VALUES (?)");'),
      sourceFile("apps/api/src/review/write-store.ts", "await tx.insert(reviewCommits).values(row);"),
      sourceFile("apps/api/src/db/migrations/0001-core.ts", "await db.insert(reviewVersions).values(row);"),
      sourceFile("apps/api/src/db/schema.test.ts", "await connection.db.insert(reviewVersions).values(row);"),
    ]);

    expect(violations).toContainViolation("old-persistence-or-projection", "db.insert");
    expect(violations).toContainViolation("old-persistence-or-projection", "connection.client.execute");
    expect(violations).not.toContainViolation("old-persistence-or-projection", "tx.insert");
  });

  it("fails MCP bypasses when MCP source exists", () => {
    const violations = runGuardrails([
      sourceFile(
        "apps/mcp/src/tools.ts",
        [
          "const SetMarkToolSchema = z.object({ mark: z.string() });",
          'import { db } from "../db/client";',
          "await db.update(reviewCommits).set({ reviewMark: mark });",
          "const approve = RecordHumanApprovalCommandSchema.parse(input);",
          "const ReviewResourceSchema = z.object({ commitId: z.string() });",
        ].join("\n"),
      ),
    ]);

    expect(violations).toContainViolation("mcp-bypasses-contracts", "SetMarkToolSchema");
    expect(violations).toContainViolation("mcp-bypasses-contracts", "db.update");
    expect(violations).toContainViolation("mcp-bypasses-contracts", "RecordHumanApprovalCommandSchema");
    expect(violations).toContainViolation("mcp-bypasses-contracts", "ReviewResourceSchema");
  });

  it("has zero active-code guardrail violations", () => {
    const violations = runGuardrails(readActiveSourceFiles());

    expect(formatViolations(violations)).toBe("");
  });
});

expect.extend({
  toContainViolation(
    received: readonly GuardrailViolation[],
    ruleId: GuardrailRuleId,
    expectedSnippetPart: string,
  ) {
    const pass = received.some(
      (violation) => violation.ruleId === ruleId && violation.snippet.includes(expectedSnippetPart),
    );

    return {
      pass,
      message: () =>
        `expected violations ${pass ? "not " : ""}to contain ${ruleId} with snippet containing ${JSON.stringify(
          expectedSnippetPart,
        )}\n\n${formatViolations(received)}`,
    };
  },
});

interface CustomMatchers<R = unknown> {
  toContainViolation(ruleId: GuardrailRuleId, expectedSnippetPart: string): R;
}

declare module "vitest" {
  interface Assertion<T = unknown> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
