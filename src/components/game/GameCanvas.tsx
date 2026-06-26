"use client";

import { useRef } from "react";
import type { BoardPosition, GameSnapshot } from "@/types";
import { useGameCanvas } from "./canvas/useGameCanvas";

type GameCanvasProps = {
  snapshot: GameSnapshot;
  selectedPieceId: string | null;
  onCellClick?: (position: BoardPosition) => void;
};

export function GameCanvas({
  snapshot,
  selectedPieceId,
  onCellClick,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useGameCanvas(canvasRef, { snapshot, selectedPieceId, onCellClick });

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      aria-label="客批棋盘"
    />
  );
}
