import { DIGITAL_LETTER_FALLBACKS } from "@/data/letters";
import type { AIPromptInput, AILetterResponse } from "./types";

function hashSeed(input: AIPromptInput): number {
  const raw = `${input.stage}:${input.kebi}:${input.homeRepair}:${input.survival}:${input.battleSummary}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i += 1) {
    hash = (hash * 31 + raw.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function pickFallbackLetter(input: AIPromptInput): AILetterResponse {
  const index = hashSeed(input) % DIGITAL_LETTER_FALLBACKS.length;
  const letter = DIGITAL_LETTER_FALLBACKS[index]!;

  return {
    title: letter.title,
    body: letter.body,
    source: "本地降级文案池",
  };
}

export function pickFallbackLetters(
  input: AIPromptInput,
  count: number,
): AILetterResponse[] {
  const safeCount = Math.max(1, Math.min(count, DIGITAL_LETTER_FALLBACKS.length));
  const start = hashSeed(input) % DIGITAL_LETTER_FALLBACKS.length;
  const letters: AILetterResponse[] = [];

  for (let i = 0; i < safeCount; i += 1) {
    const item = DIGITAL_LETTER_FALLBACKS[(start + i) % DIGITAL_LETTER_FALLBACKS.length]!;
    letters.push({
      title: item.title,
      body: item.body,
      source: "本地降级文案池",
    });
  }

  return letters;
}
