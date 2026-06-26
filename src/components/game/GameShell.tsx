"use client";

import { useEffect } from "react";
import { loadSnapshot } from "@/lib/storage/snapshot";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { BattleOverlay, SettlementOverlay } from "./PhaseOverlays";
import { EndingPhase } from "./EndingPhase";
import { GameCanvas } from "./GameCanvas";
import { GameDialogs } from "./GameDialogs";
import { HudBar, LetterDrawer } from "./HudBar";
import { BenchStrip, ShopStrip } from "./ShopStrip";
import { SettingsMenu } from "./SettingsMenu";
import { ToastHost } from "./ToastHost";

const PREP_TIMEOUT_MS = 30_000;

export function GameShell() {
  const snapshot = useGameStore((state) => state.snapshot);
  const replaceSnapshot = useGameStore((state) => state.replaceSnapshot);
  const startBattle = useGameStore((state) => state.startBattle);
  const selectedPieceId = useGameStore((state) => state.selectedPieceId);
  const moveSelected = useGameStore((state) => state.moveSelected);
  const pushToast = useUIStore((state) => state.pushToast);
  const { phase, state } = snapshot;

  useEffect(() => {
    const saved = loadSnapshot();
    if (saved) replaceSnapshot(saved);
  }, [replaceSnapshot]);

  useEffect(() => {
    if (phase !== "prep") return;

    const timer = window.setTimeout(() => {
      if (!startBattle()) {
        pushToast("备战超时，请先购买棋子", "error");
        return;
      }
      pushToast("备战超时，自动开战", "default");
    }, PREP_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [phase, state.stage, startBattle, pushToast]);

  if (phase === "ending") {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-kepi-scene">
        <EndingPhase />
        <ToastHost />
        <GameDialogs />
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-kepi-scene">
      <div className="kepi-scene-glow" aria-hidden />

      <div className="kepi-scene-vignette absolute inset-0 z-0">
        <GameCanvas
          snapshot={snapshot}
          selectedPieceId={selectedPieceId}
          onCellClick={(position) => {
            if (phase !== "prep" || !selectedPieceId) return;
            if (moveSelected(position)) {
              pushToast(`棋子已落位 (${position.x}, ${position.y})`, "success");
            }
          }}
        />
      </div>

      <HudBar />
      <BenchStrip />
      <ShopStrip />
      <BattleOverlay />
      <SettlementOverlay />

      <LetterDrawer />
      <SettingsMenu />
      <ToastHost />
      <GameDialogs />
    </div>
  );
}
