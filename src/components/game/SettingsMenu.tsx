"use client";

import Link from "next/link";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { WoodButton, WoodPanel } from "@/components/game/ui";

export function SettingsMenu() {
  const open = useUIStore((state) => state.settingsOpen);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);
  const resetGame = useGameStore((state) => state.resetGame);
  const pushToast = useUIStore((state) => state.pushToast);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        aria-label="关闭设置"
        onClick={() => setSettingsOpen(false)}
      />
      <div
        className="fixed top-1/2 left-1/2 z-50 w-[min(100%-2rem,22rem)] -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-label="设置"
      >
        <WoodPanel letterEdge innerClassName="p-5">
          <h2 className="mb-1 text-lg font-bold text-kepi-ink">设置</h2>
          <p className="mb-4 text-xs text-kepi-ink-muted">客批 · 归乡之路</p>
          <div className="kepi-wood-divider mb-4" />
          <div className="flex flex-col gap-2">
            <WoodButton
              variant="primary"
              className="w-full px-4 py-2.5 text-sm"
              onClick={() => {
                resetGame();
                pushToast("已开始新局", "default");
                setSettingsOpen(false);
              }}
            >
              开始新局
            </WoodButton>
            <Link
              href="/debug"
              className="kepi-wood-btn inline-flex w-full items-center justify-center px-4 py-2.5 text-center text-sm font-medium"
              onClick={() => setSettingsOpen(false)}
            >
              调试页
            </Link>
            <WoodButton
              className="w-full px-4 py-2.5 text-sm opacity-90"
              onClick={() => setSettingsOpen(false)}
            >
              关闭
            </WoodButton>
          </div>
        </WoodPanel>
      </div>
    </>
  );
}
