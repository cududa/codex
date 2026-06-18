export type GuardrailRuleId =
  | "old-review-vocabulary"
  | "public-schemas-outside-contracts"
  | "mirrored-local-dtos"
  | "reshape-into-old-structures"
  | "generated-schema-authority"
  | "old-persistence-or-projection"
  | "mcp-bypasses-contracts";

export type SourceFile = {
  readonly path: string;
  readonly relativePath: string;
  readonly content: string;
};

export type GuardrailViolation = {
  readonly ruleId: GuardrailRuleId;
  readonly description: string;
  readonly filePath: string;
  readonly line: number | null;
  readonly snippet: string;
};

export type GuardrailRule = {
  readonly id: GuardrailRuleId;
  readonly description: string;
  readonly check: (file: SourceFile) => readonly GuardrailViolation[];
};

export const ruleDescriptions: Record<GuardrailRuleId, string> = {
  "old-review-vocabulary": "old review vocabulary is forbidden in active source",
  "public-schemas-outside-contracts": "public schemas must be authored only in packages/contracts/src",
  "mirrored-local-dtos": "canonical review DTOs must not be mirrored outside contracts",
  "reshape-into-old-structures": "canonical contracts must not be reshaped into old structures",
  "generated-schema-authority": "generated schema artifacts are derived only, never authority",
  "old-persistence-or-projection": "old persistence/projection architecture is forbidden",
  "mcp-bypasses-contracts": "MCP must use canonical contracts and centralized write paths",
};
