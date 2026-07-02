"use client";

import Image from "next/image";
import { ASSET_MANIFEST } from "@/data/assets";
import { JOURNEY, journeyNodeAt } from "@/data/journey";
import {
  isJourneyScrollCompact,
  journeyNodeIcon,
} from "@/lib/game/journeyUi";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { GameIcon, HudMetric } from "@/components/game/ui";
import { isPrepInteractive } from "@/lib/game/prepUi";

const UI = ASSET_MANIFEST.ui;

type JourneyScrollProps = {
  /** Stack in document flow instead of absolute overlay. */
  flow?: boolean;
};

export function JourneyScroll({ flow = false }: JourneyScrollProps) {
  const snapshot = useGameStore((state) => state.snapshot);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const { journeyIndex, totalNodes, kebi, kebiThreshold, survival } =
    snapshot.state;
  const phase = snapshot.phase;
  const isCompact = isJourneyScrollCompact(phase);
  const currentNode = journeyNodeAt(journeyIndex);
  const dimmed = phase === "prep" && !isPrepInteractive(prepSubview);

  return (
    <div
      className={cn(
        "pointer-events-none z-20 shrink-0",
        flow
          ? "relative px-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))]"
          : [
              "absolute inset-x-0",
              "top-[max(0.5rem,env(safe-area-inset-top))]",
              "px-[max(0.5rem,env(safe-area-inset-left))]",
              "pr-[max(0.5rem,env(safe-area-inset-right))]",
            ],
        dimmed && "opacity-45 transition-opacity duration-300",
      )}
    >
      <div
        className={cn(
          "kepi-journey-scroll pointer-events-auto relative mx-auto min-h-[4.25rem] overflow-hidden",
          isCompact ? "max-w-md" : "max-w-3xl",
        )}
      >
        <Image
          src={UI.journeyScrollBg}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 48rem"
        />

        <div
          className={cn(
            "relative flex flex-col gap-1.5",
            isCompact ? "px-2.5 py-1.5" : "px-3 py-2 sm:px-4 sm:py-2.5",
          )}
        >
          <div className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              {isCompact ? (
                <p className="truncate text-[0.6875rem] font-medium text-kepi-ink">
                  <span className="tabular-nums text-kepi-ink-muted">
                    归途 {journeyIndex + 1}/{totalNodes}
                  </span>
                  <span className="mx-1 text-kepi-ink/35" aria-hidden>
                    ·
                  </span>
                  <span>{currentNode?.label ?? "—"}</span>
                </p>
              ) : (
                <>
                  <p className="text-[0.6rem] leading-snug text-kepi-ink-muted">
                    {JOURNEY.label}
                  </p>
                  <p className="text-[0.6875rem] font-medium tabular-nums text-kepi-ink">
                    归途 {journeyIndex + 1}/{totalNodes}
                    {currentNode ? (
                      <span className="font-normal text-kepi-ink/80">
                        {" "}
                        · {currentNode.label}
                      </span>
                    ) : null}
                  </p>
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <HudMetric
                label="存续"
                value={String(survival)}
                icon={UI.survival}
                className="kepi-journey-metric hidden min-[380px]:flex"
              />
              <HudMetric
                label="客批"
                value={`${kebi}/${kebiThreshold}`}
                icon={UI.kebi}
                highlight={kebi >= kebiThreshold}
                className="kepi-journey-metric hidden min-[380px]:flex"
              />
              <button
                type="button"
                className="kepi-journey-settings rounded-md px-2 py-1 text-sm leading-none text-kepi-ink/85 transition hover:bg-kepi-ink/8"
                onClick={() => setSettingsOpen(true)}
                aria-label="设置"
              >
                ⚙
              </button>
            </div>
          </div>

          {!isCompact ? (
            <div
              className="kepi-journey-track flex items-center justify-between gap-0.5 px-0.5"
              role="list"
              aria-label="归乡路线"
            >
              {JOURNEY.nodes.map((node, index) => (
                <JourneyNodeMarker
                  key={node.id}
                  type={node.type}
                  done={index < journeyIndex}
                  current={index === journeyIndex}
                  label={node.label}
                />
              ))}
            </div>
          ) : null}

        </div>
      </div>
    </div>
  );
}

function JourneyNodeMarker({
  type,
  done,
  current,
  label,
}: {
  type: Parameters<typeof journeyNodeIcon>[0];
  done: boolean;
  current: boolean;
  label: string;
}) {
  const icon = journeyNodeIcon(type);

  return (
    <div
      role="listitem"
      className={cn(
        "kepi-journey-node relative flex flex-1 flex-col items-center gap-0.5",
        done && "kepi-journey-node--done",
        current && "kepi-journey-node--current",
      )}
      aria-current={current ? "step" : undefined}
      aria-label={label}
      title={label}
    >
      <div className="relative flex h-7 w-7 items-center justify-center sm:h-8 sm:w-8">
        <GameIcon
          src={icon}
          size={28}
          className={cn(
            "relative z-[1] transition-opacity",
            !done && !current && "opacity-45 grayscale-[0.35]",
          )}
        />
        {current ? (
          <Image
            src={UI.journeyNodeCurrent}
            alt=""
            width={36}
            height={36}
            className="kepi-journey-node-ring pointer-events-none absolute inset-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2 object-contain"
            aria-hidden
          />
        ) : null}
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
      {current ? (
        <span className="kepi-journey-node-label hidden max-w-[3.25rem] truncate text-center text-[0.5rem] leading-tight text-kepi-ink sm:block">
          {label}
        </span>
      ) : null}
    </div>
  );
}
