import { scanLines, scanPatterns } from "./scanner.js";
import { type GuardrailRule, type SourceFile, ruleDescriptions } from "./types.js";

export const guardrailRules: readonly GuardrailRule[] = [
  {
    id: "old-review-vocabulary",
    description: ruleDescriptions["old-review-vocabulary"],
    check: (file) =>
      scanPatterns(file, "old-review-vocabulary", [
        /\bneeds_classification\b/gi,
        /\b(primary|secondary)(Tag|Tags|Classification|Classifications)\w*/g,
        /\b(tag|tags|tagging|taggings|classification|classify)(?:\b|_|\w*[A-Z]\w*)/gi,
        /\b(decision|decisions|outcome|outcomes)(?:\b|_|\w*[A-Z]\w*)/gi,
        /\b(reviewActions?|action_(?:schema|schemas|table|tables)|Action(?:Schema|Schemas|Read|Reads|Row|Rows|Command|Commands|Response|Responses|Params|Payload))\b/g,
        /\b(finalization|finalize|finalized|readiness|readyForApproval)(?:\b|_|\w*[A-Z]\w*)/gi,
        /\breview(Status|Readiness)\w*/g,
      ]),
  },
  {
    id: "public-schemas-outside-contracts",
    description: ruleDescriptions["public-schemas-outside-contracts"],
    check: (file) => {
      if (isContractsSource(file)) {
        return [];
      }

      const namedPublicSchemas = scanPatterns(file, "public-schemas-outside-contracts", [
        /^\s*export\s+const\s+\w*(Request|Response|Command|Read|Row|Params|Payload|Tool|Resource)Schema\s*=/gm,
        /^\s*export\s+type\s+\w*(Request|Response|Command|Read|Row|Params|Payload)\b/gm,
        /^\s*export\s+interface\s+\w*(Request|Response|Command|Read|Row|Params|Payload)\b/gm,
        /^\s*(?:const|let|var)\s+\w*(Request|Response|Command|Read|Row|Params|Payload)?Schema\s*=\s*z\./gm,
      ]);
      if (!isBoundarySchemaSource(file)) {
        return namedPublicSchemas;
      }

      return [
        ...namedPublicSchemas,
        ...scanLines(file, "public-schemas-outside-contracts", (line) => /\bz\.(object|enum|union)\s*\(/.test(line)),
      ];
    },
  },
  {
    id: "mirrored-local-dtos",
    description: ruleDescriptions["mirrored-local-dtos"],
    check: (file) => {
      if (isContractsSource(file)) {
        return [];
      }

      return scanLines(file, "mirrored-local-dtos", (line) => {
        const name = localTypeName(line);
        return name !== null && mirrorsCanonicalDto(name);
      });
    },
  },
  {
    id: "reshape-into-old-structures",
    description: ruleDescriptions["reshape-into-old-structures"],
    check: (file) => [
      ...scanPatterns(file, "reshape-into-old-structures", [
        /from\s+["'][^"']*prompt_reviews[^"']*["']/g,
        /\b(prompt_reviews|PromptReviews)\b/g,
      ]),
      ...scanLines(file, "reshape-into-old-structures", (line) => {
        const lowerLine = line.toLowerCase();
        return (
          /\bConcernAreas?\b.*\b(tags?|taggings?|classifications?|primaryTag|secondaryTag|tagSlug)\b/i.test(line) ||
          /\b(tags?|taggings?|classifications?|primaryTag|secondaryTag|tagSlug)\b.*\bConcernAreas?\b/i.test(line) ||
          /\bReviewMark\w*\b.*\b(status|readiness|finalization|finalized)\w*\b/i.test(line) ||
          /\b(status|readiness|finalization|finalized)\w*\b.*\bReviewMark\w*\b/i.test(line) ||
          /\bReviewNote\w*\b.*\b(decision|decisions|reviewActions?|actions?|outcome|outcomes)\w*\b/i.test(line) ||
          /\b(decision|decisions|reviewActions?|actions?|outcome|outcomes)\w*\b.*\bReviewNote\w*\b/i.test(line) ||
          (/\b(adapter|compat|compatibility|legacy)\b/i.test(line) &&
            /\b(ConcernArea|concernAreas|ReviewMark|ReviewNote)\b/.test(line)) ||
          (lowerLine.includes(" as ") && /\b(Request|Response|Command|Read|Row|Payload)\b/.test(line))
        );
      }),
    ],
  },
  {
    id: "generated-schema-authority",
    description: ruleDescriptions["generated-schema-authority"],
    check: (file) =>
      scanPatterns(file, "generated-schema-authority", [
        /from\s+["'][^"']*(openapi|swagger|json-schema|jsonSchema|generated-schema|generatedSchemas)[^"']*["']/gi,
        /\b(readFileSync|readFile|import)\b[\s\S]{0,120}\b(openapi|swagger|json-schema|jsonSchema|generated-schema|generatedSchemas)\b/gi,
        /\b(openapi|swagger|jsonSchema|json_schema|generatedSchema|generatedSchemas)\b/gi,
      ]),
  },
  {
    id: "old-persistence-or-projection",
    description: ruleDescriptions["old-persistence-or-projection"],
    check: (file) => {
      const violations = scanPatterns(file, "old-persistence-or-projection", [
        /\bpayload_json\b/gi,
        /\b(projection|projector|materialized)\w*/gi,
        /\b(document|documents)\s*-\s*shaped\b/gi,
        /\b(repository_review_data|review_data|file_concern_areas|taggings?|classifications?|decisions?|outcomes?|version_finalizations|review_status|review_readiness)(?:\b|_|\w*[A-Z]\w*)/gi,
      ]);

      if (canWriteDatabaseDirectly(file)) {
        return violations;
      }

      return [
        ...violations,
        ...scanPatterns(file, "old-persistence-or-projection", [
          /\bdb\.(insert|update|delete|run|execute)\s*\(/g,
          /\btx\.(insert|update|delete|run|execute)\s*\(/g,
          /\b(?:client|connection\.client)\.(execute|batch)\s*\(/g,
        ]),
      ];
    },
  },
  {
    id: "mcp-bypasses-contracts",
    description: ruleDescriptions["mcp-bypasses-contracts"],
    check: (file) => {
      if (!isMcpSource(file)) {
        return [];
      }

      return scanPatterns(file, "mcp-bypasses-contracts", [
        /\bz\.object\s*\(/g,
        /\b(Command|Read|Response|Resource|Tool)Schema\s*=\s*z\./g,
        /from\s+["'][^"']*(openapi|swagger|json-schema|generated-schema)[^"']*["']/gi,
        /from\s+["'][^"']*(db\/schema|db\/client|drizzle)[^"']*["']/gi,
        /\bdb\.(insert|update|delete)\s*\(/g,
        /\b(classify|classification|tag|tagging)\b/gi,
        /\bRecordHumanApprovalCommandSchema\b/g,
        /\bGenerateReviewLedgerCommandSchema\b/g,
        /\b(recordHumanApproval|generateReviewLedger)\b/g,
      ]);
    },
  },
];

function isContractsSource(file: SourceFile): boolean {
  return file.relativePath.startsWith("packages/contracts/src/");
}

function isBoundarySchemaSource(file: SourceFile): boolean {
  return (
    file.relativePath.startsWith("apps/api/src/routes/") ||
    file.relativePath.startsWith("apps/mcp/src/") ||
    file.relativePath.startsWith("packages/mcp/src/") ||
    file.relativePath.startsWith("apps/ingest/src/") ||
    file.relativePath.startsWith("packages/ingest/src/") ||
    file.relativePath.startsWith("apps/concern-map/src/") ||
    file.relativePath.startsWith("packages/concern-map/src/") ||
    file.relativePath.startsWith("apps/web/src/shared/api/")
  );
}

function isMcpSource(file: SourceFile): boolean {
  return file.relativePath.startsWith("apps/mcp/src/") || file.relativePath.startsWith("packages/mcp/src/");
}

function canWriteDatabaseDirectly(file: SourceFile): boolean {
  return (
    file.relativePath.startsWith("apps/api/src/review/write-store.ts") ||
    file.relativePath.startsWith("apps/api/src/review/write-store.test.ts") ||
    file.relativePath.startsWith("apps/api/src/db/migrate.ts") ||
    file.relativePath.startsWith("apps/api/src/db/migrations/") ||
    /(?:^|\/)db\/.*\.test\.ts$/.test(file.relativePath)
  );
}

function localTypeName(line: string): string | null {
  const match = /^\s*(?:export\s+)?(?:type\s+([A-Za-z][A-Za-z0-9_]*)\s*[=<]|interface\s+([A-Za-z][A-Za-z0-9_]*)\b)/.exec(
    line,
  );
  return match?.[1] ?? match?.[2] ?? null;
}

function mirrorsCanonicalDto(name: string): boolean {
  const canonicalNames = new Set([
    "ReviewVersion",
    "ReviewCommit",
    "ReviewFile",
    "DiffBlock",
    "ConcernArea",
    "ReviewMark",
    "AgentReview",
    "HumanApproval",
    "LocalChangeRef",
    "ReviewEvent",
    "DetectorRun",
    "DetectorEvidence",
    "ThreadedComment",
    "ReviewNote",
    "ReviewPlan",
    "ReviewLedger",
    "LedgerEntry",
    "Bootstrap",
    "ApiError",
  ]);
  if (canonicalNames.has(name)) {
    return true;
  }

  return (
    /(?:Request|Response|Command|Read|Row|Payload)$/.test(name) ||
    /(?:ReviewVersion|ReviewCommit|ReviewFile|DiffBlock|ConcernArea|ReviewMark|AgentReview|HumanApproval|LocalChangeRef|ReviewEvent|DetectorRun|DetectorEvidence|ThreadedComment|ReviewNote|ReviewPlan|ReviewLedger|LedgerEntry|Bootstrap|ApiError)(?:View|Dto|DTO|Read|Row|Response|Request|Payload|Command|Model|Data)$/.test(
      name,
    )
  );
}
