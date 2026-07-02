"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { levelInteractionForNode } from "@/data/levelInteractions";
import { settlementBackdropSrc } from "@/lib/game/battleBuffUi";
import { isFinalBattleNode } from "@/lib/game/journeyBattleUi";
import { useBattleTicker } from "@/components/game/useBattleTicker";
import { homeRepairStageLabel } from "@/lib/game/assets";
import {
  milestoneLabel,
  playTulouMilestoneSfx,
  prepFxKindForMilestone,
} from "@/lib/game/tulouMilestone";
import { buildTurnNarrativeInput } from "@/lib/ai/buildTurnNarrativeInput";
import { useFxStore } from "@/store/fxStore";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import type { GameState, SettlementSummary } from "@/types";
import { cn } from "@/lib/utils";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";
import { SettlementNarrative } from "@/components/game/SettlementNarrative";
import { TulouMilestoneOverlay } from "@/components/game/TulouMilestoneOverlay";
import type { HomeRepairMilestone } from "@/types";

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
      ? `${won}:${state.stage}:${state.kebi}:${settlement.homeRepairAfter}:${state.roundPawnCount}:${settlement.waterGuestDied}:${settlement.waterGuestSurvived}`
      : "";

  const narrativeInput = useMemo(() => {
    if (phase !== "settlement") return null;
    return buildTurnNarrativeInput(snapshot);
    // settlementKey captures all narrative-relevant settlement fields
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settlementKey]);

  if (phase !== "settlement") return null;

  const repairLabel = homeRepairStageLabel(state.homeRepair);

  if (won && settlement && settlement.kebiGained > 0) {
    return (
      <WonSettlementOverlay
        key={settlementKey}
        state={state}
        settlement={settlement}
        repairLabel={repairLabel}
        advanceStage={advanceStage}
        narrativeKey={settlementKey}
        narrativeInput={narrativeInput}
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
      narrativeKey={settlementKey}
      narrativeInput={narrativeInput}
    />
  );
}

function WonSettlementOverlay({
  state,
  settlement,
  repairLabel,
  advanceStage,
  narrativeKey,
  narrativeInput,
}: {
  state: GameState;
  settlement: SettlementSummary;
  repairLabel: string;
  advanceStage: () => void;
  narrativeKey: string;
  narrativeInput: import("@/lib/ai/types").TurnNarrativeInput | null;
}) {
  const applyHomeRepair = useGameStore((store) => store.applyHomeRepair);
  const pushPrepFx = useFxStore((store) => store.pushPrepFx);
  const [showSummary, setShowSummary] = useState(false);
  const [milestoneFlash, setMilestoneFlash] = useState<HomeRepairMilestone | null>(
    null,
  );
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
    const milestone = settlement.homeRepairMilestone;
    if (milestone) {
      setMilestoneFlash(milestone);
      pushPrepFx({
        kind: prepFxKindForMilestone(milestone),
        xRatio: 0.5,
        yRatio: 0.46,
        durationMs: milestone === 99 ? 2600 : 2200,
      });
      playTulouMilestoneSfx(milestone);
    }
  }, [applyHomeRepair, pushPrepFx, settlement.homeRepairMilestone]);

  const finishCinematic = useCallback(() => {
    commitHomeRepair();
    setShowSummary(true);
  }, [commitHomeRepair]);

  if (!showSummary) {
    return (
      <>
        {milestoneFlash ? (
          <TulouMilestoneOverlay
            milestone={milestoneFlash}
            onDone={() => setMilestoneFlash(null)}
          />
        ) : null}
        <VictoryCinematic
          settlement={settlement}
          onRepairShot={commitHomeRepair}
          onComplete={finishCinematic}
        />
      </>
    );
  }

  return (
    <>
      {milestoneFlash ? (
        <TulouMilestoneOverlay
          milestone={milestoneFlash}
          onDone={() => setMilestoneFlash(null)}
        />
      ) : null}
      <SettlementSummaryCard
        won
        state={state}
        settlement={settlement}
        repairLabel={repairLabel}
        advanceStage={advanceStage}
        narrativeKey={narrativeKey}
        narrativeInput={narrativeInput}
      />
    </>
  );
}

function settlementHeadline(
  won: boolean,
  nodeId: string,
  settlement?: SettlementSummary | null,
): string {
  const interaction = levelInteractionForNode(nodeId);
  if (interaction) return interaction.settlement.actName;
  if (!won) return "本关失利";
  if (settlement?.kebiGained && settlement.kebiGained > 0) return "本关胜利";
  if (settlement?.waterGuestDied) return "胜利，但信丢了";
  return "胜利，但未收信";
}

function settlementSubtitle(
  won: boolean,
  survival: number,
  nodeId: string,
  settlement?: SettlementSummary | null,
): string {
  const interaction = levelInteractionForNode(nodeId);
  if (!won) {
    return interaction
      ? interaction.settlement.loss
      : survival > 0
      ? "客批未能送达，存续度 -1，调整阵容后再战"
      : "存续度归零";
  }
  if (settlement?.kebiGained && settlement.kebiGained > 0) {
    return interaction?.settlement.win ?? "一封信回家，桑梓随信而归";
  }
  if (settlement?.waterGuestDied) {
    return interaction?.settlement.winNoLetter ??
      "寨子守住了，可信沉在了风里。水客没能把信带回来。";
  }
  return interaction?.settlement.winNoLetter ??
    "胜局成立，但水客未上场或未能护信，本回合无客批与桑梓。";
}

function settlementCtaLabel({
  won,
  state,
  settlement,
}: {
  won: boolean;
  state: GameState;
  settlement?: SettlementSummary | null;
}): string {
  if (state.survival <= 0 || state.journeyIndex >= state.totalNodes - 1) {
    return "查看结局";
  }
  if (!won) return "重整再战";
  if (!settlement || settlement.kebiGained <= 0) return "继续前行";

  return levelInteractionForNode(state.currentNodeId)?.settlement.cta ?? "进入下一关";
}

function FinalSettlementGateBanner({
  state,
  won,
}: {
  state: GameState;
  won: boolean;
}) {
  const kebiReady = state.kebi >= state.kebiThreshold;

  return (
    <div
      className={cn(
        "mt-2.5 flex items-start gap-2 rounded-md border px-2.5 py-2 text-[0.6875rem] leading-relaxed",
        won && kebiReady
          ? "border-emerald-800/35 bg-emerald-950/18 text-emerald-50/95"
          : "border-amber-800/35 bg-amber-950/18 text-amber-50/95",
      )}
      role="status"
    >
      <GameIcon
        src={ASSET_MANIFEST.ending.homewardTicketProp}
        size={24}
        className="mt-0.5 shrink-0"
      />
      <div>
        <p className="font-bold">
          {won ? "风浪已过 — 归乡票根" : "终局失利 — 归乡暂缓"}
        </p>
        <p className="mt-0.5 text-[0.625rem] opacity-92">
          {won
            ? kebiReady
              ? `客批 ${state.kebi}/${state.kebiThreshold} 已达标。点击下方「查看结局」，查验完美归乡或遗憾结局。`
              : `客批 ${state.kebi}/${state.kebiThreshold} 未达阈值。仍可查看结局，但恐难完美归乡。`
            : state.survival > 0
              ? "存续仍在，可重整阵容再战终局。"
              : "存续归零，将直接进入结局演出。"}
        </p>
      </div>
    </div>
  );
}

function SettlementSummaryCard({
  won,
  state,
  settlement,
  repairLabel,
  advanceStage,
  narrativeKey,
  narrativeInput,
}: {
  won: boolean;
  state: GameState;
  settlement?: SettlementSummary | null;
  repairLabel: string;
  advanceStage: () => void;
  narrativeKey: string;
  narrativeInput: import("@/lib/ai/types").TurnNarrativeInput | null;
}) {
  const backdrop = settlementBackdropSrc(won, settlement);
  const interaction = levelInteractionForNode(state.currentNodeId);
  const nextLabel = settlementCtaLabel({ won, state, settlement });

  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center px-4 py-[max(1rem,env(safe-area-inset-bottom))]">
      {backdrop ? (
        <>
          <Image
            src={backdrop}
            alt=""
            fill
            className="pointer-events-none object-cover opacity-35"
            sizes="100vw"
          />
          <div className="pointer-events-none absolute inset-0 bg-black/50" aria-hidden />
        </>
      ) : (
        <div className="pointer-events-none absolute inset-0 bg-black/35" aria-hidden />
      )}
      <WoodPanel
        className="pointer-events-auto relative w-full max-w-md max-h-[min(92dvh,calc(100dvh-2rem))] overflow-y-auto"
        letterEdge
        innerClassName="p-4"
      >
        <h2 className="text-center text-base font-bold text-kepi-ink">
          {settlementHeadline(won, state.currentNodeId, settlement)}
        </h2>
        <p className="mt-1 text-center text-[0.6875rem] leading-snug text-kepi-ink-muted">
          {settlementSubtitle(won, state.survival, state.currentNodeId, settlement)}
        </p>

        {settlement ? <SettlementOutcomeRow settlement={settlement} state={state} /> : null}

        {isFinalBattleNode(state.currentNodeId) ? (
          <FinalSettlementGateBanner state={state} won={won} />
        ) : null}

        <div className="kepi-wood-divider my-3" />

        {won && settlement && settlement.kebiGained > 0 ? (
          <SettlementRelay settlement={settlement} repairLabel={repairLabel} />
        ) : won && settlement ? (
          <WinNoLetterSummary settlement={settlement} />
        ) : (
          <LossSummary survival={state.survival} />
        )}

        {interaction ? (
          <div className="mt-2.5 rounded-md border border-amber-900/20 bg-amber-950/10 p-2.5 text-[0.6875rem] leading-relaxed text-kepi-ink-muted">
            <p className="font-semibold text-kepi-ink">{interaction.settlement.nextHook}</p>
            <p className="mt-0.5">{interaction.acceptance}</p>
          </div>
        ) : null}

        <div className="kepi-wood-divider my-3" />

        <SettlementNarrative input={narrativeInput} cacheKey={narrativeKey} />

        <div className="kepi-wood-divider my-3" />

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
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
          className="mt-4 w-full py-2 text-xs font-bold"
          onClick={() => advanceStage()}
        >
          <GameIcon src={UI.settlementConfirm} size={16} />
          {nextLabel}
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
  const setSettlementCinematicActive = useUIStore(
    (store) => store.setSettlementCinematicActive,
  );

  useEffect(() => {
    setSettlementCinematicActive(true);
    return () => setSettlementCinematicActive(false);
  }, [setSettlementCinematicActive]);

  useEffect(() => {
    if (shotIndex === repairShotIndex) {
      onRepairShot();
    }
  }, [shotIndex, repairShotIndex, onRepairShot]);

  useEffect(() => {
    const resetTimer = window.setTimeout(() => setShotIndex(0), 0);
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
      window.clearTimeout(resetTimer);
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
      line: settlement.homeRepairMilestone
        ? `${milestoneLabel(settlement.homeRepairMilestone)} · +${settlement.homeRepairGained}%`
        : `家园修复 +${settlement.homeRepairGained}% · ${repairLabel}`,
    },
  ];

  return (
    <ol className="space-y-1.5">
      {steps.map((step, index) => (
        <li
          key={`${step.actor}-${index}`}
          className="kepi-settlement-step"
        >
          <GameIcon src={step.icon} size={18} />
          <div className="min-w-0">
            <p className="text-[0.5625rem] font-bold text-kepi-ink-muted">
              {step.actor}
            </p>
            <p className="text-xs font-semibold leading-snug text-kepi-ink">
              {step.line}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function WinNoLetterSummary({ settlement }: { settlement: SettlementSummary }) {
  return (
    <div className="rounded-md border border-amber-900/25 bg-amber-950/10 p-2.5 text-xs text-kepi-ink">
      <p className="font-semibold">本回合收益为空</p>
      <ul className="mt-1.5 space-y-0.5 text-[0.6875rem] text-kepi-ink-muted">
        <li>客批 +0（须水客存活才收信）</li>
        <li>桑梓 +0 · 家园修复 +0%</li>
        <li>
          水客状态：
          {settlement.waterGuestDied
            ? " 战死"
            : settlement.waterGuestDeployed
              ? " 未存活"
              : " 未上场"}
        </li>
        <li>存续度不变（胜利不扣寨子血量）</li>
      </ul>
    </div>
  );
}

function LossSummary({ survival }: { survival: number }) {
  return (
    <div className="rounded-md border border-red-900/20 bg-red-950/10 p-2.5 text-xs text-kepi-ink">
      <p className="font-semibold">本关失利，信未抵家。</p>
      <p className="mt-0.5 text-[0.6875rem] text-kepi-ink-muted">
        客批不增加，桑梓不产生，家园修复保持不变。当前存续度 {survival}。
      </p>
    </div>
  );
}

function SettlementOutcomeRow({
  settlement,
  state,
}: {
  settlement: SettlementSummary;
  state: GameState;
}) {
  const waterGuestLabel = settlement.waterGuestDied
    ? "水客战死"
    : settlement.waterGuestSurvived
      ? "水客护信成功"
      : settlement.waterGuestDeployed
        ? "水客未存活"
        : "水客未上场";

  return (
    <div className="mt-2 flex flex-wrap justify-center gap-1.5 text-[0.5625rem]">
      <span
        className={cn(
          "rounded-full border px-2 py-0.5",
          settlement.won
            ? "border-emerald-900/25 bg-emerald-950/15 text-emerald-100"
            : "border-red-900/25 bg-red-950/15 text-red-100",
        )}
      >
        {settlement.won ? "胜" : "负"}
      </span>
      <span className="rounded-full border border-amber-900/25 bg-amber-950/15 px-2 py-0.5 text-amber-100">
        {waterGuestLabel}
      </span>
      {state.roundPawnCount > 0 ? (
        <span className="rounded-full border border-rose-900/25 bg-rose-950/15 px-2 py-0.5 text-rose-100">
          本回合典当 {state.roundPawnCount} 封
        </span>
      ) : null}
      {settlement.xiangxianBonusApplied ? (
        <span className="rounded-full border border-sky-900/25 bg-sky-950/15 px-2 py-0.5 text-sky-100">
          乡贤修缮 +50%
        </span>
      ) : null}
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
      <dt className="flex items-center gap-1 text-[0.6875rem] text-kepi-ink-muted">
        {icon ? <GameIcon src={icon} size={14} /> : null}
        {label}
      </dt>
      <dd className="text-xs font-medium tabular-nums text-kepi-ink">{value}</dd>
    </div>
  );
}
