import { z } from "zod";
import { NonEmptyStringSchema } from "../shared/primitives.js";

export const concernAreaSlugs = [
  "harness-prompts",
  "message-roles",
  "hidden-context",
  "goal-continuation",
  "goal-behavior",
  "context-compaction",
  "tool-affordances",
  "permission-defaults",
] as const;

export const ConcernAreaSlugSchema = z
  .enum(concernAreaSlugs)
  .describe("Stable identifier for one of the eight canonical review concern areas.");

export const ConcernAreaSchema = z
  .object({
    slug: ConcernAreaSlugSchema.describe("Stable concern area slug used on the wire and in storage."),
    label: NonEmptyStringSchema.describe("Short human-readable concern area label."),
    description: NonEmptyStringSchema.describe("What kind of upstream change belongs in this concern area."),
    sortOrder: z.number().int().nonnegative().describe("Stable display order for the concern area registry."),
  })
  .strict()
  .describe("A canonical concern area definition.");

export const ConcernAreaRegistrySchema = z
  .array(ConcernAreaSchema)
  .length(concernAreaSlugs.length)
  .superRefine((areas, context) => {
    const seen = new Set<string>();
    for (const [index, area] of areas.entries()) {
      if (seen.has(area.slug)) {
        context.addIssue({
          code: "custom",
          message: `duplicate concern area slug: ${area.slug}`,
          path: [index, "slug"],
        });
      }
      seen.add(area.slug);
    }
  })
  .describe("The complete canonical concern area registry.");

export const ConcernAreaSelectionSchema = z
  .array(ConcernAreaSlugSchema)
  .max(3)
  .superRefine((slugs, context) => {
    const seen = new Set<string>();
    for (const [index, slug] of slugs.entries()) {
      if (seen.has(slug)) {
        context.addIssue({
          code: "custom",
          message: `duplicate selected concern area: ${slug}`,
          path: [index],
        });
      }
      seen.add(slug);
    }
  })
  .describe("Ordered commit concern areas; the first selected area is primary.");

const concernAreaDefinitionInput = [
  {
    slug: "harness-prompts",
    label: "Harness Prompts",
    description: "Changes to system, developer, or harness-authored prompt text that steer agent behavior.",
    sortOrder: 0,
  },
  {
    slug: "message-roles",
    label: "Message Roles",
    description: "Changes that alter how messages are classified, ordered, transformed, or exposed by role.",
    sortOrder: 1,
  },
  {
    slug: "hidden-context",
    label: "Hidden Context",
    description:
      "Changes to implicit context, injected instructions, summaries, or data hidden from the visible transcript.",
    sortOrder: 2,
  },
  {
    slug: "goal-continuation",
    label: "Goal Continuation",
    description:
      "Changes to continuation behavior, resumption, budgeting, or persistence while a goal is active.",
    sortOrder: 3,
  },
  {
    slug: "goal-behavior",
    label: "Goal Behavior",
    description: "Changes to how goals are created, updated, completed, blocked, displayed, or enforced.",
    sortOrder: 4,
  },
  {
    slug: "context-compaction",
    label: "Context Compaction",
    description:
      "Changes to summarization, truncation, compaction, transcript retention, or context recovery.",
    sortOrder: 5,
  },
  {
    slug: "tool-affordances",
    label: "Tool Affordances",
    description:
      "Changes to tool availability, descriptions, schemas, routing, execution, or model-facing affordances.",
    sortOrder: 6,
  },
  {
    slug: "permission-defaults",
    label: "Permission Defaults",
    description: "Changes to sandboxing, approval defaults, command permissions, trust, or safety gates.",
    sortOrder: 7,
  },
] as const;

export const concernAreas = ConcernAreaRegistrySchema.parse(concernAreaDefinitionInput);

export const concernAreaBySlug = Object.freeze(
  Object.fromEntries(concernAreas.map((area) => [area.slug, area])),
) as Readonly<Record<ConcernAreaSlug, ConcernArea>>;

export function requireConcernArea(slug: ConcernAreaSlug): ConcernArea {
  return concernAreaBySlug[slug];
}

export type ConcernAreaSlug = z.infer<typeof ConcernAreaSlugSchema>;
export type ConcernArea = z.infer<typeof ConcernAreaSchema>;
export type ConcernAreaSelection = z.infer<typeof ConcernAreaSelectionSchema>;
