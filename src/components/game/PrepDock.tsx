"use client";

import { useEffect } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { isPrepInteractive } from "@/lib/game/prepUi";
import { GameIcon, WoodPanel } from "@/components/game/ui";
import { PrepHudPanel } from "@/components/game/PrepHudPanel";
import { PrepGuideBanner } from "@/components/game/PrepGuideLayer";
import { ShopPanel } from "@/components/game/ShopStrip";

const UI = ASSET_MANIFEST.ui;

function usePrepDockActive() {
  const snapshot = useGameStore((state) => state.snapshot);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const { phase, state } = snapshot;
  return {
    prepActive: phase === "prep" && isPrepInteractive(prepSubview),
    state,
    prepGuideStep: useUIStore((s) => s.prepGuideStep),
    markPrepGuideDone: useUIStore((s) => s.markPrepGuideDone),
    startBattle: useGameStore((s) => s.startBattle),
    pushToast: useUIStore((s) => s.pushToast),
    setPrepDockExpanded: useUIStore((s) => s.setPrepDockExpanded),
  };
}

export function PrepShopDock() {
  const { prepActive, setPrepDockExpanded } = usePrepDockActive();

  useEffect(() => {
    setPrepDockExpanded(true);
  }, [setPrepDockExpanded]);

  if (!prepActive) return null;

  return (
    <section className="kepi-chrome-shop">
      <WoodPanel
        letterEdge
        className="kepi-prep-shop-pane pointer-events-auto w-full"
        innerClassName="px-2 py-2 sm:px-3 sm:py-2.5"
      >
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-kepi-ink">
            <GameIcon src={UI.shopRefresh} size={16} className="shrink-0 opacity-80" />
            备军图
          </span>
          <PrepGuideBanner />
        </div>
        <ShopPanel dock />
      </WoodPanel>
    </section>
  );
}

export function PrepResourceStrip() {
  const { prepActive } = usePrepDockActive();

  if (!prepActive) return null;

  return (
    <section className="kepi-chrome-hud">
      <WoodPanel
        letterEdge
        className="kepi-prep-hud-pane pointer-events-auto w-full"
        innerClassName="px-2 py-2 sm:px-3 sm:py-2.5"
      >
        <PrepHudPanel />
      </WoodPanel>
    </section>
  );
}

/** @deprecated Use PrepShopDock + PrepResourceStrip inside GameChrome. */
export function PrepDock() {
  return (
    <>
      <PrepShopDock />
      <PrepResourceStrip />
    </>
  );
}
