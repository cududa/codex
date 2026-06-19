import { reviewTestActors } from "@prompt-reviews/review-test-support";
import { describe, expect, it } from "vitest";
import { AgentActorRefSchema, HumanActorRefSchema, SystemActorRefSchema } from "./actors.js";

describe("review actor contracts", () => {
  it("validates exact actor subtype contracts", () => {
    expect(HumanActorRefSchema.parse(reviewTestActors.human)).toEqual(reviewTestActors.human);
    expect(AgentActorRefSchema.parse(reviewTestActors.agent)).toEqual(reviewTestActors.agent);
    expect(SystemActorRefSchema.parse(reviewTestActors.system)).toEqual(reviewTestActors.system);

    expect(() => HumanActorRefSchema.parse(reviewTestActors.agent)).toThrow();
    expect(() => HumanActorRefSchema.parse(reviewTestActors.system)).toThrow();
    expect(() => AgentActorRefSchema.parse(reviewTestActors.human)).toThrow();
    expect(() => AgentActorRefSchema.parse(reviewTestActors.system)).toThrow();
    expect(() => SystemActorRefSchema.parse(reviewTestActors.human)).toThrow();
    expect(() => SystemActorRefSchema.parse(reviewTestActors.agent)).toThrow();
  });
});
