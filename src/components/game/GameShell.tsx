"use client";

import { useEffect } from "react";
import { loadSnapshot, hasSavedSnapshot } from "@/lib/storage/snapshot";
import { initBgm } from "@/lib/audio/bgm";
import { loadSettings } from "@/lib/storage/settings";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { usePrepNodeEnter } from "@/hooks/usePrepNodeEnter";
import { BattleOverlay, SettlementOverlay } from "./PhaseOverlays";
import { BattleHud } from "./BattleHud";
import { CampfirePanel } from "./CampfirePanel";
import { EndingPhase } from "./EndingPhase";
import { GameCanvas } from "./GameCanvas";
import { GameChrome } from "./GameChrome";
import { GameDialogs } from "./GameDialogs";
import { isNarrativePhase } from "@/lib/game/journeyUi";
import { isPrepInteractive } from "@/lib/game/prepUi";
import { OpeningBuffLayer } from "./OpeningBuffLayer";
import { AssassinWarningLayer } from "./AssassinWarningLayer";
import { BattleFooter } from "./BattleFooter";
import { LeafFallLayer } from "./LeafFallLayer";
import { PawnShopPanel } from "./PawnShopPanel";
import { PrepGuideLayer } from "./PrepGuideLayer";
import { StageBriefOverlay } from "./StageBriefOverlay";
import { SettingsMenu } from "./SettingsMenu";
import { ToastHost } from "./ToastHost";
import { UnitInspectOverlay } from "./UnitInspectOverlay";
import { PieceInspectTooltip } from "./PieceInspectTooltip";

const PREP_TIMEOUT_MS = 30_000;

export function GameShell() {
  const snapshot = useGameStore((state) => state.snapshot);
  const replaceSnapshot = useGameStore((state) => state.replaceSnapshot);
  const startBattle = useGameStore((state) => state.startBattle);
  const selectedPieceId = useGameStore((state) => state.selectedPieceId);
  const moveSelected = useGameStore((state) => state.moveSelected);
  const setSelectedPiece = useGameStore((state) => state.setSelectedPiece);
  const pushToast = useUIStore((state) => state.pushToast);
  const setDomPieceInspect = useUIStore((state) => state.setDomPieceInspect);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const { phase, state } = snapshot;
  const narrativeShell = isNarrativePhase(phase);
  const prepActive = phase === "prep" && isPrepInteractive(prepSubview);

  usePrepNodeEnter();

  useEffect(() => {
    const settings = loadSettings();
    initBgm(settings.volume * 0.55);

    if (!hasSavedSnapshot()) return;

    const saved = loadSnapshot();
    if (saved) {
      replaceSnapshot(saved);
      return;
    }

    pushToast("存档已过期或损坏，已为你开启新局", "default");
  }, [replaceSnapshot, pushToast]);

  useEffect(() => {
    setDomPieceInspect(null);
  }, [phase, setDomPieceInspect]);

  useEffect(() => {
    if (phase !== "prep" || !isPrepInteractive(prepSubview)) return;

    const timer = window.setTimeout(() => {
      if (!startBattle()) {
        pushToast("备战超时，请先购买棋子", "error");
        return;
      }
      pushToast("备战超时，自动开战", "default");
    }, PREP_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [phase, prepSubview, state.journeyIndex, startBattle, pushToast]);

  if (phase === "ending") {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-kepi-scene">
        <EndingPhase />
        <ToastHost />
        <GameDialogs />
      </div>
    );
  }

  if (narrativeShell) {
    return (
      <div className="relative h-[100dvh] w-full overflow-hidden bg-kepi-scene">
        <div className="kepi-scene-glow" aria-hidden />
        <div
          className="kepi-scene-vignette h-full w-full bg-[radial-gradient(circle_at_50%_40%,rgba(139,106,58,0.12),rgba(12,10,8,0.96))]"
          aria-hidden
        />
        <PawnShopPanel />
        <CampfirePanel />
        <SettingsMenu />
        <ToastHost />
        <GameDialogs />
      </div>
    );
  }

  return (
    <>
      <GameChrome prepActive={prepActive} railDimmed={phase === "prep" && !prepActive}>
        <GameCanvas
          snapshot={snapshot}
          selectedPieceId={selectedPieceId}
          onUnitClick={(pieceId) => {
            if (!prepActive) return;
            setSelectedPiece(selectedPieceId === pieceId ? null : pieceId);
          }}
          onCellClick={(position) => {
            if (!prepActive || !selectedPieceId) return;
            moveSelected(position);
          }}
        />
        {phase === "prep" && prepActive ? <PrepGuideLayer /> : null}
        <BattleHud />
        <LeafFallLayer />
        <AssassinWarningLayer />
        <OpeningBuffLayer />
        <BattleOverlay />
        <BattleFooter />
        <SettlementOverlay />
        {phase === "prep" ? <StageBriefOverlay /> : null}
      </GameChrome>

      <UnitInspectOverlay />
      <PieceInspectTooltip />
      <SettingsMenu />
      <ToastHost />
      <GameDialogs />
    </>
  );
}
