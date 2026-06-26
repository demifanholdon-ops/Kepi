"use client";

import { useMemo, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { PIECE_TEMPLATES } from "@/engine/constants";
import { PIECE_VISUALS } from "@/lib/game/assets";
import { benchBottomRem } from "@/lib/game/bottomLayout";
import { groupShopOffers } from "@/lib/game/shopOffers";
import { pieceInspectAnchor } from "@/lib/game/pieceInspectAnchor";
import { inspectShopPiece } from "@/lib/game/unitInspect";
import { useGameStore } from "@/store/gameStore";
import { shopSlotAnchor, useFxStore } from "@/store/fxStore";
import { useUIStore } from "@/store/uiStore";
import type { PieceType } from "@/types";
import { cn } from "@/lib/utils";
import { GameIcon, PieceFigure, WoodButton, WoodPanel } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function ShopPanel() {
  const snapshot = useGameStore((state) => state.snapshot);
  const dispatch = useGameStore((state) => state.dispatch);
  const buyFromShop = useGameStore((state) => state.buyFromShop);
  const startBattle = useGameStore((state) => state.startBattle);
  const pushToast = useUIStore((state) => state.pushToast);
  const setDomPieceInspect = useUIStore((state) => state.setDomPieceInspect);
  const pushPrepFx = useFxStore((state) => state.pushPrepFx);
  const { shop, state, board } = snapshot;
  const [refreshFlash, setRefreshFlash] = useState(false);

  const shopOffers = useMemo(() => groupShopOffers(shop.slots), [shop.slots]);

  const showShopInspect = (type: PieceType, element: HTMLElement) => {
    setDomPieceInspect({
      info: inspectShopPiece(type),
      ...pieceInspectAnchor(element),
    });
  };

  const buy = (pieceType: PieceType) => {
    setDomPieceInspect(null);
    const slotIndex = shop.slots.indexOf(pieceType);
    if (buyFromShop(pieceType)) {
      const anchor = shopSlotAnchor(slotIndex >= 0 ? slotIndex : 0);
      pushPrepFx({
        kind: "buy_piece",
        ...anchor,
        durationMs: 750,
      });
      pushToast(`购入 ${PIECE_VISUALS[pieceType].label}`, "success");
      return;
    }
    pushToast("无法购买该棋子", "error");
  };

  const onRefresh = () => {
    const goldBefore = useGameStore.getState().snapshot.state.gold;
    dispatch({ type: "REFRESH_SHOP" });
    const goldAfter = useGameStore.getState().snapshot.state.gold;
    if (goldAfter >= goldBefore) return;

    pushPrepFx({
      kind: "shop_refresh",
      xRatio: 0.5,
      yRatio: 0.84,
      durationMs: 950,
    });
    setRefreshFlash(true);
    window.setTimeout(() => setRefreshFlash(false), 520);
    pushToast("商店已刷新", "default");
  };

  const onBuyPopulation = () => {
    const before = useGameStore.getState().snapshot.state.population;
    dispatch({ type: "BUY_POPULATION" });
    const after = useGameStore.getState().snapshot.state.population;
    if (after <= before) {
      pushToast("无法升人口", "error");
      return;
    }
    pushPrepFx({
      kind: "population_up",
      xRatio: 0.5,
      yRatio: 0.72,
      durationMs: 1100,
    });
    pushToast(`人口升至 ${after}`, "success");
  };

  const onStartBattle = () => {
    setDomPieceInspect(null);
    if (!startBattle()) {
      pushToast("请先购买棋子再开战", "error");
      return;
    }
    pushToast("战斗开始", "default");
  };

  return (
    <WoodPanel
      className={cn(
        "pointer-events-auto mx-auto w-full max-w-5xl transition-[filter,transform]",
        refreshFlash && "kepi-shop-refresh-flash",
      )}
      innerClassName="px-3 py-3 sm:px-4"
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-kepi-ink-muted">
        <span className="inline-flex items-center gap-1.5">
          <GameIcon src={UI.population} size={16} />
          人口 {board.length}/{state.population}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <GameIcon src={UI.shopRefresh} size={16} />
          刷新 {shop.refreshCost} 金
          <span className="mx-1 opacity-40">·</span>
          <GameIcon src={UI.shopUpgrade} size={16} />
          升人口 4 金
        </span>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-1 sm:gap-2">
          {shopOffers.map((offer) => (
            <PieceFigure
              key={offer.type}
              type={offer.type}
              height={88}
              label={PIECE_VISUALS[offer.type].label}
              testId="shop-slot"
              onClick={() => buy(offer.type)}
              onInspectEnter={(element) => showShopInspect(offer.type, element)}
              onInspectLeave={() => setDomPieceInspect(null)}
              badge={
                <span className="kepi-piece-figure-badge">
                  {offer.count > 1 ? (
                    <span className="text-[0.55rem] text-kepi-ink-muted">
                      ×{offer.count}
                    </span>
                  ) : null}
                  <GameIcon src={UI.gold} size={12} />
                  {PIECE_TEMPLATES[offer.type].cost}
                </span>
              }
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <WoodButton
            className="px-3 py-2 text-xs"
            disabled={state.gold < shop.refreshCost}
            onClick={onRefresh}
          >
            <GameIcon src={UI.shopRefresh} size={16} />
            刷新
          </WoodButton>
          <WoodButton
            className="px-3 py-2 text-xs"
            disabled={state.population >= 6 || state.gold < 4}
            onClick={onBuyPopulation}
          >
            <GameIcon src={UI.shopUpgrade} size={16} />
            升人口
          </WoodButton>
          <WoodButton
            variant="primary"
            className="px-5 py-2.5 text-sm font-bold tracking-wide"
            onClick={onStartBattle}
          >
            开战 ▸
          </WoodButton>
        </div>
      </div>
    </WoodPanel>
  );
}

export function BenchStrip() {
  const board = useGameStore((state) => state.snapshot.board);
  const phase = useGameStore((state) => state.snapshot.phase);
  const selectedPieceId = useGameStore((state) => state.selectedPieceId);
  const setSelectedPiece = useGameStore((state) => state.setSelectedPiece);
  const sellSelected = useGameStore((state) => state.sellSelected);
  const pushToast = useUIStore((state) => state.pushToast);
  const letterExpanded = useUIStore((state) => state.letterStripExpanded);
  const setDomPieceInspect = useUIStore((state) => state.setDomPieceInspect);

  const unplaced = board.filter((piece) => piece.position === null);

  if (phase !== "prep" || unplaced.length === 0) return null;

  const selectedOnBench = unplaced.some((piece) => piece.id === selectedPieceId);
  const bottomRem = benchBottomRem(true, letterExpanded);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 z-20 flex justify-center px-[5%]"
      style={{ bottom: `${bottomRem}rem` }}
    >
      <div className="kepi-bench-float pointer-events-auto">
        <span className="kepi-bench-float-label">
          待落位
          <span className="kepi-bench-float-count">{unplaced.length}</span>
        </span>

        <div className="kepi-bench-float-divider" aria-hidden />

        <div className="kepi-bench-float-roster">
          {unplaced.map((piece) => (
            <PieceFigure
              key={piece.id}
              type={piece.type}
              variant="bench"
              height={76}
              selected={selectedPieceId === piece.id}
              testId="bench-piece"
              testPieceId={piece.id}
              onClick={() =>
                setSelectedPiece(selectedPieceId === piece.id ? null : piece.id)
              }
              badge={
                piece.star > 1 ? (
                  <span className="kepi-piece-figure-badge kepi-piece-figure-badge-star">
                    ★{piece.star}
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>

        {selectedOnBench ? (
          <>
            <div className="kepi-bench-float-divider" aria-hidden />
            <WoodButton
              variant="danger"
              className="kepi-bench-float-sell px-2.5 py-1 text-[0.65rem]"
              onClick={() => {
                setDomPieceInspect(null);
                if (sellSelected()) pushToast("已卖出棋子", "default");
              }}
            >
              卖出
            </WoodButton>
          </>
        ) : null}
      </div>
    </div>
  );
}
