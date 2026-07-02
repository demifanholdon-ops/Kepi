"use client";

import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";

type HudBarProps = {
  /** Render inside GameChrome top row (no absolute positioning). */
  embedded?: boolean;
};

export function HudBar({ embedded = false }: HudBarProps) {
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);

  return (
    <header
      className={cn(
        "z-20 flex shrink-0",
        embedded
          ? "items-center"
          : "absolute inset-x-0 top-0 justify-end px-[5%] pt-[max(0.75rem,env(safe-area-inset-top))]",
      )}
    >
      <button
        type="button"
        className="flex h-9 w-9 items-center justify-center rounded-md text-lg leading-none text-stone-100/90 transition hover:bg-white/10"
        onClick={() => setSettingsOpen(true)}
        aria-label="设置"
      >
        ⚙
      </button>
    </header>
  );
}
