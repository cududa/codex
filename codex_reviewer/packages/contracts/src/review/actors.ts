import { z } from "zod";
import { IdSchema, NonEmptyStringSchema } from "../shared/primitives.js";

export const ActorKindSchema = z.enum(["human", "agent", "system"]).describe("The kind of actor that performed a review action.");

export const ActorRefSchema = z
  .object({
    type: ActorKindSchema.describe("Whether the actor is a human, agent, or system process."),
    id: IdSchema.describe("Stable actor identifier."),
    displayName: NonEmptyStringSchema.optional().describe("Human-readable actor label for review surfaces."),
  })
  .strict()
  .describe("A stable reference to a human, agent, or system actor.");

export const HumanActorRefSchema = ActorRefSchema.extend({
  type: z.literal("human").describe("Human actors are the only actors allowed to approve work."),
}).describe("A human actor reference.");

export const AgentActorRefSchema = ActorRefSchema.extend({
  type: z.literal("agent").describe("Agent actors may verify work but may not approve it."),
}).describe("An agent actor reference.");

export type ActorKind = z.infer<typeof ActorKindSchema>;
export type ActorRef = z.infer<typeof ActorRefSchema>;
export type HumanActorRef = z.infer<typeof HumanActorRefSchema>;
export type AgentActorRef = z.infer<typeof AgentActorRefSchema>;
