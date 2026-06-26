import { pickFallbackLetter } from "./fallback";
import type {
  AIPromptInput,
  AIRequest,
  AIResponse,
  DigitalLetterResult,
} from "./types";

export async function requestDigitalLetter(
  input: AIPromptInput,
): Promise<DigitalLetterResult> {
  const payload: AIRequest = { kind: "digital-letter", input };

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });

    const data = (await response.json()) as AIResponse;
    if (data.ok) {
      return { letter: data.data, fromAI: true };
    }
    return { letter: data.fallback, fromAI: false };
  } catch {
    return { letter: pickFallbackLetter(input), fromAI: false };
  }
}

export async function requestDigitalLetters(
  input: AIPromptInput,
  count: number,
): Promise<DigitalLetterResult[]> {
  const safeCount = Math.max(1, Math.min(count, 5));
  const results: DigitalLetterResult[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    const result = await requestDigitalLetter({
      ...input,
      battleSummary: `${input.battleSummary} · 第 ${i + 1} 封`,
    });
    results.push(result);
  }

  return results;
}
