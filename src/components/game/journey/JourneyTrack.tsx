"use client";

import Image from "next/image";
import { ASSET_MANIFEST } from "@/data/assets";
import { JOURNEY } from "@/data/journey";
import { journeyNodeIconForNode } from "@/lib/game/journeyUi";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function JourneyNodeTrack({
  journeyIndex,
  compact = false,
}: {
  journeyIndex: number;
  compact?: boolean;
}) {
  if (compact) return null;

  return (
    <div
      className="kepi-journey-track flex items-center justify-between gap-0.5 overflow-x-auto px-0.5"
      role="list"
      aria-label="归乡路线"
    >
      {JOURNEY.nodes.map((node, index) => (
        <JourneyNodeMarker
          key={node.id}
          nodeId={node.id}
          type={node.type}
          done={index < journeyIndex}
          current={index === journeyIndex}
          label={node.label}
        />
      ))}
    </div>
  );
}

export function JourneyNodeTrackVertical({ journeyIndex }: { journeyIndex: number }) {
  return (
    <div
      className="kepi-journey-track-vertical flex w-full flex-col items-stretch gap-0.5 py-0.5"
      role="list"
      aria-label="归乡路线"
    >
      {JOURNEY.nodes.map((node, index) => (
        <JourneyNodeMarker
          key={node.id}
          nodeId={node.id}
          type={node.type}
          done={index < journeyIndex}
          current={index === journeyIndex}
          label={node.label}
          vertical
        />
      ))}
    </div>
  );
}

function JourneyNodeMarker({
  nodeId,
  type,
  done,
  current,
  label,
  vertical = false,
}: {
  nodeId: string;
  type: Parameters<typeof journeyNodeIconForNode>[0]["type"];
  done: boolean;
  current: boolean;
  label: string;
  vertical?: boolean;
}) {
  const icon = journeyNodeIconForNode({ id: nodeId, type });

  return (
    <div
      role="listitem"
      className={cn(
        "kepi-journey-node relative flex shrink-0 gap-0.5",
        vertical
          ? "min-h-[2rem] w-full items-center px-0.5"
          : "min-w-[2rem] flex-1 flex-col items-center",
        done && "kepi-journey-node--done",
        current && "kepi-journey-node--current",
      )}
      aria-current={current ? "step" : undefined}
      aria-label={label}
      title={label}
    >
      <div
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          vertical ? "h-8 w-8" : "h-7 w-7 sm:h-8 sm:w-8",
        )}
      >
        {current ? (
          <div
            className="kepi-journey-node-ring pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden
          >
            {/* Decorative ring — native img avoids Next/Image wrapper offset */}
            <img src={UI.journeyNodeCurrent} alt="" width={36} height={36} />
          </div>
        ) : null}
        <GameIcon
          src={icon}
          size={vertical ? 24 : 28}
          className={cn(
            "relative z-[1] transition-opacity",
            !done && !current && "opacity-45 grayscale-[0.35]",
          )}
        />
        {done ? (
          <Image
            src={UI.journeyNodeDone}
            alt=""
            width={14}
            height={14}
            className="pointer-events-none absolute -right-0.5 -top-0.5 z-[2] object-contain"
            aria-hidden
          />
        ) : null}
      </div>
      {vertical ? (
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left text-[0.5rem] leading-tight sm:text-[0.5625rem]",
            current
              ? "font-semibold text-kepi-ink"
              : done
                ? "text-kepi-ink-muted"
                : "text-kepi-ink/45",
          )}
        >
          {label}
        </span>
      ) : current ? (
        <span className="kepi-journey-node-label hidden max-w-[3.25rem] truncate text-center text-[0.5rem] leading-tight text-kepi-ink sm:block">
          {label}
        </span>
      ) : null}
    </div>
  );
}

