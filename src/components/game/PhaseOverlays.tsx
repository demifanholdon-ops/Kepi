"use client";

import { useEffect } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { homeRepairStage } from "@/engine";
import { useGameStore } from "@/store/gameStore";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function BattleOverlay() {
  const snapshot = useGameStore((state) => state.snapshot);
  const endBattle = useGameStore((state) => state.endBattle);
  const { phase, lastBattleResult: result } = snapshot;

  useEffect(() => {
    if (phase !== "battle" || !result) return;
    const delay = Math.min(result.elapsedMs + 800, 4500);
    const timer = window.setTimeout(() => endBattle(), delay);
    return () => window.clearTimeout(timer);
  }, [phase, result, endBattle]);

  if (phase !== "battle") return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-[4.75rem] z-20 flex justify-center px-[5%]">
      <div className="kepi-hud-tag pointer-events-auto max-w-lg">
        <div className="kepi-hud-tag-inner flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2">
          <span className="text-xs font-bold text-kepi-ink">战斗进行中</span>
          {result ? (
            <span className="text-[0.65rem] text-kepi-ink-muted">
              {result.won ? "己方占优" : "战况胶着"} · {result.alliesRemaining} 对{" "}
              {result.enemiesRemaining}
            </span>
          ) : (
            <span className="text-[0.65rem] text-kepi-ink-muted">演算中…</span>
          )}
          <WoodButton
            className="px-2.5 py-1 text-[0.65rem]"
            onClick={() => endBattle()}
          >
            跳过
          </WoodButton>
        </div>
      </div>
    </div>
  );
}

export function SettlementOverlay() {
  const snapshot = useGameStore((state) => state.snapshot);
  const advanceStage = useGameStore((state) => state.advanceStage);
  const { phase, state, lastBattleResult } = snapshot;

  if (phase !== "settlement") return null;

  const won = lastBattleResult?.won ?? false;
  const repairLabel =
    homeRepairStage(state.homeRepair) === "renewed"
      ? "焕新"
      : homeRepairStage(state.homeRepair) === "repairing"
        ? "修缮中"
        : "破败";

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4">
      <WoodPanel
        className="pointer-events-auto w-full max-w-md"
        letterEdge
        innerClassName="p-5"
      >
        <h2 className="text-center text-lg font-bold text-kepi-ink">
          {won ? "本关胜利" : "本关失利"}
        </h2>
        <p className="mt-1 text-center text-xs text-kepi-ink-muted">
          {won
            ? "客批 +1，桑梓值与家园修复推进"
            : state.survival > 0
              ? "存续度 -1"
              : "存续度归零"}
        </p>

        <div className="kepi-wood-divider my-4" />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Stat label="客批" icon={UI.kebi} value={`${state.kebi}/${state.kebiThreshold}`} />
          <Stat label="存续度" icon={UI.survival} value={String(state.survival)} />
          <Stat label="桑梓值" icon={UI.sangzi} value={String(state.sangzi)} />
          <Stat
            label="家园"
            icon={UI.homeRepair}
            value={`${state.homeRepair}% (${repairLabel})`}
          />
        </dl>

        <WoodButton
          variant="primary"
          className="mt-5 w-full py-2.5 text-sm font-bold"
          onClick={() => advanceStage()}
        >
          {state.stage >= state.totalStages ? "查看结局" : "进入下一关"}
        </WoodButton>
      </WoodPanel>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-kepi-ink-muted">
        {icon ? <GameIcon src={icon} size={16} /> : null}
        {label}
      </dt>
      <dd className="font-medium tabular-nums text-kepi-ink">{value}</dd>
    </div>
  );
}
