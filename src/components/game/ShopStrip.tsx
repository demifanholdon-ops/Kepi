"use client";

import { useMemo, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { PIECE_TEMPLATES, PAWN_KEBI_GOLD, BLOOD_DEBT_GOLD } from "@/engine/constants";
import { journeyNodeAt } from "@/data/journey";
import { levelInteractionForNode } from "@/data/levelInteractions";
import { PIECE_VISUALS, isProtectedPiece } from "@/lib/game/assets";
import { groupShopOffers } from "@/lib/game/shopOffers";
import { pieceInspectAnchor } from "@/lib/game/pieceInspectAnchor";
import { inspectShopPiece } from "@/lib/game/unitInspect";
import {
  playPawnGoldSfx,
  playPawnStampSfx,
} from "@/lib/audio/battleSfx";
import { useGameStore } from "@/store/gameStore";
import { shopSlotAnchor, useFxStore } from "@/store/fxStore";
import { useUIStore } from "@/store/uiStore";
import { prepGuideTargetClass } from "@/components/game/PrepGuideLayer";
import type { PieceType } from "@/types";
import { cn } from "@/lib/utils";
import { GameIcon, PieceFigure, WoodButton, WoodPanel } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function ShopPanel({
  dock = false,
  onStartBattle: onStartBattleExternal,
}: {
  dock?: boolean;
  onStartBattle?: () => void;
} = {}) {
  const snapshot = useGameStore((state) => state.snapshot);
  const dispatch = useGameStore((state) => state.dispatch);
  const buyFromShop = useGameStore((state) => state.buyFromShop);
  const pawnKebi = useGameStore((state) => state.pawnKebi);
  const borrowAgainstReturn = useGameStore((state) => state.borrowAgainstReturn);
  const startBattle = useGameStore((state) => state.startBattle);
  const pushToast = useUIStore((state) => state.pushToast);
  const openDialog = useUIStore((state) => state.openDialog);
  const setDomPieceInspect = useUIStore((state) => state.setDomPieceInspect);
  const prepGuideStep = useUIStore((state) => state.prepGuideStep);
  const markPrepGuideDone = useUIStore((state) => state.markPrepGuideDone);
  const pushPrepFx = useFxStore((state) => state.pushPrepFx);
  const { shop, state, board } = snapshot;
  const [refreshFlash, setRefreshFlash] = useState(false);
  const [pawnFlash, setPawnFlash] = useState(false);

  const shopOffers = useMemo(() => groupShopOffers(shop.slots), [shop.slots]);
  const journeyNode = journeyNodeAt(state.journeyIndex);
  const interaction = levelInteractionForNode(journeyNode?.id);
  const isFinalBattlePrep = Boolean(journeyNode?.isFinal);
  const canPawn = state.kebi >= 1;
  const kebiShortfall =
    state.kebi < state.kebiThreshold &&
    (state.stage >= 2 || isFinalBattlePrep);

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
    if (prepGuideStep === 3) {
      markPrepGuideDone();
    }
    pushToast("战斗开始", "default");
  };

  const commitPawnKebi = () => {
    const before = state;
    if (!pawnKebi()) {
      pushToast(
        before.kebi < 1 ? "暂无客批可典当，需先赢得战斗收信" : "当前无法典当",
        "error",
      );
      return;
    }

    pushPrepFx({
      kind: "pawn_kebi",
      xRatio: 0.14,
      yRatio: 0.78,
      durationMs: 1200,
    });
    setPawnFlash(true);
    window.setTimeout(() => setPawnFlash(false), 680);
    playPawnStampSfx();
    playPawnGoldSfx();
    pushToast(`典当 1 封客批，获得 ${PAWN_KEBI_GOLD} 金币`, "default");
  };

  const onBorrow = () => {
    if (!borrowAgainstReturn()) {
      pushToast("当前无法透支", "error");
      return;
    }
    const threshold = useGameStore.getState().snapshot.state.kebiThreshold;
    pushToast(`透支未来 +${BLOOD_DEBT_GOLD} 金，归乡需 ${threshold} 封客批`, "default");
  };

  const onPawnKebi = () => {
    if (!canPawn) {
      pushToast("暂无客批可典当，需先赢得战斗收信", "error");
      return;
    }

    openDialog({
      title: "典当客批？",
      description: `将燃烧 1 封客批，立即获得 ${PAWN_KEBI_GOLD} 金币。此操作不可逆，可能影响最终归乡判定（当前 ${state.kebi}/${state.kebiThreshold} 封）。`,
      confirmLabel: "确认典当",
      onConfirm: commitPawnKebi,
    });
  };

  const handleStartBattle = () => {
    if (onStartBattleExternal) {
      onStartBattleExternal();
      return;
    }
    onStartBattle();
  };

  const warnings = (
    <>
      {kebiShortfall ? (
        <p
          className="mb-2 rounded-md border border-amber-700/35 bg-amber-950/20 px-2.5 py-1.5 text-[0.6875rem] leading-snug text-amber-100/90"
          role="status"
        >
          客批仅 {state.kebi}/{state.kebiThreshold} 封——若继续典当，可能凑不够归乡所需。
        </p>
      ) : null}

      {interaction && state.stage >= 4 ? (
        <p
          className="mb-2 rounded-md border border-red-900/35 bg-red-950/18 px-2.5 py-1.5 text-[0.6875rem] leading-snug text-red-100/92"
          role="status"
        >
          {isFinalBattlePrep
            ? `终局一战：${interaction.mechanic.label}。胜后依客批 ${state.kebi}/${state.kebiThreshold} 判定归乡结局。`
            : `${interaction.mechanic.label}：${interaction.mechanic.description}`}
        </p>
      ) : null}
    </>
  );

  const shopBody = (
    <>
      {warnings}

      {!dock ? (
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
      ) : null}

      <div
        className={cn(
          "flex flex-wrap items-end gap-3",
          dock ? "kepi-prep-shop-layout justify-between" : "justify-between",
        )}
      >
        <div className="kepi-prep-shop-slots flex min-w-0 flex-1 flex-wrap items-end gap-1 overflow-x-auto sm:gap-2">
          {shopOffers.map((offer) => (
            <div key={offer.type}>
              <PieceFigure
                type={offer.type}
                height={dock ? 80 : 88}
                label={
                  isProtectedPiece(offer.type)
                    ? `${PIECE_VISUALS[offer.type].label} · 需保护`
                    : PIECE_VISUALS[offer.type].label
                }
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
            </div>
          ))}
        </div>

        <div className="kepi-prep-shop-actions flex shrink-0 flex-wrap items-center justify-end gap-2">
          <WoodButton
            variant="danger"
            className="px-3 py-2 text-xs kepi-pawn-button"
            disabled={!canPawn}
            title={
              canPawn
                ? `典当 1 封客批，立即获得 ${PAWN_KEBI_GOLD} 金币（不可逆，需确认）`
                : "暂无客批可典当"
            }
            onClick={onPawnKebi}
          >
            <GameIcon src={UI.kebi} size={16} />
            典当 +{PAWN_KEBI_GOLD}
          </WoodButton>
          <WoodButton
            variant="secondary"
            className="px-3 py-2 text-xs"
            title={`透支未来 +${BLOOD_DEBT_GOLD} 金，归乡阈值 +1`}
            onClick={onBorrow}
          >
            透支 +{BLOOD_DEBT_GOLD}
          </WoodButton>
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
            className={cn(
              "px-5 py-2.5 text-sm font-bold tracking-wide",
              prepGuideTargetClass("start-battle", prepGuideStep),
            )}
            onClick={handleStartBattle}
          >
            <GameIcon src={UI.battleStart} size={18} />
            开战
          </WoodButton>
        </div>
      </div>
    </>
  );

  if (dock) {
    return (
      <div
        className={cn(
          "kepi-prep-shop pointer-events-auto transition-[filter,transform]",
          refreshFlash && "kepi-shop-refresh-flash",
          pawnFlash && "kepi-pawn-flash",
        )}
      >
        {shopBody}
      </div>
    );
  }

  return (
    <WoodPanel
      className={cn(
        "pointer-events-auto mx-auto w-full max-w-5xl transition-[filter,transform]",
        refreshFlash && "kepi-shop-refresh-flash",
        pawnFlash && "kepi-pawn-flash",
      )}
      innerClassName="px-3 py-3 sm:px-4"
    >
      <p className="mb-2 text-[0.6875rem] font-bold tracking-wide text-kepi-ink-muted uppercase">
        备战 · 归途 {state.journeyIndex + 1}/{state.totalNodes}
        {journeyNode ? ` · ${journeyNode.label}` : ""}
      </p>
      {shopBody}
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
  const setDomPieceInspect = useUIStore((state) => state.setDomPieceInspect);

  if (phase !== "prep" || board.filter((piece) => piece.position === null).length === 0) {
    return null;
  }

  const unplaced = board.filter((piece) => piece.position === null);

  const selectedOnBench = unplaced.some((piece) => piece.id === selectedPieceId);

  return (
    <div className="pointer-events-none flex w-full justify-start">
      <div className="kepi-bench-float kepi-bench-float--side pointer-events-auto">
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
                piece.type === "shuike" ? (
                  <span className="kepi-piece-figure-badge kepi-piece-figure-badge-protect">
                    护信
                  </span>
                ) : piece.star > 1 ? (
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
