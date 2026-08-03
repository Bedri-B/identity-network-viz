import { describe, expect, it } from "vitest";
import { hubSpokeSteps } from "./pairwise";

describe("hubSpokeSteps", () => {
  it("covers every unordered pair exactly once", () => {
    const items = ["a", "b", "c", "d"];
    const steps = hubSpokeSteps(items);
    const seen = new Set();
    for (const { hub, spokes } of steps) {
      for (const spoke of spokes) {
        const key = [hub, spoke].sort().join("|");
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    }
    expect(seen.size).toBe((items.length * (items.length - 1)) / 2);
  });

  it("produces n-1 hub screens for n items", () => {
    const items = ["a", "b", "c", "d", "e"];
    expect(hubSpokeSteps(items)).toHaveLength(items.length - 1);
  });

  it("the last item is never its own hub (it only appears as a spoke)", () => {
    const items = ["a", "b", "c"];
    const steps = hubSpokeSteps(items);
    expect(steps.some((step) => step.hub === "c")).toBe(false);
  });

  it("returns no steps for fewer than 2 items", () => {
    expect(hubSpokeSteps(["solo"])).toEqual([]);
    expect(hubSpokeSteps([])).toEqual([]);
  });
});
