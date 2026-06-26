import { aiLetterResponseSchema } from "@/lib/schemas/ai";
import {
  buildDigitalLetterUserPrompt,
  DIGITAL_LETTER_SYSTEM_PROMPT,
} from "./prompt";
import type { AIPromptInput, AILetterResponse } from "./types";

type ChatCompletionResponse = {
  choices?: Array<{
    message?: { content?: string | null };
  }>;
};

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced?.[1]?.trim() ?? text.trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI response missing JSON object");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeLetter(raw: unknown): AILetterResponse {
  const parsed = aiLetterResponseSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("AI response failed schema validation");
  }
  return {
    ...parsed.data,
    source: parsed.data.source ?? "AI 生成",
  };
}

export function isAIConfigured(): boolean {
  return Boolean(process.env.AI_API_KEY?.trim());
}

export async function generateDigitalLetter(
  input: AIPromptInput,
): Promise<AILetterResponse> {
  const apiKey = process.env.AI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  const baseUrl = (process.env.AI_API_BASE_URL ?? "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.AI_MODEL ?? "gpt-4o-mini";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.75,
      max_tokens: 320,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: DIGITAL_LETTER_SYSTEM_PROMPT },
        { role: "user", content: buildDigitalLetterUserPrompt(input) },
      ],
    }),
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`AI provider responded with ${response.status}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI provider returned empty content");
  }

  return normalizeLetter(extractJsonObject(content));
}
