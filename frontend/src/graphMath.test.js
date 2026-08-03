import { describe, expect, it } from "vitest";
import { estimateTextWidth, measureLabelBox, resolveLabelCollisions, wrapLabel } from "./graphMath";

describe("wrapLabel", () => {
  it("keeps a short label on one line", () => {
    expect(wrapLabel("Autonomy", 200, 12)).toEqual(["Autonomy"]);
  });

  it("wraps a long label onto multiple lines", () => {
    const lines = wrapLabel("Creative Problem Solving", 60, 12);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.join(" ")).toBe("Creative Problem Solving");
  });

  it("never drops or reorders words", () => {
    const label = "Structured Environment And Job Security";
    const lines = wrapLabel(label, 50, 12);
    expect(lines.join(" ")).toBe(label);
  });

  it("still places an over-long single word on its own line", () => {
    const lines = wrapLabel("Antidisestablishmentarianism", 10, 12);
    expect(lines).toEqual(["Antidisestablishmentarianism"]);
  });

  it("each wrapped line fits within maxWidth (except unsplittable words)", () => {
    const maxWidth = 80;
    const lines = wrapLabel("Team Leadership Collaboration Skills", maxWidth, 12);
    for (const line of lines) {
      const words = line.split(" ");
      if (words.length > 1) {
        expect(estimateTextWidth(line, 12)).toBeLessThanOrEqual(maxWidth);
      }
    }
  });
});

describe("measureLabelBox", () => {
  it("grows height with more lines and width with longer lines", () => {
    const oneLine = measureLabelBox(["Autonomy"], 12, 14);
    const twoLines = measureLabelBox(["Creative Problem", "Solving"], 12, 14);
    expect(twoLines.height).toBe(oneLine.height * 2);
    expect(twoLines.width).toBeGreaterThan(0);
  });
});

describe("resolveLabelCollisions", () => {
  it("leaves well-separated boxes untouched", () => {
    const boxes = [
      { id: "a", x: 0, y: 0, width: 20, height: 10 },
      { id: "b", x: 500, y: 500, width: 20, height: 10 },
    ];
    const resolved = resolveLabelCollisions(boxes);
    expect(resolved).toEqual(boxes);
  });

  it("separates two fully overlapping boxes so they no longer overlap", () => {
    const boxes = [
      { id: "a", x: 100, y: 100, width: 40, height: 20 },
      { id: "b", x: 100, y: 100, width: 40, height: 20 },
    ];
    const [a, b] = resolveLabelCollisions(boxes, { padding: 2 });
    const overlapX = Math.abs(a.x - b.x) * 2 < a.width + b.width + 2;
    const overlapY = Math.abs(a.y - b.y) * 2 < a.height + b.height + 2;
    expect(overlapX && overlapY).toBe(false);
  });

  it("resolves a cluster of many overlapping boxes with no pair left overlapping", () => {
    const boxes = Array.from({ length: 8 }, (_, i) => ({
      id: `n${i}`,
      x: 50 + (i % 3) * 2, // start tightly clustered
      y: 50 + (i % 2) * 2,
      width: 30,
      height: 14,
    }));
    const resolved = resolveLabelCollisions(boxes, { padding: 3 });

    for (let i = 0; i < resolved.length; i += 1) {
      for (let j = i + 1; j < resolved.length; j += 1) {
        const a = resolved[i];
        const b = resolved[j];
        const overlapX = Math.abs(a.x - b.x) * 2 < a.width + b.width + 3;
        const overlapY = Math.abs(a.y - b.y) * 2 < a.height + b.height + 3;
        expect(overlapX && overlapY).toBe(false);
      }
    }
  });

  it("does not mutate the input array", () => {
    const boxes = [
      { id: "a", x: 0, y: 0, width: 40, height: 20 },
      { id: "b", x: 5, y: 5, width: 40, height: 20 },
    ];
    const snapshot = JSON.parse(JSON.stringify(boxes));
    resolveLabelCollisions(boxes);
    expect(boxes).toEqual(snapshot);
  });
});
