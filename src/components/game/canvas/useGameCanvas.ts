"use client";

import { useCallback, useEffect, useRef } from "react";
import { spawnEnemiesForStage } from "@/engine/battle";
import { homeRepairStage } from "@/engine/progression";
import { ENEMY_VISUALS, PIECE_VISUALS } from "@/lib/game/assets";
import { computeBoardMetrics, pixelToBoard } from "@/lib/game/boardLayout";
import { loadCachedImage } from "@/lib/game/imageCache";
import {
  TULOU_BACKGROUND_SRCS,
  transitionBurstForCrossing,
} from "@/lib/game/tulouBackground";
import type { BoardPosition, GameSnapshot } from "@/types";
import { buildBattleEffects, renderGameCanvas } from "./renderFrame";
import { SCENE_EFFECT_SRCS } from "./renderAtmosphere";
import { PREP_FX_SRCS } from "./renderPrepFx";
import type { CanvasRenderState } from "./types";
import { useFxStore } from "@/store/fxStore";

const AMBIENT_FPS = 24;
const TRANSITION_BURST_MS = 450;

type ActiveBurst = {
  src: string;
  startMs: number;
  durationMs: number;
};

type UseGameCanvasOptions = {
  snapshot: GameSnapshot;
  selectedPieceId: string | null;
  onCellClick?: (position: BoardPosition) => void;
};

export function useGameCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  { snapshot, selectedPieceId, onCellClick }: UseGameCanvasOptions,
) {
  const imageCache = useRef(new Map<string, HTMLImageElement | "loading" | "error">());
  const portraitCache = useRef(new Map<string, HTMLImageElement | "loading" | "error">());
  const battleTickRef = useRef(0);
  const battleFrameRef = useRef(0);
  const snapshotRef = useRef(snapshot);
  const selectedRef = useRef(selectedPieceId);
  const paintRef = useRef<() => void>(() => {});
  const timeMsRef = useRef(0);
  const burstRef = useRef<ActiveBurst | null>(null);
  const prevHomeRepairRef = useRef(snapshot.state.homeRepair);
  const lastKebiFxRef = useRef(snapshot.state.kebi);
  const prepFxRef = useRef(useFxStore.getState().prepFx);

  useEffect(() => {
    return useFxStore.subscribe((state) => {
      prepFxRef.current = state.prepFx;
      paintRef.current();
    });
  }, []);

  useEffect(() => {
    snapshotRef.current = snapshot;
    selectedRef.current = selectedPieceId;
  }, [snapshot, selectedPieceId]);

  useEffect(() => {
    const prev = prevHomeRepairRef.current;
    const next = snapshot.state.homeRepair;
    const burstSrc = transitionBurstForCrossing(prev, next);
    if (burstSrc) {
      burstRef.current = {
        src: burstSrc,
        startMs: performance.now(),
        durationMs: TRANSITION_BURST_MS,
      };
    }
    prevHomeRepairRef.current = next;
  }, [snapshot.state.homeRepair]);

  useEffect(() => {
    const { kebi } = snapshot.state;
    const won =
      snapshot.phase === "settlement" && (snapshot.lastBattleResult?.won ?? false);

    if (won && kebi > lastKebiFxRef.current) {
      useFxStore.getState().pushPrepFx({
        kind: "letter_pickup",
        xRatio: 0.11,
        yRatio: 0.13,
        durationMs: 1400,
      });
    }
    lastKebiFxRef.current = kebi;
  }, [snapshot.state.kebi, snapshot.phase, snapshot.lastBattleResult]);

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
    const current = snapshotRef.current;
    const metrics = computeBoardMetrics(rect.width, rect.height);
    const tulouStage = homeRepairStage(current.state.homeRepair);
    const enemies =
      current.phase === "prep" ||
      current.phase === "battle" ||
      current.phase === "settlement"
        ? spawnEnemiesForStage(current.state.stage)
        : [];

    const battleEvents = current.lastBattleResult?.events ?? [];
    const effects = buildBattleEffects(
      battleEvents,
      battleTickRef.current,
      current.board,
      enemies,
    );

    const burst = burstRef.current;
    const transitionBurst =
      burst && now - burst.startMs < burst.durationMs
        ? {
            src: burst.src,
            progress: Math.min(1, (now - burst.startMs) / burst.durationMs),
          }
        : null;

    if (burst && !transitionBurst) {
      burstRef.current = null;
    }

    useFxStore.getState().prunePrepFx(now);

    const state: CanvasRenderState = {
      metrics,
      phase: current.phase,
      tulouStage,
      homeRepair: current.state.homeRepair,
      allies: current.board,
      enemies,
      allyCellsHighlighted: current.phase === "prep" && Boolean(selectedRef.current),
      selectedPieceId: selectedRef.current,
      battleEvents,
      battleTick: battleTickRef.current,
      lastBattleWon:
        current.phase === "settlement"
          ? (current.lastBattleResult?.won ?? null)
          : null,
      effects,
      timeMs: timeMsRef.current || now,
      transitionBurst,
      prepFx: prepFxRef.current,
      imageCache: imageCache.current,
      portraitCache: portraitCache.current,
      requestRepaint: () => paintRef.current(),
    };

    renderGameCanvas(ctx, state);
  }, [canvasRef]);

  useEffect(() => {
    paintRef.current = paint;
  }, [paint]);

  useEffect(() => {
    battleTickRef.current = 0;
    battleFrameRef.current = 0;
    paint();
  }, [snapshot, selectedPieceId, paint]);

  useEffect(() => {
    const onLoad = () => paintRef.current();
    const cache = imageCache.current;

    for (const src of TULOU_BACKGROUND_SRCS) {
      loadCachedImage(cache, src, onLoad);
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

      const battleResult = snapshotRef.current.lastBattleResult;
      const battleAnimating =
        snapshotRef.current.phase === "battle" &&
        Boolean(battleResult) &&
        battleTickRef.current < battleResult!.events.length;

      if (battleAnimating) {
        battleFrameRef.current += 1;
        if (battleFrameRef.current % 3 === 0) {
          battleTickRef.current += 1;
        }
      }

      const burstActive =
        burstRef.current !== null &&
        now - burstRef.current.startMs < burstRef.current.durationMs;

      const needsAmbient =
        burstActive ||
        battleAnimating ||
        snapshotRef.current.phase === "battle" ||
        snapshotRef.current.phase === "settlement" ||
        prepFxRef.current.length > 0;

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
    if (snapshot.phase !== "battle") {
      battleFrameRef.current = 0;
    }
  }, [snapshot.phase]);

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
      const cell = pixelToBoard(x, y, metrics, snapshotRef.current.phase === "prep");
      if (cell) onCellClick(cell);
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [canvasRef, onCellClick]);
}
