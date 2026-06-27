"use client";

import {
  clampInspectAnchor,
  inspectCardTransform,
  InspectCard,
} from "@/components/game/InspectCard";
import { inspectAlly, inspectEnemy } from "@/lib/game/unitInspect";
import { combatUnitsFromSnapshot } from "@/lib/game/combatUnits";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";

export function UnitInspectOverlay() {
  const hoveredUnit = useUIStore((state) => state.hoveredUnit);
  const snapshot = useGameStore((state) => state.snapshot);
  const selectedPieceId = useGameStore((state) => state.selectedPieceId);

  if (!hoveredUnit) return null;

  const { phase } = snapshot;

  if (phase === "prep" && selectedPieceId && hoveredUnit.side === "ally") {
    return null;
  }

  const { allies, enemies } = combatUnitsFromSnapshot(snapshot);
  let info = null;

  if (hoveredUnit.side === "ally") {
    const piece = allies.find((entry) => entry.id === hoveredUnit.unitId);
    if (piece) info = inspectAlly(piece, phase);
  } else {
    const enemy = enemies.find((entry) => entry.id === hoveredUnit.unitId);
    if (enemy) info = inspectEnemy(enemy, phase);
  }

  if (!info) return null;

  const { x, anchorY, gap, placement } = clampInspectAnchor(
    hoveredUnit.anchorX,
    hoveredUnit.anchorY,
  );

  return (
    <div
      className="pointer-events-none fixed z-40"
      style={{
        left: x,
        top: anchorY,
        transform: inspectCardTransform(placement, gap),
      }}
      role="tooltip"
      aria-live="polite"
    >
      <InspectCard info={info} />
    </div>
  );
}
