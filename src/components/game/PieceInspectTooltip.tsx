"use client";

import {
  clampInspectAnchor,
  inspectCardTransform,
  InspectCard,
} from "@/components/game/InspectCard";
import { useUIStore } from "@/store/uiStore";

export function PieceInspectTooltip() {
  const inspect = useUIStore((state) => state.domPieceInspect);
  if (!inspect) return null;

  const { x, anchorY, gap, placement } = clampInspectAnchor(
    inspect.anchorX,
    inspect.anchorY,
  );

  return (
    <div
      className="pointer-events-none fixed z-[45]"
      style={{
        left: x,
        top: anchorY,
        transform: inspectCardTransform(placement, gap),
      }}
      role="tooltip"
      aria-live="polite"
    >
      <InspectCard info={inspect.info} />
    </div>
  );
}
