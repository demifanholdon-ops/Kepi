import { campfireScenarioForNode } from "@/data/campfire";
import { pickFallbackNarrative } from "./narrativeFallback";
import type {
  AIRequest,
  AIResponse,
  CampfireCopyInput,
  CampfireCopyResult,
  DigitalLetterResult,
  TurnNarrativeInput,
  TurnNarrativeResult,
  AIPromptInput,
} from "./types";
import { pickFallbackLetter } from "./fallback";
import { AI_REQUEST_TIMEOUT_MS } from "./types";

function trimNarrativeToKebi(body: string, kebi: number): string {
  const count = Math.max(1, kebi);
  const paragraphs = body.split("\n\n").filter(Boolean);
  return paragraphs.slice(0, count).join("\n\n");
}

export async function requestDigitalLetter(
  input: AIPromptInput,
): Promise<DigitalLetterResult> {
  const payload: AIRequest = { kind: "digital-letter", input };

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });

    const data = (await response.json()) as AIResponse;
    if (data.ok && "title" in data.data) {
      return {
        letter: {
          ...data.data,
          body: trimNarrativeToKebi(data.data.body, input.kebi),
        },
        fromAI: true,
      };
    }
    if (!data.ok && "title" in data.fallback) {
      return { letter: data.fallback, fromAI: false };
    }
    return { letter: pickFallbackLetter(input), fromAI: false };
  } catch {
    return { letter: pickFallbackLetter(input), fromAI: false };
  }
}

export async function requestTurnNarrative(
  input: TurnNarrativeInput,
): Promise<TurnNarrativeResult> {
  const payload: AIRequest = { kind: "turn-narrative", input };

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });

    const data = (await response.json()) as AIResponse;
    if (data.ok && "text" in data.data) {
      return { narrative: data.data, fromAI: true };
    }
    if (!data.ok && "text" in data.fallback) {
      return { narrative: data.fallback, fromAI: false };
    }
    return { narrative: pickFallbackNarrative(input), fromAI: false };
  } catch {
    return { narrative: pickFallbackNarrative(input), fromAI: false };
  }
}

function localCampfireFallback(input: CampfireCopyInput): CampfireCopyResult {
  const scenario = campfireScenarioForNode(input.nodeId);
  return {
    prompt: scenario.prompt,
    choiceA: scenario.choices[0]!.title,
    choiceB: scenario.choices[1]!.title,
    fromAI: false,
  };
}

export async function requestCampfireCopy(
  input: CampfireCopyInput,
): Promise<CampfireCopyResult> {
  const payload: AIRequest = { kind: "campfire-choice-copy", input };

  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(AI_REQUEST_TIMEOUT_MS),
    });

    const data = (await response.json()) as AIResponse;
    if (data.ok && "choiceA" in data.data) {
      return { ...data.data, fromAI: true };
    }
    if (!data.ok && "choiceA" in data.fallback) {
      return { ...data.fallback, fromAI: false };
    }
    return localCampfireFallback(input);
  } catch {
    return localCampfireFallback(input);
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
