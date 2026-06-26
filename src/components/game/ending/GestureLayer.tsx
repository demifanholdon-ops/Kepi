"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type GestureMode = "pointer" | "gesture";

type GestureLayerProps = {
  letterCount: number;
  caughtCount: number;
  onCatch: () => void;
  onSlowTime: () => void;
  gestureMode: GestureMode;
  disabled?: boolean;
};

const SWIPE_THRESHOLD = 48;

export function GestureLayer({
  letterCount,
  caughtCount,
  onCatch,
  onSlowTime,
  gestureMode,
  disabled = false,
}: GestureLayerProps) {
  const startX = useRef<number | null>(null);
  const [hint, setHint] = useState<string>(
    gestureMode === "gesture"
      ? "左右滑动手势减速 · 点击接住信件"
      : "左右滑动或点击按钮减速 · 点击信件接住",
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      startX.current = event.clientX;
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [disabled],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled || startX.current === null) return;
      const delta = event.clientX - startX.current;
      startX.current = null;

      if (Math.abs(delta) >= SWIPE_THRESHOLD) {
        onSlowTime();
        setHint("子弹时间已触发 — 快接住飘落的客批");
      }
    },
    [disabled, onSlowTime],
  );

  const remaining = Math.max(0, letterCount - caughtCount);

  return (
    <div
      className={cn(
        "relative flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm",
        disabled ? "pointer-events-none opacity-60" : "cursor-pointer",
      )}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      role="application"
      aria-label="结局手势交互层"
    >
      <p className="text-center text-sm text-amber-100/90">{hint}</p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {Array.from({ length: letterCount }, (_, index) => {
          const caught = index < caughtCount;
          return (
            <button
              key={index}
              type="button"
              disabled={disabled || caught}
              onClick={() => {
                if (!caught) {
                  onCatch();
                  setHint(`已接住 ${caughtCount + 1}/${letterCount} 封`);
                }
              }}
              className={cn(
                "h-14 w-10 rounded-sm border text-xs transition-all",
                caught
                  ? "scale-95 border-amber-300/40 bg-amber-200/80 text-amber-950"
                  : "animate-bounce border-amber-100/30 bg-amber-50/20 text-amber-50 hover:scale-105 hover:bg-amber-100/30",
              )}
              aria-label={caught ? `第 ${index + 1} 封已接住` : `接住第 ${index + 1} 封客批`}
            >
              批
            </button>
          );
        })}
      </div>

      <p className="text-xs text-amber-100/70">
        {gestureMode === "gesture"
          ? "摄像头手势不可用时将自动切换为指针操作"
          : "指针降级模式"}
        {" · "}
        剩余 {remaining} 封
      </p>
    </div>
  );
}
