"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { GameIcon, HudMetric, WoodButton } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function PrepHudPanel() {
  const snapshot = useGameStore((state) => state.snapshot);
  const supportOpen = useUIStore((state) => state.supportPopoverOpen);
  const setSupportOpen = useUIStore((state) => state.setSupportPopoverOpen);
  const { state, board } = snapshot;

  const shuikeOnBoard = board.filter((piece) => piece.type === "shuike");
  const xiangxianOnBoard = board.filter((piece) => piece.type === "xiangxian");
  const kebiReady = state.kebi >= state.kebiThreshold;

  return (
    <div className="kepi-prep-hud-panel flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="shrink-0 text-[0.625rem] font-bold tracking-wide uppercase text-kepi-ink-muted">
          行囊
        </p>

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <HudMetric
            label="客批"
            value={`${state.kebi}/${state.kebiThreshold}`}
            icon={UI.kebi}
            highlight={kebiReady}
            className="kepi-prep-hud-metric"
          />
          <HudMetric
            label="金币"
            value={String(state.gold)}
            icon={UI.gold}
            className="kepi-prep-hud-metric"
          />
          <HudMetric
            label="存续"
            value={String(state.survival)}
            icon={UI.survival}
            highlight={state.survival <= 1}
            className="kepi-prep-hud-metric"
          />
          <HudMetric
            label="修缮"
            value={`${state.homeRepair}%`}
            icon={UI.homeRepair}
            className="kepi-prep-hud-metric"
          />
        </div>

        <WoodButton
          className="ml-auto shrink-0 px-2 py-0.5 text-[0.6rem]"
          onClick={() => setSupportOpen(!supportOpen)}
          aria-expanded={supportOpen}
        >
          后援 {supportOpen ? "▴" : "▾"}
        </WoodButton>
      </div>

      {supportOpen ? (
        <SupportDetails
          state={state}
          shuikeOnBoard={shuikeOnBoard}
          xiangxianOnBoard={xiangxianOnBoard}
        />
      ) : null}
    </div>
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
    <div className="mt-auto border-t border-dashed border-kepi-ink/12 pt-2">
      <div className="mb-2 flex flex-wrap gap-x-3 gap-y-1 text-[0.625rem] text-kepi-ink-muted">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <GameIcon src={UI.sangzi} size={12} />
          桑梓 {state.sangzi}
        </span>
        <span className="tabular-nums">
          连胜 {state.winStreak} · 连败 {state.loseStreak}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-1.5">
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
      <GameIcon src={icon} size={24} />
      <div className="min-w-0">
        <p className="text-[0.625rem] font-medium text-kepi-ink">
          {name}
          {count > 0 ? ` ×${count}` : " · 未上场"}
        </p>
        <p className="text-[0.5625rem] leading-snug text-kepi-ink-muted">{description}</p>
      </div>
    </div>
  );
}
