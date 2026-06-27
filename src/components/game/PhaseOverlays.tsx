"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { useBattleTicker } from "@/components/game/useBattleTicker";
import { homeRepairStageLabel } from "@/lib/game/assets";
import { useFxStore } from "@/store/fxStore";
import { useGameStore } from "@/store/gameStore";
import type { GameState, SettlementSummary } from "@/types";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

export function BattleOverlay() {
  const snapshot = useGameStore((state) => state.snapshot);
  const endBattle = useGameStore((state) => state.endBattle);
  const { phase, lastBattleResult } = snapshot;

  useBattleTicker(phase === "battle");

  useEffect(() => {
    if (phase !== "battle" || !lastBattleResult) return;

    const won = lastBattleResult.won;
    const delayMs = won ? 600 : 450;

    const timer = window.setTimeout(() => endBattle(), delayMs);
    return () => window.clearTimeout(timer);
  }, [phase, lastBattleResult, endBattle]);

  return null;
}

export function SettlementOverlay() {
  const snapshot = useGameStore((state) => state.snapshot);
  const advanceStage = useGameStore((state) => state.advanceStage);
  const { phase, state, lastBattleResult } = snapshot;
  const settlement = snapshot.settlement;

  const won = lastBattleResult?.won ?? false;
  const settlementKey =
    phase === "settlement" && settlement
      ? `${won}:${state.stage}:${state.kebi}:${settlement.homeRepairAfter}`
      : "";

  if (phase !== "settlement") return null;

  const repairLabel = homeRepairStageLabel(state.homeRepair);

  if (won && settlement) {
    return (
      <WonSettlementOverlay
        key={settlementKey}
        state={state}
        settlement={settlement}
        repairLabel={repairLabel}
        advanceStage={advanceStage}
      />
    );
  }

  return (
    <SettlementSummaryCard
      won={won}
      state={state}
      settlement={settlement}
      repairLabel={repairLabel}
      advanceStage={advanceStage}
    />
  );
}

function WonSettlementOverlay({
  state,
  settlement,
  repairLabel,
  advanceStage,
}: {
  state: GameState;
  settlement: SettlementSummary;
  repairLabel: string;
  advanceStage: () => void;
}) {
  const applyHomeRepair = useGameStore((store) => store.applyHomeRepair);
  const pushPrepFx = useFxStore((store) => store.pushPrepFx);
  const [showSummary, setShowSummary] = useState(false);
  const repairAppliedRef = useRef(false);

  const commitHomeRepair = useCallback(() => {
    if (repairAppliedRef.current) return;
    const applied = applyHomeRepair();
    if (!applied) return;
    repairAppliedRef.current = true;
    pushPrepFx({
      kind: "repair_home",
      xRatio: 0.5,
      yRatio: 0.46,
      durationMs: 1800,
    });
  }, [applyHomeRepair, pushPrepFx]);

  const finishCinematic = useCallback(() => {
    commitHomeRepair();
    setShowSummary(true);
  }, [commitHomeRepair]);

  if (!showSummary) {
    return (
      <VictoryCinematic
        settlement={settlement}
        onRepairShot={commitHomeRepair}
        onComplete={finishCinematic}
      />
    );
  }

  return (
    <SettlementSummaryCard
      won
      state={state}
      settlement={settlement}
      repairLabel={repairLabel}
      advanceStage={advanceStage}
    />
  );
}

function SettlementSummaryCard({
  won,
  state,
  settlement,
  repairLabel,
  advanceStage,
}: {
  won: boolean;
  state: GameState;
  settlement?: SettlementSummary | null;
  repairLabel: string;
  advanceStage: () => void;
}) {
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
            ? "一封信回家，桑梓随信而归"
            : state.survival > 0
              ? "客批未能送达，存续度 -1，调整阵容后再战"
              : "存续度归零"}
        </p>

        <div className="kepi-wood-divider my-4" />

        {won && settlement ? (
          <SettlementRelay settlement={settlement} repairLabel={repairLabel} />
        ) : (
          <LossSummary survival={state.survival} />
        )}

        <div className="kepi-wood-divider my-4" />

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Stat label="客批" icon={UI.kebi} value={`${state.kebi}/${state.kebiThreshold}`} />
          <Stat label="存续度" icon={UI.survival} value={String(state.survival)} />
          <Stat
            label="桑梓"
            icon={UI.sangzi}
            value={
              settlement?.sangziConsumed
                ? `+${settlement.sangziGained} 已修缮`
                : String(state.sangzi)
            }
          />
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
          {state.survival <= 0
            ? "查看结局"
            : won
              ? state.stage >= state.totalStages
                ? "查看结局"
                : "进入下一关"
              : "重整再战"}
        </WoodButton>
      </WoodPanel>
    </div>
  );
}

function VictoryCinematic({
  settlement,
  onRepairShot,
  onComplete,
}: {
  settlement: SettlementSummary;
  onRepairShot: () => void;
  onComplete: () => void;
}) {
  type VictoryShot = {
    src: string;
    label: string;
    speaker: string;
    dialogue: string;
    aside?: string;
    durationMs: number;
    objectPosition?: string;
  };

  const shots = useMemo<VictoryShot[]>(
    () => [
      {
        src: ASSET_MANIFEST.cinematics.seaDelivery,
        label: "海上抵岸",
        speaker: "水客",
        dialogue: "风浪再大，这封信也得先上岸。",
        durationMs: 3200,
        objectPosition: "50% 48%",
      },
      {
        src: ASSET_MANIFEST.cinematics.handoff,
        label: "递交客批",
        speaker: "乡贤",
        dialogue: "接住了。乡里都在等这封回信。",
        aside: `客批 +${settlement.kebiGained}`,
        durationMs: 3200,
        objectPosition: "50% 46%",
      },
      {
        src: ASSET_MANIFEST.cinematics.sangziReveal,
        label: "桑梓显现",
        speaker: "水客",
        dialogue: "信里亮着桑梓的光，照回土楼了。",
        aside: `桑梓 +${settlement.sangziGained}`,
        durationMs: 3400,
        objectPosition: "50% 50%",
      },
      {
        src: ASSET_MANIFEST.cinematics.repairHome,
        label: "乡贤修楼",
        speaker: "乡贤",
        dialogue: "桑梓到了，土楼该再稳一步。",
        aside: `家园修缮 +${settlement.homeRepairGained}%`,
        durationMs: 3800,
        objectPosition: "50% 48%",
      },
    ],
    [settlement.homeRepairGained, settlement.kebiGained, settlement.sangziGained],
  );

  const totalDuration = useMemo(
    () => shots.reduce((sum, shot) => sum + shot.durationMs, 0),
    [shots],
  );
  const [shotIndex, setShotIndex] = useState(0);
  const repairShotIndex = shots.length - 1;

  useEffect(() => {
    if (shotIndex === repairShotIndex) {
      onRepairShot();
    }
  }, [shotIndex, repairShotIndex, onRepairShot]);

  useEffect(() => {
    setShotIndex(0);
    const warm = window.setTimeout(() => {
      for (const shot of shots) {
        const preload = new window.Image();
        preload.src = shot.src;
      }
    }, 0);

    const timers = shots.slice(1).map((_shot, index) =>
      window.setTimeout(() => {
        setShotIndex(index + 1);
      }, shots.slice(0, index + 1).reduce((sum, item) => sum + item.durationMs, 0)),
    );
    const completeTimer = window.setTimeout(() => {
      onComplete();
    }, totalDuration);

    return () => {
      window.clearTimeout(warm);
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearTimeout(completeTimer);
    };
  }, [shots, totalDuration, onComplete]);

  const shot = shots[shotIndex] ?? shots[0];
  const progress = ((shotIndex + 1) / shots.length) * 100;

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 overflow-hidden bg-[#090705]">
      <button
        type="button"
        className="kepi-victory-skip"
        onClick={onComplete}
      >
        跳过
      </button>

      <div className="absolute inset-0">
        {shots.map((frame, index) => (
          <img
            key={frame.src}
            src={frame.src}
            alt={frame.label}
            className="kepi-victory-shot-image transition-opacity duration-700"
            style={{
              objectPosition: frame.objectPosition ?? "center center",
              opacity: index === shotIndex ? 1 : 0,
            }}
          />
        ))}
        <div className="kepi-victory-vignette" aria-hidden />
      </div>

      <div className="kepi-victory-progress" aria-hidden>
        <div className="kepi-victory-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div
        key={`${shot.label}-${shotIndex}`}
        className="kepi-victory-dialogue"
        role="group"
        aria-label={`${shot.speaker}：${shot.dialogue}`}
      >
        <p className="kepi-victory-speaker">{shot.speaker}</p>
        <p className="kepi-victory-line">{shot.dialogue}</p>
        {shot.aside ? <p className="kepi-victory-aside">{shot.aside}</p> : null}
      </div>
    </div>
  );
}

function SettlementRelay({
  settlement,
  repairLabel,
}: {
  settlement: SettlementSummary;
  repairLabel: string;
}) {
  const steps = [
    {
      icon: UI.kebi,
      actor: "水客",
      line: `送回客批 +${settlement.kebiGained}`,
    },
    {
      icon: UI.sangzi,
      actor: "信中",
      line: `带回桑梓 +${settlement.sangziGained}`,
    },
    {
      icon: UI.sangzi,
      actor: "乡贤",
      line: `消耗桑梓 ${settlement.sangziConsumed} 份`,
    },
    {
      icon: UI.homeRepair,
      actor: "土楼",
      line: `家园修复 +${settlement.homeRepairGained}% · ${repairLabel}`,
    },
  ];

  return (
    <ol className="space-y-2">
      {steps.map((step, index) => (
        <li
          key={`${step.actor}-${index}`}
          className="kepi-settlement-step"
        >
          <GameIcon src={step.icon} size={22} />
          <div className="min-w-0">
            <p className="text-[0.625rem] font-bold text-kepi-ink-muted">
              {step.actor}
            </p>
            <p className="text-sm font-semibold leading-snug text-kepi-ink">
              {step.line}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function LossSummary({ survival }: { survival: number }) {
  return (
    <div className="rounded-md border border-red-900/20 bg-red-950/10 p-3 text-sm text-kepi-ink">
      <p className="font-semibold">本关失利，信未抵家。</p>
      <p className="mt-1 text-xs text-kepi-ink-muted">
        客批不增加，桑梓不产生，家园修复保持不变。当前存续度 {survival}。
      </p>
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
