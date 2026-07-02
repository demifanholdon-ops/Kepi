"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import { JOURNEY, journeyNodeAt } from "@/data/journey";
import {
  letterStripNeedsHint,
  letterStripNarrative,
} from "@/lib/game/letterNarrative";
import { isPrepInteractive } from "@/lib/game/prepUi";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";
import { JourneyNodeTrack } from "@/components/game/journey/JourneyTrack";

const UI = ASSET_MANIFEST.ui;

type JourneyCommandBarProps = {
  dimmed?: boolean;
};

export function JourneyCommandBar({ dimmed = false }: JourneyCommandBarProps) {
  const snapshot = useGameStore((state) => state.snapshot);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);
  const supportOpen = useUIStore((state) => state.supportPopoverOpen);
  const setSupportOpen = useUIStore((state) => state.setSupportPopoverOpen);
  const { state, board, phase } = snapshot;
  const settlement = snapshot.settlement;
  const currentNode = journeyNodeAt(state.journeyIndex);

  const shuikeOnBoard = board.filter((piece) => piece.type === "shuike");
  const xiangxianOnBoard = board.filter((piece) => piece.type === "xiangxian");
  const needsHint = letterStripNeedsHint({
    stage: state.stage,
    journeyIndex: state.journeyIndex,
    board,
    shuikeOnBoard,
    xiangxianOnBoard,
  });
  const narrative = letterStripNarrative({
    phase,
    stage: state.stage,
    journeyIndex: state.journeyIndex,
    currentNodeId: state.currentNodeId,
    nextBattleEnemyHpFactor: state.nextBattleEnemyHpFactor,
    kebi: state.kebi,
    kebiThreshold: state.kebiThreshold,
    board,
    shuikeOnBoard,
    xiangxianOnBoard,
    winStreak: state.winStreak,
    loseStreak: state.loseStreak,
    settlement,
  });
  const kebiReady = state.kebi >= state.kebiThreshold;

  return (
    <div
      className={cn(
        "kepi-journey-command pointer-events-none relative z-20 shrink-0 px-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))]",
        dimmed && "opacity-45 transition-opacity duration-300",
      )}
    >
      <WoodPanel
        className="kepi-journey-command-panel pointer-events-auto mx-auto w-full max-w-6xl"
        innerClassName="px-3 py-2 sm:px-4 sm:py-2.5"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <div className="min-w-0 flex-1">
            <p className="text-[0.6rem] leading-snug text-kepi-ink-muted">{JOURNEY.label}</p>
            <p className="text-[0.75rem] font-semibold tabular-nums text-kepi-ink">
              归途 {state.journeyIndex + 1}/{state.totalNodes}
              {currentNode ? (
                <span className="font-normal text-kepi-ink/80"> · {currentNode.label}</span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[0.625rem] tabular-nums">
            <MetricChip
              icon={UI.kebi}
              value={`${state.kebi}/${state.kebiThreshold}`}
              highlight={kebiReady}
            />
            <MetricChip icon={UI.gold} value={String(state.gold)} />
            <MetricChip
              icon={UI.survival}
              value={String(state.survival)}
              warn={state.survival <= 1}
            />
            <MetricChip icon={UI.homeRepair} value={`${state.homeRepair}%`} />
            <WoodButton
              className="px-2 py-0.5 text-[0.6rem]"
              onClick={() => setSupportOpen(!supportOpen)}
              aria-expanded={supportOpen}
            >
              后援 {supportOpen ? "▴" : "▾"}
            </WoodButton>
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

        <div className="mt-2">
          <JourneyNodeTrack journeyIndex={state.journeyIndex} />
        </div>

        {phase === "prep" || phase === "settlement" ? (
          <p
            className={cn(
              "kepi-journey-command-narrative mt-1.5 truncate text-[0.6875rem]",
              needsHint ? "font-medium text-amber-800" : "text-kepi-ink-muted",
            )}
            title={narrative}
            role="status"
          >
            {narrative}
          </p>
        ) : null}

        {supportOpen ? (
          <SupportDetails
            state={state}
            shuikeOnBoard={shuikeOnBoard}
            xiangxianOnBoard={xiangxianOnBoard}
          />
        ) : null}
      </WoodPanel>
    </div>
  );
}

function MetricChip({
  icon,
  value,
  highlight = false,
  warn = false,
}: {
  icon: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <span
      className={cn(
        "kepi-journey-command-metric inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
        highlight && "bg-kepi-accent/12 font-semibold text-kepi-accent",
        warn && !highlight && "bg-amber-100/80 font-semibold text-amber-900",
        !highlight && !warn && "bg-kepi-ink/5 text-kepi-ink",
      )}
    >
      <GameIcon src={icon} size={12} className="shrink-0 opacity-90" />
      {value}
    </span>
  );
}

function SupportDetails({
  state,
  shuikeOnBoard,
  xiangxianOnBoard,
}: {
  state: { sangzi: number; winStreak: number; loseStreak: number };
  shuikeOnBoard: { type: string }[];
  xiangxianOnBoard: { type: string }[];
}) {
  return (
    <div className="mt-2 border-t border-dashed border-kepi-ink/12 pt-2">
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.6875rem] text-kepi-ink-muted">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <GameIcon src={UI.sangzi} size={14} />
          桑梓 {state.sangzi}
        </span>
        <span className="tabular-nums">
          连胜 {state.winStreak} · 连败 {state.loseStreak}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <SupportCard
          icon={ASSET_MANIFEST.characters.shuike}
          name="水客"
          count={shuikeOnBoard.length}
          description={
            shuikeOnBoard.length > 0
              ? "须上场并存活，胜利后才收信"
              : "未上场 — 胜局也拿不到客批"
          }
          critical
        />
        <SupportCard
          icon={ASSET_MANIFEST.characters.xiangxian}
          name="乡贤"
          count={xiangxianOnBoard.length}
          description={
            xiangxianOnBoard.length > 0
              ? "在场时桑梓→修复 +50%"
              : "可招募上场，提升修缮效率"
          }
        />
      </div>
    </div>
  );
}

function SupportCard({
  icon,
  name,
  count,
  description,
  critical = false,
}: {
  icon: string;
  name: string;
  count: number;
  description: string;
  critical?: boolean;
}) {
  return (
    <div
      className={cn(
        "kepi-letter-support-card",
        critical && count === 0 && "kepi-letter-support-card--alert",
      )}
    >
      <GameIcon src={icon} size={28} />
      <div className="min-w-0">
        <p className="text-xs font-medium text-kepi-ink">
          {name}
          {count > 0 ? ` ×${count}` : " · 未上场"}
        </p>
        <p className="text-[0.625rem] leading-snug text-kepi-ink-muted">{description}</p>
      </div>
    </div>
  );
}
