import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      fallback: {
        title: "数字客批（本地降级）",
        body: "AI 代理尚未接入。Phase 5 将在此返回真实生成或降级文案。",
      },
    },
    { status: 503 },
  );
}
