import { scanPatterns } from "./scanner.js";
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

      return scanPatterns(file, "public-schemas-outside-contracts", [
        /^\s*export\s+const\s+\w*Schema\s*=/gm,
        /^\s*export\s+type\s+\w*(Request|Response|Command|Read|Row|Params|Payload)\b/gm,
        /^\s*export\s+interface\s+\w*(Request|Response|Command|Read|Row|Params|Payload)\b/gm,
        /^\s*(?:const|let|var)\s+\w*(Request|Response|Command|Read|Row|Params|Payload)?Schema\s*=\s*z\./gm,
        /^\s*(?:const|let|var|return)\s+.*\bz\.(object|enum|union)\s*\(/gm,
      ]);
    },
  },
  {
    id: "mirrored-local-dtos",
    description: ruleDescriptions["mirrored-local-dtos"],
    check: (file) => {
      if (isContractsSource(file)) {
        return [];
      }

      return scanPatterns(file, "mirrored-local-dtos", [
        /^\s*(?:export\s+)?(?:type|interface)\s+\w*(ReviewVersion|ReviewCommit|ReviewFile|DiffBlock|ConcernArea|ReviewMark|AgentReview|HumanApproval|LocalChangeRef|ReviewEvent|DetectorRun|DetectorEvidence|ThreadedComment|ReviewNote|ReviewPlan|ReviewLedger|LedgerEntry|Bootstrap|ApiError)\w*\b/gm,
        /^\s*(?:export\s+)?(?:type|interface)\s+\w*(Request|Response|Command|Read|Row|Payload)\b/gm,
      ]);
    },
  },
  {
    id: "reshape-into-old-structures",
    description: ruleDescriptions["reshape-into-old-structures"],
    check: (file) =>
      scanPatterns(file, "reshape-into-old-structures", [
        /from\s+["'][^"']*prompt_reviews[^"']*["']/g,
        /\b(prompt_reviews|PromptReviews)\b/g,
        /\bConcernAreas?\b[\s\S]{0,200}\b(tags?|taggings?|classifications?|primaryTag|secondaryTag|tagSlug)\b/gi,
        /\bReviewMark\b[\s\S]{0,200}\b(status|readiness|finalization|finalized)\b/gi,
        /\b(status|readiness|finalization|finalized)\w*[\s\S]{0,200}\bReviewMark\w*/gi,
        /\bReviewNote\b[\s\S]{0,200}\b(decision|decisions|action|actions|outcome|outcomes)\w*/gi,
        /\b(decision|decisions|action|actions|outcome|outcomes)\w*[\s\S]{0,200}\bReviewNote\w*/gi,
        /\b(adapter|compat|compatibility|legacy)\b/gi,
        /\bas\s+\w*(Request|Response|Command|Read|Row|Payload)\b/g,
      ]),
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
          /\bdb\.(insert|update|delete)\s*\(/g,
          /\btx\.(insert|update|delete)\s*\(/g,
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

function isMcpSource(file: SourceFile): boolean {
  return file.relativePath.startsWith("apps/mcp/src/") || file.relativePath.startsWith("packages/mcp/src/");
}

function canWriteDatabaseDirectly(file: SourceFile): boolean {
  return (
    file.relativePath.startsWith("apps/api/src/review/write-store.ts") ||
    file.relativePath.startsWith("apps/api/src/db/migrations/") ||
    /(?:^|\/)db\/.*\.test\.ts$/.test(file.relativePath)
  );
}
