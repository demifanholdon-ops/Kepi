import { describe, expect, it } from "vitest";
import { createInitialSnapshot } from "@/engine";
import { buildAIPromptFromSnapshot } from "@/lib/ai/buildInput";
import { pickFallbackLetter, pickFallbackLetters } from "@/lib/ai/fallback";
import type { AIPromptInput } from "@/lib/ai/types";
import { buildDigitalLetterUserPrompt } from "@/lib/ai/prompt";
import {
  aiLetterResponseSchema,
  aiRequestSchema,
} from "@/lib/schemas/ai";

const sampleInput: AIPromptInput = {
  stage: 3,
  kebi: 2,
  homeRepair: 48,
  survival: 2,
  battleSummary: "第三关小胜，土楼进入修缮态。",
  result: "win",
};

describe("buildAIPromptFromSnapshot", () => {
  it("maps snapshot state into AI prompt input", () => {
    const snapshot = createInitialSnapshot();
    const input = buildAIPromptFromSnapshot(snapshot);
    expect(input.stage).toBe(1);
    expect(input.kebi).toBe(0);
    expect(input.battleSummary).toContain("第 1 关");
  });
});

describe("pickFallbackLetter", () => {
  it("returns stable local fallback for same input", () => {
    const a = pickFallbackLetter(sampleInput);
    const b = pickFallbackLetter(sampleInput);
    expect(a.title).toBe(b.title);
    expect(a.body).toBe(b.body);
    expect(a.source).toBe("本地降级文案池");
  });

  it("returns multiple fallbacks for batch requests", () => {
    const letters = pickFallbackLetters(sampleInput, 3);
    expect(letters).toHaveLength(3);
    expect(new Set(letters.map((l) => l.body)).size).toBeGreaterThan(1);
  });
});

describe("buildDigitalLetterUserPrompt", () => {
  it("includes battle summary and run stats", () => {
    const prompt = buildDigitalLetterUserPrompt(sampleInput);
    expect(prompt).toContain("第三关小胜");
    expect(prompt).toContain("已攒客批：2 封");
    expect(prompt).toContain("本局归乡成功");
  });
});

describe("ai schemas", () => {
  it("validates digital-letter request", () => {
    const parsed = aiRequestSchema.safeParse({
      kind: "digital-letter",
      input: sampleInput,
    });
    expect(parsed.success).toBe(true);
  });

  it("validates letter response shape", () => {
    const parsed = aiLetterResponseSchema.safeParse({
      title: "番客家书",
      body: "阿爸阿妈，儿一切安好。",
    });
    expect(parsed.success).toBe(true);
  });
});
