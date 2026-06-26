"use client";

import { EndingScene } from "@/components/game/ending";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useState } from "react";

export default function EndingPreviewPage() {
  const [variant, setVariant] = useState<"win" | "lose">("win");

  const props =
    variant === "win"
      ? {
          result: "win" as const,
          kebi: 5,
          homeRepair: 82,
          survival: 1,
          stage: 6,
          battleSummary: "末关险胜，水客收齐五封客批，归乡票已成。",
        }
      : {
          result: "lose" as const,
          kebi: 2,
          homeRepair: 34,
          survival: 0,
          stage: 4,
          battleSummary: "存续度归零，未能撑到归乡。",
        };

  return (
    <main className="mx-auto flex min-h-full w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">结局预览</h1>
          <p className="text-sm text-muted-foreground">
            Phase 5：AI 数字客批、真实侨批展示、手势/指针降级与音频钩子。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={variant === "win" ? "default" : "outline"}
            onClick={() => setVariant("win")}
          >
            归乡（赢）
          </Button>
          <Button
            variant={variant === "lose" ? "default" : "outline"}
            onClick={() => setVariant("lose")}
          >
            救信（输）
          </Button>
          <Button nativeButton={false} variant="outline" render={<Link href="/debug" />}>
            调试页
          </Button>
        </div>
      </div>

      <EndingScene
        key={variant}
        {...props}
        gestureMode="pointer"
        onComplete={() => setVariant(variant)}
      />
    </main>
  );
}
