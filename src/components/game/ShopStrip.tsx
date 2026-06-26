"use client";

import Image from "next/image";
import { useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { PIECE_TEMPLATES } from "@/engine/constants";
import { PIECE_VISUALS } from "@/lib/game/assets";
import { useGameStore } from "@/store/gameStore";
import { shopSlotAnchor, useFxStore } from "@/store/fxStore";
import { useUIStore } from "@/store/uiStore";
import type { PieceType } from "@/types";
import { cn } from "@/lib/utils";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function ShopStrip() {
  const snapshot = useGameStore((state) => state.snapshot);
  const dispatch = useGameStore((state) => state.dispatch);
  const buyFromShop = useGameStore((state) => state.buyFromShop);
  const startBattle = useGameStore((state) => state.startBattle);
  const pushToast = useUIStore((state) => state.pushToast);
  const pushPrepFx = useFxStore((state) => state.pushPrepFx);
  const { shop, state, board, phase } = snapshot;
  const [refreshFlash, setRefreshFlash] = useState(false);

  if (phase !== "prep") return null;

  const buy = (pieceType: PieceType, slotIndex: number) => {
    if (buyFromShop(pieceType)) {
      const anchor = shopSlotAnchor(slotIndex);
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
    if (!startBattle()) {
      pushToast("请先购买棋子再开战", "error");
      return;
    }
    pushToast("战斗开始", "default");
  };

  return (
    <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-[5%] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <WoodPanel
        className={cn(
          "pointer-events-auto mx-auto max-w-5xl transition-[filter,transform]",
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
          <div className="flex flex-wrap gap-2">
            {shop.slots.map((slot, index) => (
              <button
                key={`${slot}_${index}`}
                type="button"
                data-testid="shop-slot"
                data-piece={slot}
                className="kepi-shop-slot transition-transform hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => buy(slot, index)}
              >
                <div className="kepi-shop-slot-inner">
                  <PiecePortrait type={slot} size={36} />
                  <span className="max-w-[4rem] truncate text-[0.65rem] text-kepi-ink">
                    {PIECE_VISUALS[slot].label}
                  </span>
                  <span className="inline-flex items-center gap-0.5 text-[0.6rem] font-medium text-kepi-gold">
                    <GameIcon src={UI.gold} size={12} />
                    {PIECE_TEMPLATES[slot].cost}
                  </span>
                </div>
              </button>
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
    </footer>
  );
}

export function BenchStrip() {
  const board = useGameStore((state) => state.snapshot.board);
  const phase = useGameStore((state) => state.snapshot.phase);
  const selectedPieceId = useGameStore((state) => state.selectedPieceId);
  const setSelectedPiece = useGameStore((state) => state.setSelectedPiece);
  const sellSelected = useGameStore((state) => state.sellSelected);
  const pushToast = useUIStore((state) => state.pushToast);

  if (phase !== "prep" || board.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[9.5rem] z-20 px-[5%] sm:bottom-[10.5rem]">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-wrap items-center gap-2">
        <div className="kepi-hud-tag shrink-0">
          <div className="kepi-hud-tag-inner">
            <div className="kepi-hud-tag-stack">
              <span className="kepi-hud-label">备战</span>
              <span className="kepi-hud-value text-[0.6875rem] font-normal text-kepi-ink-muted">
                点选落位
              </span>
            </div>
          </div>
        </div>
        {board.map((piece) => (
          <button
            key={piece.id}
            type="button"
            data-testid="bench-piece"
            data-piece={piece.type}
            data-piece-id={piece.id}
            className={cn(
              "kepi-shop-slot transition-transform hover:scale-[1.02]",
              selectedPieceId === piece.id &&
                "ring-2 ring-kepi-accent ring-offset-1 ring-offset-transparent",
            )}
            onClick={() =>
              setSelectedPiece(selectedPieceId === piece.id ? null : piece.id)
            }
          >
            <div className="kepi-shop-slot-inner min-h-0 flex-row gap-2 px-3 py-1.5">
              <PiecePortrait type={piece.type} size={28} />
              <span className="text-xs text-kepi-ink">
                {PIECE_VISUALS[piece.type].label}
                <span className="ml-1 text-kepi-gold">★{piece.star}</span>
              </span>
            </div>
          </button>
        ))}
        {selectedPieceId && (
          <WoodButton
            variant="danger"
            className="px-3 py-1.5 text-xs"
            onClick={() => {
              if (sellSelected()) pushToast("已卖出棋子", "default");
            }}
          >
            卖出
          </WoodButton>
        )}
      </div>
    </div>
  );
}

function PiecePortrait({ type, size }: { type: PieceType; size: number }) {
  const visual = PIECE_VISUALS[type];
  return (
    <Image
      src={visual.portrait}
      alt={visual.label}
      width={size}
      height={size}
      className="shrink-0 object-contain object-bottom drop-shadow-sm"
      draggable={false}
    />
  );
}
