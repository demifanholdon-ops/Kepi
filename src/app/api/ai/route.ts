import { pickFallbackLetter } from "@/lib/ai/fallback";
import { generateDigitalLetter } from "@/lib/ai/server";
import type { AIPromptInput, AIResponse } from "@/lib/ai/types";
import { aiRequestSchema } from "@/lib/schemas/ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  let input: AIPromptInput | undefined;

  try {
    const body: unknown = await request.json();
    const parsed = aiRequestSchema.safeParse(body);

    if (!parsed.success) {
      const fallback = pickFallbackLetter({
        stage: 1,
        kebi: 0,
        homeRepair: 0,
        survival: 2,
        battleSummary: "请求格式无效",
      });
      return NextResponse.json(
        { ok: false, fallback } satisfies AIResponse,
        { status: 400 },
      );
    }

    input = parsed.data.input;

    if (parsed.data.kind !== "digital-letter") {
      return NextResponse.json(
        { ok: false, fallback: pickFallbackLetter(input) } satisfies AIResponse,
        { status: 400 },
      );
    }

    const data = await generateDigitalLetter(input);
    return NextResponse.json({ ok: true, data } satisfies AIResponse);
  } catch {
    const fallback = pickFallbackLetter(
      input ?? {
        stage: 1,
        kebi: 0,
        homeRepair: 0,
        survival: 2,
        battleSummary: "AI 代理不可用",
      },
    );
    return NextResponse.json(
      { ok: false, fallback } satisfies AIResponse,
      { status: 503 },
    );
  }
}
