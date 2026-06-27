"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { spawnEnemiesForStage } from "@/engine/battle";
import {
  ENEMY_VISUALS,
  homeRepairThemeStage,
  PIECE_VISUALS,
} from "@/lib/game/assets";
import { computeBoardMetrics, pixelToBoard } from "@/lib/game/boardLayout";
import {
  buildAttackSlashes,
  collectNewAttackPulses,
  computeUnitCombatVisuals,
  pruneAttackPulses,
  type AttackPulse,
} from "@/lib/game/battleAnim";
import { combatUnitsFromSnapshot } from "@/lib/game/combatUnits";
import { loadCachedImage } from "@/lib/game/imageCache";
import {
  TULOU_BACKGROUND_SRCS,
  tulouRepairStageForValue,
} from "@/lib/game/tulouBackground";
import { TULOU_BOARD_ASSETS } from "@/lib/game/assets";
import type { BoardPosition, Enemy, GameSnapshot, Piece } from "@/types";
import { hitTestUnits } from "@/lib/game/unitHitTest";
import {
  resolveAllyBoardPosition,
  resolveEnemyBoardPosition,
  tooltipAnchorFromSprite,
  unitSpriteMetrics,
} from "@/lib/game/unitLayout";
import { useFxStore } from "@/store/fxStore";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { buildBattleEffects, renderGameCanvas } from "./renderFrame";
import { SCENE_EFFECT_SRCS } from "./renderAtmosphere";
import { PREP_FX_SRCS } from "./renderPrepFx";
import type { CanvasRenderState } from "./types";

const AMBIENT_FPS = 30;

type UseGameCanvasOptions = {
  snapshot: GameSnapshot;
  selectedPieceId: string | null;
  onCellClick?: (position: BoardPosition) => void;
  onUnitClick?: (pieceId: string) => void;
};

export function useGameCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { snapshot, selectedPieceId, onCellClick, onUnitClick }: UseGameCanvasOptions,
) {
  const snapshotKebi = snapshot.state.kebi;
  const homeRepair = snapshot.state.homeRepair;
  const imageCache = useRef(new Map<string, HTMLImageElement | "loading" | "error">());
  const portraitCache = useRef(new Map<string, HTMLImageElement | "loading" | "error">());
  const snapshotRef = useRef(snapshot);
  const selectedRef = useRef(selectedPieceId);
  const paintRef = useRef<() => void>(() => {});
  const timeMsRef = useRef(0);
  const attackPulsesRef = useRef<AttackPulse[]>([]);
  const lastEventCountRef = useRef(0);
  const lastKebiFxRef = useRef(snapshot.state.kebi);
  const prepFxRef = useRef(useFxStore.getState().prepFx);
  const hoveredTargetRef = useRef<{ side: "ally" | "enemy"; unitId: string } | null>(
    null,
  );
  const hoveredAllyCellRef = useRef<BoardPosition | null>(null);
  const lastHoveredCellKeyRef = useRef("");

  const setHoveredAllyCell = (cell: BoardPosition | null) => {
    const key = cell ? `${cell.x},${cell.y}` : "";
    if (key === lastHoveredCellKeyRef.current) return;
    lastHoveredCellKeyRef.current = key;
    hoveredAllyCellRef.current = cell;
    paintRef.current();
  };

  useEffect(() => {
    return useFxStore.subscribe((state) => {
      prepFxRef.current = state.prepFx;
      paintRef.current();
    });
  }, []);

  useEffect(() => {
    let lastHoverKey = "";
    return useUIStore.subscribe((state) => {
      const hover = state.hoveredUnit;
      const nextTarget = hover ? { side: hover.side, unitId: hover.unitId } : null;
      const nextKey = nextTarget ? `${nextTarget.side}:${nextTarget.unitId}` : "";
      hoveredTargetRef.current = nextTarget;
      if (nextKey !== lastHoverKey) {
        lastHoverKey = nextKey;
        paintRef.current();
      }
    });
  }, []);

  useEffect(() => {
    snapshotRef.current = snapshot;
    selectedRef.current = selectedPieceId;
    if (!selectedPieceId) {
      setHoveredAllyCell(null);
    }
  }, [snapshot, selectedPieceId]);

  useEffect(() => {
    if (snapshot.phase === "battle" && snapshot.battle?.tick === 0) {
      attackPulsesRef.current = [];
      lastEventCountRef.current = 0;
    }
    if (snapshot.phase !== "battle" && snapshot.phase !== "settlement") {
      attackPulsesRef.current = [];
      lastEventCountRef.current = 0;
    }
  }, [snapshot.phase, snapshot.battle?.tick]);

  useEffect(() => {
    const events = snapshot.battle?.events ?? [];
    if (events.length > lastEventCountRef.current) {
      const now = performance.now();
      attackPulsesRef.current.push(
        ...collectNewAttackPulses(events, lastEventCountRef.current, now),
      );
      lastEventCountRef.current = events.length;
    }
  }, [snapshot.battle?.events]);

  useEffect(() => {
    const settlement = snapshot.settlement;
    const won =
      snapshot.phase === "settlement" && (snapshot.lastBattleResult?.won ?? false);
    if (won && settlement && snapshotKebi > lastKebiFxRef.current) {
      playSettlementSfx(settlement.homeRepairGained > 0);
    }
    lastKebiFxRef.current = snapshotKebi;
  }, [snapshotKebi, snapshot.phase, snapshot.lastBattleResult, snapshot.settlement]);

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const now = performance.now();
    const current = useGameStore.getState().snapshot;
    snapshotRef.current = current;
    const metrics = computeBoardMetrics(rect.width, rect.height);
    const tulouStage = homeRepairThemeStage(current.state.homeRepair);
    const { allies, enemies } = combatUnitsFromSnapshot(current);
    const battleEvents =
      current.battle?.events ?? current.lastBattleResult?.events ?? [];
    const battleTick = battleEvents.length;
    const inCombatView =
      current.phase === "battle" || current.phase === "settlement";

    attackPulsesRef.current = pruneAttackPulses(attackPulsesRef.current, now);
    const { motionPx, hitFlash } = inCombatView
      ? computeUnitCombatVisuals(
          attackPulsesRef.current,
          now,
          allies,
          enemies,
          metrics,
        )
      : { motionPx: {}, hitFlash: {} };
    const attackSlashes = inCombatView
      ? buildAttackSlashes(
          attackPulsesRef.current,
          now,
          allies,
          enemies,
          metrics,
        )
      : [];

    const effects = buildBattleEffects(
      battleEvents,
      battleTick,
      allies,
      enemies,
    );

    useFxStore.getState().prunePrepFx(now);

    const state: CanvasRenderState = {
      metrics,
      phase: current.phase,
      tulouStage,
      homeRepair: current.state.homeRepair,
      allies,
      enemies,
      hoveredAllyCell: hoveredAllyCellRef.current,
      selectedPieceId: selectedRef.current,
      battleEvents,
      battleTick,
      lastBattleWon:
        current.phase === "settlement"
          ? (current.lastBattleResult?.won ?? null)
          : null,
      effects,
      attackSlashes,
      unitMotionPx: motionPx,
      hitFlash,
      timeMs: timeMsRef.current || now,
      prepFx: prepFxRef.current,
      hoveredUnit: hoveredTargetRef.current,
      imageCache: imageCache.current,
      portraitCache: portraitCache.current,
      requestRepaint: () => paintRef.current(),
    };

    renderGameCanvas(ctx, state);
  }, [canvasRef, homeRepair]);

  useEffect(() => {
    paintRef.current = paint;
  }, [paint]);

  useEffect(() => {
    paint();
  }, [snapshot, selectedPieceId, paint]);

  const preloadTulouStage = useCallback((repair: number) => {
    const onLoad = () => paintRef.current();
    const stageSrc = tulouRepairStageForValue(repair).src;
    loadCachedImage(imageCache.current, stageSrc, onLoad, { retryOnError: true });
    paintRef.current();
  }, []);

  useLayoutEffect(() => {
    preloadTulouStage(homeRepair);
  }, [homeRepair, preloadTulouStage]);

  useEffect(() => {
    let prevRepair = useGameStore.getState().snapshot.state.homeRepair;
    return useGameStore.subscribe((store) => {
      const nextRepair = store.snapshot.state.homeRepair;
      if (nextRepair === prevRepair) return;
      prevRepair = nextRepair;
      preloadTulouStage(nextRepair);
    });
  }, [preloadTulouStage]);

  useEffect(() => {
    const onLoad = () => paintRef.current();
    const cache = imageCache.current;

    loadCachedImage(cache, TULOU_BOARD_ASSETS.stage1, onLoad, { retryOnError: true });
    for (const src of TULOU_BACKGROUND_SRCS) {
      loadCachedImage(cache, src, onLoad, { retryOnError: true });
    }
    for (const src of SCENE_EFFECT_SRCS) {
      loadCachedImage(cache, src, onLoad);
    }
    for (const src of PREP_FX_SRCS) {
      loadCachedImage(cache, src, onLoad);
    }
  }, []);

  useEffect(() => {
    const current = snapshotRef.current;
    const onLoad = () => paintRef.current();
    const cache = portraitCache.current;

    for (const piece of current.board) {
      const meta = PIECE_VISUALS[piece.type];
      loadCachedImage(cache, meta.portrait, onLoad);
    }

    const showEnemies =
      current.phase === "prep" ||
      current.phase === "battle" ||
      current.phase === "settlement";
    if (showEnemies) {
      const enemies = spawnEnemiesForStage(current.state.stage);
      for (const enemy of enemies) {
        const meta = ENEMY_VISUALS[enemy.type];
        loadCachedImage(cache, meta.portrait, onLoad);
      }
    }
  }, [snapshot.board, snapshot.phase, snapshot.state.stage]);

  useEffect(() => {
    let raf = 0;
    let lastPaint = 0;
    const frameMs = 1000 / AMBIENT_FPS;

    const tick = (now: number) => {
      timeMsRef.current = now;

      snapshotRef.current = useGameStore.getState().snapshot;

      const current = snapshotRef.current;
      const battleActive =
        current.phase === "battle" &&
        Boolean(current.battle) &&
        !current.battle!.finished;

      const needsAmbient =
        battleActive ||
        current.phase === "battle" ||
        current.phase === "settlement" ||
        prepFxRef.current.length > 0 ||
        (current.phase === "prep" &&
          Boolean(selectedRef.current) &&
          hoveredAllyCellRef.current !== null);

      const shouldPaint = needsAmbient || now - lastPaint >= frameMs;

      if (shouldPaint) {
        paintRef.current();
        lastPaint = now;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (snapshot.phase === "battle") {
      useFxStore.getState().clearPrepFx();
    }
    useUIStore.getState().setHoveredUnit(null);
  }, [snapshot.phase]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updatePointer = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const current = snapshotRef.current;
      const metrics = computeBoardMetrics(rect.width, rect.height);
      const { allies, enemies } = combatUnitsFromSnapshot(current);

      const placing =
        current.phase === "prep" && Boolean(selectedRef.current);

      if (placing) {
        const allyCell = pixelToBoard(x, y, metrics, true);
        setHoveredAllyCell(allyCell);
        if (allyCell) {
          canvas.style.cursor = "pointer";
          useUIStore.getState().setHoveredUnit(null);
          return;
        }
      } else {
        setHoveredAllyCell(null);
      }

      const hit = hitTestUnits(
        x,
        y,
        metrics,
        allies,
        enemies,
        current.phase,
        { skipAllies: placing },
      );

      if (!hit) {
        canvas.style.cursor = placing ? "default" : "";
        useUIStore.getState().setHoveredUnit(null);
        return;
      }

      canvas.style.cursor = "pointer";
      let position;
      if (hit.side === "ally") {
        const allyIndex = allies.findIndex((piece) => piece.id === hit.id);
        const piece = allies[allyIndex];
        if (!piece) return;
        position = resolveAllyBoardPosition(piece, allyIndex);
      } else {
        const enemyIndex = enemies.findIndex((enemy) => enemy.id === hit.id);
        const enemy = enemies[enemyIndex];
        if (!enemy) return;
        position = resolveEnemyBoardPosition(enemy, enemyIndex, enemies.length);
      }
      const anchor = tooltipAnchorFromSprite(
        unitSpriteMetrics(position, metrics),
        rect,
      );

      useUIStore.getState().setHoveredUnit({
        side: hit.side,
        unitId: hit.id,
        anchorX: anchor.anchorX,
        anchorY: anchor.anchorY,
      });
    };

    const handleMove = (event: MouseEvent) => {
      updatePointer(event.clientX, event.clientY);
    };

    const handleLeave = () => {
      canvas.style.cursor = "";
      setHoveredAllyCell(null);
      useUIStore.getState().setHoveredUnit(null);
    };

    canvas.addEventListener("mousemove", handleMove);
    canvas.addEventListener("mouseleave", handleLeave);
    return () => {
      canvas.removeEventListener("mousemove", handleMove);
      canvas.removeEventListener("mouseleave", handleLeave);
      canvas.style.cursor = "";
    };
  }, [canvasRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new ResizeObserver(() => paint());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [canvasRef, paint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onCellClick) return;

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const metrics = computeBoardMetrics(rect.width, rect.height);
      const current = snapshotRef.current;

      if (current.phase !== "prep") return;

      const enemies = spawnEnemiesForStage(current.state.stage);
      const selectedId = selectedRef.current;

      if (selectedId) {
        const hit = hitTestUnits(
          x,
          y,
          metrics,
          current.board,
          enemies,
          current.phase,
        );
        if (hit?.side === "ally" && hit.id !== selectedId) {
          onUnitClick?.(hit.id);
          return;
        }

        const cell = pixelToBoard(x, y, metrics, true);
        if (cell) {
          onCellClick?.(cell);
          return;
        }
        return;
      }

      const hit = hitTestUnits(
        x,
        y,
        metrics,
        current.board,
        enemies,
        current.phase,
      );
      if (hit?.side === "ally") {
        onUnitClick?.(hit.id);
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [canvasRef, onCellClick, onUnitClick]);
}

function playSettlementSfx(playRepair: boolean): void {
  if (typeof window === "undefined") return;

  const collect = new Audio(ASSET_MANIFEST.audio.sfxCollectLetter);
  collect.volume = 0.72;
  void collect.play().catch(() => undefined);

  if (!playRepair) return;
  window.setTimeout(() => {
    const repair = new Audio(ASSET_MANIFEST.audio.sfxRepairHome);
    repair.volume = 0.64;
    void repair.play().catch(() => undefined);
  }, 650);
}
