import { describe, expect, it } from "vitest";
import { ARCHIVAL_LETTERS, DIGITAL_LETTER_FALLBACKS } from "@/data/letters";

describe("letters data", () => {
  it("includes Ye Heren archival letter from PRD", () => {
    const letter = ARCHIVAL_LETTERS.find((item) => item.id === "ye-heren-1887");
    expect(letter).toBeDefined();
    expect(letter?.originalText).toContain("和仁");
    expect(letter?.modernText).toContain("新加坡");
  });

  it("provides AI fallback pool with at least 3 entries", () => {
    expect(DIGITAL_LETTER_FALLBACKS.length).toBeGreaterThanOrEqual(3);
  });
});
