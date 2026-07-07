"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { spawnEnemiesForStage } from "@/engine/battle";
import {
  playTulouBattleStartSfx,
  playTulouCheatDeathSfx,
  playWaterGuestBreathSfx,
  playWaterGuestDeathSfx,
  playWaterGuestHeartbeatSfx,
} from "@/lib/audio/battleSfx";
import {
  playHitSfx,
  playEnemyAttackSfx,
  playSkillSfx,
  playLeafFallSfx,
  playWinSfx,
  playLoseSfx,
  playCollectLetterSfx,
  playRepairHomeSfx,
} from "@/lib/audio/sfx";
import {
  ENEMY_VISUALS,
  homeRepairThemeStage,
  PIECE_VISUALS,
} from "@/lib/game/assets";
import {
  computeBoardMetrics,
  boardMetricsOptionsForPhase,
  pixelToBoard,
} from "@/lib/game/boardLayout";
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
  tulouExteriorForRepair,
} from "@/lib/game/tulouBackground";
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
  const lastTulouStartTierRef = useRef<number | null>(null);
  const waterGuestDeathFlashAtRef = useRef<number | null>(null);
  const lastWaterGuestCrisisRef = useRef<0 | 1 | 2>(0);
  const lastLeafFallSfxAtRef = useRef(0);
  const lastResultSfxRef = useRef("");
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
    let lastDockExpanded = useUIStore.getState().prepDockExpanded;
    return useUIStore.subscribe((state) => {
      if (state.prepDockExpanded !== lastDockExpanded) {
        lastDockExpanded = state.prepDockExpanded;
        paintRef.current();
      }
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
      waterGuestDeathFlashAtRef.current = null;
      lastWaterGuestCrisisRef.current = 0;
      const tier = snapshot.battle.tulouBuffs?.tier ?? snapshot.state.homeRepairTier;
      if (lastTulouStartTierRef.current !== tier) {
        playTulouBattleStartSfx(tier);
        lastTulouStartTierRef.current = tier;
      }
    }
    if (snapshot.phase !== "battle" && snapshot.phase !== "settlement") {
      attackPulsesRef.current = [];
      lastEventCountRef.current = 0;
      waterGuestDeathFlashAtRef.current = null;
      lastWaterGuestCrisisRef.current = 0;
      lastTulouStartTierRef.current = null;
    }
  }, [snapshot.phase, snapshot.battle?.tick, snapshot.battle?.tulouBuffs?.tier, snapshot.state.homeRepairTier]);

  useEffect(() => {
    const events = snapshot.battle?.events ?? [];
    if (events.length > lastEventCountRef.current) {
      const now = performance.now();
      attackPulsesRef.current.push(
        ...collectNewAttackPulses(events, lastEventCountRef.current, now),
      );

      const shuikeId = snapshot.battle?.waterGuest.pieceId;
      const enemies = snapshot.battle?.enemies ?? [];
      for (let i = lastEventCountRef.current; i < events.length; i += 1) {
        const event = events[i];
        if (!event) continue;

        if (event.type === "attack") {
          // sourceId 为敌方 → 播放该敌人专属攻击音色；否则通用受击音
          const attacker = enemies.find((e) => e.id === event.sourceId);
          if (attacker) {
            playEnemyAttackSfx(attacker.type, event.damage);
          } else {
            playHitSfx(event.damage);
          }
        } else if (event.type === "leafFallStart") {
          if (now - lastLeafFallSfxAtRef.current > 600) {
            lastLeafFallSfxAtRef.current = now;
            playLeafFallSfx();
          }
        } else if (
          event.type === "skill" &&
          event.skillId !== "tulou_cheat_death"
        ) {
          playSkillSfx();
        }

        if (
          event.type === "skill" &&
          event.skillId === "tulou_cheat_death"
        ) {
          playTulouCheatDeathSfx();
        }

        if (
          shuikeId &&
          event.type === "kill" &&
          event.unitId === shuikeId
        ) {
          waterGuestDeathFlashAtRef.current = now;
          playWaterGuestDeathSfx();
        }
      }

      lastEventCountRef.current = events.length;
    }
  }, [snapshot.battle?.events, snapshot.battle?.waterGuest.pieceId]);

  useEffect(() => {
    const settlement = snapshot.settlement;
    const result = snapshot.lastBattleResult;
    const isSettlement = snapshot.phase === "settlement";
    const won = isSettlement && (result?.won ?? false);

    if (isSettlement && result) {
      const resultKey = `${snapshot.state.stage}:${result.won}`;
      if (resultKey !== lastResultSfxRef.current) {
        lastResultSfxRef.current = resultKey;
        if (won) playWinSfx();
        else playLoseSfx();
      }
    }

    if (won && settlement && snapshotKebi > lastKebiFxRef.current) {
      playCollectLetterSfx();
      if (settlement.homeRepairGained > 0) {
        window.setTimeout(() => playRepairHomeSfx(), 650);
      }
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
    const metrics = computeBoardMetrics(
      rect.width,
      rect.height,
      boardMetricsOptionsForPhase(current.phase, useUIStore.getState().prepDockExpanded),
    );
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

    const waterGuestCrisisLevel = resolveWaterGuestCrisisLevel(
      current.phase,
      allies,
      current.battle?.waterGuest.pieceId,
    );
    if (
      current.phase === "battle" &&
      waterGuestCrisisLevel !== lastWaterGuestCrisisRef.current
    ) {
      if (waterGuestCrisisLevel === 1) playWaterGuestBreathSfx();
      if (waterGuestCrisisLevel === 2) playWaterGuestHeartbeatSfx();
      lastWaterGuestCrisisRef.current = waterGuestCrisisLevel;
    }

    const flashStarted = waterGuestDeathFlashAtRef.current;
    const waterGuestDeathFlash =
      flashStarted === null ? 0 : Math.max(0, 1 - (now - flashStarted) / 500);

    const state: CanvasRenderState = {
      metrics,
      phase: current.phase,
      stage: current.state.stage,
      tulouStage,
      homeRepair: current.state.homeRepair,
      homeRepairTier:
        current.battle?.tulouBuffs.tier ?? current.state.homeRepairTier,
      tulouShieldHp: current.battle?.tulouBuffs.shieldHp ?? {},
      tulouCheatDeathAvailable: current.battle?.tulouBuffs.cheatDeathAvailable ?? [],
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
      waterGuestCrisisLevel,
      waterGuestDeathFlash,
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
    loadCachedImage(imageCache.current, tulouExteriorForRepair(repair), onLoad, {
      retryOnError: true,
    });
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

    loadCachedImage(cache, TULOU_BACKGROUND_SRCS[0], onLoad, { retryOnError: true });
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
      const enemies = spawnEnemiesForStage(current.state.stage, current.board);
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
        (current.phase === "prep" && Boolean(selectedRef.current));

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
      const metrics = computeBoardMetrics(
        rect.width,
        rect.height,
        boardMetricsOptionsForPhase(current.phase, useUIStore.getState().prepDockExpanded),
      );
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
      const current = snapshotRef.current;
      const metrics = computeBoardMetrics(
        rect.width,
        rect.height,
        boardMetricsOptionsForPhase(current.phase, useUIStore.getState().prepDockExpanded),
      );

      if (current.phase !== "prep") return;

      const enemies = spawnEnemiesForStage(current.state.stage, current.board);
      const selectedId = selectedRef.current;

      if (selectedId) {
        // Match hover: resolve the grid cell first. Back-row unit hitboxes extend
        // into the front row, so hitTestUnits would steal clicks meant for placement.
        const cell = pixelToBoard(x, y, metrics, true);
        if (cell) {
          const occupant = current.board.find(
            (piece) =>
              piece.position !== null &&
              piece.position.x === cell.x &&
              piece.position.y === cell.y &&
              piece.id !== selectedId,
          );
          if (occupant) {
            onUnitClick?.(occupant.id);
            return;
          }
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

function resolveWaterGuestCrisisLevel(
  phase: GameSnapshot["phase"],
  allies: Piece[],
  pieceId: string | null | undefined,
): 0 | 1 | 2 {
  if (phase !== "battle" || !pieceId) return 0;
  const shuike = allies.find((piece) => piece.id === pieceId);
  if (!shuike || shuike.hp <= 0) return 0;
  const ratio = shuike.hp / shuike.maxHp;
  if (ratio <= 0.3) return 2;
  if (ratio <= 0.5) return 1;
  return 0;
}
