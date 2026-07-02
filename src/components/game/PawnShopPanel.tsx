"use client";

import Image from "next/image";
import { useCallback, useRef, useState, type CSSProperties } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { currentJourneyNode } from "@/engine";
import { BLOOD_DEBT_GOLD, PAWN_KEBI_GOLD } from "@/engine/constants";
import {
  playPawnGoldSfx,
  playPawnStampSfx,
} from "@/lib/audio/battleSfx";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { GameIcon, WoodButton } from "@/components/game/ui";

const CINEMATICS = ASSET_MANIFEST.cinematics;
const UI = ASSET_MANIFEST.ui;

const PAWN_HOLD_MS = 720;
const BURN_BEAT_MS = 880;
const GOLD_BEAT_MS = 620;

type PawnRitualPhase = "idle" | "holding" | "burning" | "gold";

export function PawnShopPanel() {
  const snapshot = useGameStore((state) => state.snapshot);
  if (snapshot.phase !== "pawn_shop") return null;

  const node = currentJourneyNode(snapshot);
  if (!node) return null;

  return <PawnShopCinematic key={node.id} nodeLabel={node.label} />;
}

function PawnShopCinematic({ nodeLabel }: { nodeLabel: string }) {
  const snapshot = useGameStore((state) => state.snapshot);
  const dispatch = useGameStore((state) => state.dispatch);
  const pushToast = useUIStore((state) => state.pushToast);
  const { state } = snapshot;

  const [ritual, setRitual] = useState<PawnRitualPhase>("idle");
  const [holdProgress, setHoldProgress] = useState(0);
  const [sealFlash, setSealFlash] = useState(false);
  const [resultPulse, setResultPulse] = useState<"pawn" | "borrow" | null>(null);

  const holdTimerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number | null>(null);
  const holdFrameRef = useRef<number | null>(null);
  const busy = ritual === "burning" || ritual === "gold" || sealFlash;

  const canPawn = state.kebi >= 1 && !busy;

  const clearHold = useCallback(() => {
    if (holdTimerRef.current !== null) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdFrameRef.current !== null) {
      window.cancelAnimationFrame(holdFrameRef.current);
      holdFrameRef.current = null;
    }
    holdStartRef.current = null;
    setHoldProgress(0);
    if (ritual === "holding") setRitual("idle");
  }, [ritual]);

  const runPawnSequence = useCallback(() => {
    setRitual("burning");
    playPawnStampSfx();

    window.setTimeout(() => {
      setRitual("gold");
      playPawnGoldSfx();

      window.setTimeout(() => {
        dispatch({ type: "PAWN_KEBI" });
        const next = useGameStore.getState().snapshot.state;
        pushToast(`当信 +${PAWN_KEBI_GOLD} 金币（客批 ${next.kebi}/${next.kebiThreshold}）`, "default");
        setResultPulse("pawn");
        setRitual("idle");
        window.setTimeout(() => setResultPulse(null), 1200);
      }, GOLD_BEAT_MS);
    }, BURN_BEAT_MS);
  }, [dispatch, pushToast]);

  const beginHold = () => {
    if (!canPawn) {
      pushToast("没有客批可当", "error");
      return;
    }

    clearHold();
    setRitual("holding");
    holdStartRef.current = performance.now();

    const tick = (now: number) => {
      const start = holdStartRef.current;
      if (start === null) return;
      const progress = Math.min(1, (now - start) / PAWN_HOLD_MS);
      setHoldProgress(progress);
      if (progress < 1) {
        holdFrameRef.current = window.requestAnimationFrame(tick);
      }
    };
    holdFrameRef.current = window.requestAnimationFrame(tick);

    holdTimerRef.current = window.setTimeout(() => {
      holdStartRef.current = null;
      setHoldProgress(1);
      runPawnSequence();
    }, PAWN_HOLD_MS);
  };

  const borrow = () => {
    if (busy) return;

    setSealFlash(true);
    playPawnStampSfx();

    window.setTimeout(() => {
      dispatch({ type: "BORROW_AGAINST_RETURN" });
      const next = useGameStore.getState().snapshot.state;
      pushToast(
        `透支未来 +${BLOOD_DEBT_GOLD} 金，归乡需 ${next.kebiThreshold} 封客批`,
        "default",
      );
      setResultPulse("borrow");
      setSealFlash(false);
      window.setTimeout(() => setResultPulse(null), 1200);
    }, 520);
  };

  const leave = () => {
    if (busy) return;
    dispatch({ type: "LEAVE_PAWN_SHOP" });
    pushToast("离开典当行，继续归乡", "default");
  };

  const letterSrc =
    ritual === "burning" || ritual === "gold"
      ? CINEMATICS.pawnLetterBurning
      : CINEMATICS.pawnLetterIntact;

  return (
    <div
      className="kepi-pawn-shop-scene absolute inset-0 z-30 overflow-hidden"
      aria-live="polite"
    >
      <div className="kepi-pawn-shop-vignette absolute inset-0" aria-hidden>
        <Image
          src={CINEMATICS.pawnShopVignette}
          alt=""
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
      </div>

      {ritual === "gold" ? (
        <div className="kepi-pawn-gold-burst pointer-events-none absolute inset-0 z-[2]" aria-hidden>
          <Image
            src={CINEMATICS.pawnGoldFall}
            alt=""
            fill
            className="object-cover mix-blend-screen"
            sizes="100vw"
          />
        </div>
      ) : null}

      {sealFlash ? (
        <div className="kepi-pawn-seal-flash pointer-events-none absolute inset-0 z-[3]" aria-hidden>
          <Image
            src={CINEMATICS.bloodDebtSeal}
            alt=""
            fill
            className="object-contain p-[12%]"
            sizes="100vw"
          />
        </div>
      ) : null}

      <div className="relative flex h-full flex-col px-[5%] pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(7.5rem,calc(env(safe-area-inset-top)+6.75rem))] sm:pt-[max(8.25rem,calc(env(safe-area-inset-top)+7.25rem))]">
        <div className="pointer-events-none text-center">
          <p className="text-[0.65rem] font-medium tracking-[0.18em] text-amber-200/75">
            客批典当行
          </p>
          <h2 className="mt-1 text-xl font-bold text-amber-50 sm:text-2xl">{nodeLabel}</h2>
          <p className="mt-2 text-xs text-amber-100/82 sm:text-sm">
            当信换金币，或透支未来的归乡阈值。
          </p>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-3">
          <div className="kepi-pawn-letter-stage pointer-events-auto relative">
            <button
              type="button"
              className={cn(
                "kepi-pawn-letter-btn relative block",
                !canPawn && "kepi-pawn-letter-btn--disabled",
                ritual === "holding" && "kepi-pawn-letter-btn--holding",
                (ritual === "burning" || ritual === "gold") && "kepi-pawn-letter-btn--burning",
              )}
              disabled={!canPawn}
              aria-label="长按燃烧客批信件"
              onPointerDown={(event) => {
                event.currentTarget.setPointerCapture(event.pointerId);
                beginHold();
              }}
              onPointerUp={clearHold}
              onPointerLeave={clearHold}
              onPointerCancel={clearHold}
            >
              {ritual === "holding" ? (
                <span
                  className="kepi-pawn-hold-ring"
                  style={{ "--kepi-hold-progress": holdProgress } as CSSProperties}
                  aria-hidden
                />
              ) : null}
              <Image
                src={letterSrc}
                alt=""
                width={220}
                height={280}
                className={cn(
                  "kepi-pawn-letter-image mx-auto h-auto w-[min(42vw,11rem)] object-contain drop-shadow-2xl sm:w-[12.5rem]",
                  ritual === "burning" && "kepi-pawn-letter-image--burn",
                  ritual === "gold" && "kepi-pawn-letter-image--ash",
                )}
                priority
              />
            </button>
            <p className="mt-3 text-center text-[0.65rem] tracking-[0.12em] text-amber-200/78">
              {canPawn ? "长按信纸，燃烧当信" : "暂无客批可典当"}
            </p>
          </div>

          <div className="kepi-pawn-choice-split pointer-events-auto w-full max-w-2xl">
            <PawnActionCard
              eyebrow="防守"
              title="当信"
              description={`-1 客批，+${PAWN_KEBI_GOLD} 金。长按上方信纸完成仪式。`}
              icon={UI.pawnKebi}
              effectLabel={`+${PAWN_KEBI_GOLD} 金币`}
              tone="pawn"
              active={ritual === "holding" || ritual === "burning" || ritual === "gold"}
            />
            <span className="kepi-pawn-choice-split__seam" aria-hidden />
            <PawnActionCard
              eyebrow="进攻"
              title="透支未来"
              description={`+${BLOOD_DEBT_GOLD} 金，归乡阈值 +1。未来的路更长更险。`}
              icon={UI.bloodDebt}
              effectLabel="阈值 +1"
              tone="debt"
              disabled={busy}
              active={sealFlash}
              onActivate={borrow}
            />
          </div>

          <div
            className={cn(
              "kepi-pawn-stats pointer-events-none grid w-full max-w-md grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4",
              resultPulse && "kepi-pawn-stats--pulse",
            )}
          >
            <StatChip icon={UI.kebi} label="客批" value={`${state.kebi}/${state.kebiThreshold}`} />
            <StatChip icon={UI.gold} label="金币" value={String(state.gold)} />
            <StatChip icon={UI.bloodDebt} label="透支" value={`${state.bloodDebtCount} 次`} />
            <StatChip icon={UI.homewardTicket} label="归乡" value={`需 ${state.kebiThreshold} 封`} />
          </div>
        </div>

        <WoodButton
          className="kepi-pawn-leave pointer-events-auto mx-auto w-full max-w-xs"
          variant="primary"
          disabled={busy}
          onClick={leave}
        >
          离开典当行，继续归乡
        </WoodButton>
      </div>
    </div>
  );
}

function PawnActionCard({
  eyebrow,
  title,
  description,
  icon,
  effectLabel,
  tone,
  disabled,
  active,
  onActivate,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: string;
  effectLabel: string;
  tone: "pawn" | "debt";
  disabled?: boolean;
  active?: boolean;
  onActivate?: () => void;
}) {
  const className = cn(
    "kepi-pawn-action-card",
    tone === "pawn" && "kepi-pawn-action-card--pawn",
    tone === "debt" && "kepi-pawn-action-card--debt",
    active && "kepi-pawn-action-card--active",
    !onActivate && "kepi-pawn-action-card--readonly",
  );

  const body = (
    <>
      <span className="kepi-pawn-action-card__fold" aria-hidden />
      <span className="kepi-pawn-action-card__eyebrow">{eyebrow}</span>
      <div className="kepi-pawn-action-card__head">
        <GameIcon src={icon} size={26} />
        <p className="kepi-pawn-action-card__title">{title}</p>
      </div>
      <p className="kepi-pawn-action-card__desc">{description}</p>
      <span className="kepi-pawn-effect-badge mt-1 inline-flex items-center gap-1.5">
        <GameIcon src={icon} size={14} />
        {effectLabel}
      </span>
      <span className="kepi-pawn-action-card__mark" aria-hidden />
    </>
  );

  if (!onActivate) {
    return <div className={className}>{body}</div>;
  }

  return (
    <button type="button" className={className} disabled={disabled} onClick={onActivate}>
      {body}
    </button>
  );
}

function StatChip({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="kepi-pawn-stat-chip rounded-md px-2 py-1.5">
      <span className="inline-flex items-center justify-center gap-1 text-[0.625rem] text-amber-100/75">
        <GameIcon src={icon} size={14} />
        {label}
      </span>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-amber-50">{value}</p>
    </div>
  );
}
