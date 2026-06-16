import { describe, expect, it } from "vitest";
import { actorTypes } from "../enums.js";
import { HumanFinalizerRequiredError, assertHumanFinalizer } from "./actors.js";

describe("actor authority rules", () => {
  it("uses actor type vocabulary for finalizer actors", () => {
    expect(actorTypes).toEqual(["human", "agent", "system"]);
  });

  it("allows human finalizers", () => {
    expect(() => assertHumanFinalizer({ type: "human" })).not.toThrow();
  });

  it("rejects non-human finalizers", () => {
    expect(() => assertHumanFinalizer({ type: "agent" })).toThrow(HumanFinalizerRequiredError);
    expect(() => assertHumanFinalizer({ type: "system" })).toThrow(HumanFinalizerRequiredError);
  });
});
