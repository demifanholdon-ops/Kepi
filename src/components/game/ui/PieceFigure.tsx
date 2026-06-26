"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { PIECE_VISUALS } from "@/lib/game/assets";
import { cn } from "@/lib/utils";
import type { PieceType } from "@/types";

type PieceFigureProps = {
  type: PieceType;
  height?: number;
  selected?: boolean;
  label?: string;
  badge?: ReactNode;
  variant?: "shop" | "bench";
  className?: string;
  onClick?: () => void;
  onInspectEnter?: (element: HTMLElement) => void;
  onInspectLeave?: () => void;
  testId?: string;
  testPieceId?: string;
};

export function PieceFigure({
  type,
  height = 84,
  selected = false,
  label,
  badge,
  variant = "shop",
  className,
  onClick,
  onInspectEnter,
  onInspectLeave,
  testId,
  testPieceId,
}: PieceFigureProps) {
  const visual = PIECE_VISUALS[type];
  const isBench = variant === "bench";

  const content = (
    <>
      <div
        className={cn(
          "kepi-piece-figure-ground",
          isBench && "kepi-piece-figure-ground-bench",
        )}
        aria-hidden
      />
      {selected ? (
        <div
          className={cn(
            "kepi-piece-figure-select-ring",
            isBench && "kepi-piece-figure-select-ring-bench",
          )}
          aria-hidden
        />
      ) : null}
      <Image
        src={visual.portrait}
        alt={visual.label}
        width={Math.round(height * 0.58)}
        height={height}
        className={cn(
          "kepi-piece-figure-sprite",
          isBench && !selected && "kepi-piece-figure-sprite-bench-idle",
          isBench && selected && "kepi-piece-figure-sprite-bench-active",
        )}
        draggable={false}
      />
      {badge}
      {label && !isBench ? (
        <span className="kepi-piece-figure-label">{label}</span>
      ) : null}
    </>
  );

  const sharedClass = cn(
    "kepi-piece-figure",
    isBench && "kepi-piece-figure-bench",
    selected && "kepi-piece-figure-selected",
    isBench && selected && "kepi-piece-figure-bench-selected",
    onClick && "kepi-piece-figure-interactive",
    className,
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={sharedClass}
        onClick={onClick}
        onMouseEnter={
          onInspectEnter
            ? (event) => onInspectEnter(event.currentTarget)
            : undefined
        }
        onMouseLeave={onInspectLeave}
        data-testid={testId}
        data-piece={type}
        data-piece-id={testPieceId}
        aria-label={visual.label}
        aria-pressed={selected}
      >
        {content}
      </button>
    );
  }

  return (
    <div className={sharedClass} data-piece={type}>
      {content}
    </div>
  );
}
