"use client";

import { useEffect, useRef } from "react";
import {
  BATTLE_TICK_MS,
  BATTLE_TICKS_PER_FRAME_CAP,
} from "@/engine/constants";
import { useGameStore } from "@/store/gameStore";

/** Drives real-time battle ticks synced to the display refresh rate. */
export function useBattleTicker(enabled: boolean): void {
  const battleAccumRef = useRef(0);
  const lastFrameMsRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      battleAccumRef.current = 0;
      lastFrameMsRef.current = 0;
      return;
    }

    let raf = 0;

    const frame = (now: number) => {
      const last = lastFrameMsRef.current || now;
      lastFrameMsRef.current = now;
      battleAccumRef.current += now - last;

      const dispatch = useGameStore.getState().dispatch;
      let steps = 0;

      while (
        battleAccumRef.current >= BATTLE_TICK_MS &&
        steps < BATTLE_TICKS_PER_FRAME_CAP
      ) {
        const current = useGameStore.getState().snapshot;
        if (current.phase !== "battle" || !current.battle || current.battle.finished) {
          battleAccumRef.current = 0;
          break;
        }

        dispatch({ type: "BATTLE_TICK" });
        battleAccumRef.current -= BATTLE_TICK_MS;
        steps += 1;
      }

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [enabled]);
}
