"use client";

import Image from "next/image";
import {
  ARCHIVAL_LETTERS,
  ENDING_SCENE_COPY,
  endingLetterCount,
  endingSubtitle,
  pickDigitalLetterFallback,
  type EndingNarrativeContext,
} from "@/data/letters";
import { ASSET_MANIFEST } from "@/data/assets";
import { requestDigitalLetter } from "@/lib/ai/client";
import type { AILetterResponse, AIPromptInput } from "@/lib/ai/types";
import { endingArtworkSrc } from "@/lib/game/endingUi";
import { cn } from "@/lib/utils";
import type { EndingType } from "@/types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GameIcon, WoodButton } from "@/components/game/ui";
import { GestureLayer, type GestureMode } from "./GestureLayer";
import {
  DigitalLetterScroll,
  LetterPicker,
  LetterViewer,
} from "./LetterViewer";
import { useEndingAudio } from "./useEndingAudio";

const ENDING = ASSET_MANIFEST.ending;
const UI = ASSET_MANIFEST.ui;

export type EndingSceneProps = {
  endingType: EndingType;
  narrative: EndingNarrativeContext;
  stage: number;
  battleSummary?: string;
  gestureMode?: GestureMode;
  volume?: number;
  onComplete?: () => void;
  className?: string;
};

type EndingStep = "storm" | "catch" | "reading" | "finale";

export function EndingScene({
  endingType,
  narrative,
  stage,
  battleSummary,
  gestureMode = "pointer",
  volume = 0.8,
  onComplete,
  className,
}: EndingSceneProps) {
  const [step, setStep] = useState<EndingStep>("storm");
  const [caughtCount, setCaughtCount] = useState(0);
  const [slowTime, setSlowTime] = useState(false);
  const [selectedLetterIndex, setSelectedLetterIndex] = useState(0);
  const [digitalNarrative, setDigitalNarrative] =
    useState<AILetterResponse | null>(null);
  const [loadingDigital, setLoadingDigital] = useState(true);

  const copy = ENDING_SCENE_COPY[endingType];
  const letterCount = endingLetterCount(endingType, narrative);
  const archivalLetters = useMemo(
    () => ARCHIVAL_LETTERS.slice(0, letterCount),
    [letterCount],
  );
  const kebiReady = narrative.kebi >= narrative.kebiThreshold;

  const aiResult =
    endingType === "perfect_homecoming"
      ? "win"
      : endingType === "regretful_stay"
        ? "lose"
        : "lose";

  const aiInput: AIPromptInput = useMemo(
    () => ({
      stage,
      kebi: narrative.kebi,
      homeRepair: narrative.homeRepairTier * 33,
      survival: endingType === "storm_rescue" ? 0 : 1,
      battleSummary:
        battleSummary ??
        `归途终局 · 客批 ${narrative.kebi}/${narrative.kebiThreshold}`,
      result: aiResult,
    }),
    // Use primitives to avoid re-running on every render (narrative is a new object each time)
    [
      stage,
      narrative.kebi,
      narrative.kebiThreshold,
      narrative.homeRepairTier,
      battleSummary,
      aiResult,
      endingType,
    ],
  );

  const { playStorm, playOpen, playVoice, stopAll } = useEndingAudio({
    enabled: true,
    volume,
  });

  useEffect(() => {
    playStorm();
  }, [playStorm]);

  useEffect(() => {
    let cancelled = false;

    async function loadDigitalNarrative() {
      setLoadingDigital(true);
      const result = await requestDigitalLetter(aiInput);
      if (!cancelled) {
        setDigitalNarrative(result.letter);
        setLoadingDigital(false);
      }
    }

    void loadDigitalNarrative();
    return () => {
      cancelled = true;
    };
  }, [aiInput]);

  // Ensure the digital narrative has exactly `kebi` paragraphs:
  // trim down if too many, pad from fallback if too few
  const digitalScrollBody = useMemo(() => {
    if (!digitalNarrative) return "";
    const kebi = Math.max(1, narrative.kebi);
    const paragraphs = digitalNarrative.body
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length >= kebi) {
      return paragraphs.slice(0, kebi).join("\n\n");
    }
    // Pad with fallback paragraphs (avoiding duplicates)
    const fallback = pickDigitalLetterFallback(aiInput.stage + aiInput.kebi);
    const fallbackParas = fallback.body
      .split("\n\n")
      .map((p) => p.trim())
      .filter(Boolean)
      .filter((p) => !paragraphs.includes(p));
    const padding = fallbackParas.slice(0, kebi - paragraphs.length);
    return [...paragraphs, ...padding].join("\n\n");
  }, [digitalNarrative, narrative.kebi, aiInput.stage, aiInput.kebi]);

  const handleCatch = useCallback(() => {
    setCaughtCount((prev) => {
      const next = Math.min(prev + 1, letterCount);
      if (next >= letterCount) {
        setStep("reading");
        playOpen();
        playVoice(archivalLetters[0]!);
      }
      return next;
    });
  }, [letterCount, archivalLetters, playOpen, playVoice]);

  const handleSelectLetter = useCallback(
    (index: number) => {
      setSelectedLetterIndex(index);
      playOpen();
      playVoice(archivalLetters[index]!);
    },
    [archivalLetters, playOpen, playVoice],
  );

  const fragmentLabel =
    endingType === "storm_rescue" ? "碎片" : endingType === "regretful_stay" ? "信" : "批";

  return (
    <section
      className={cn(
        "kepi-ending-scene relative min-h-full overflow-y-auto text-amber-50",
        copy.sceneClass,
        className,
      )}
      data-ending-type={endingType}
      aria-label="结局过场"
    >
      <Image
        src={endingArtworkSrc(endingType)}
        alt=""
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {endingType === "storm_rescue" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[url('/images/ending/storm-bg.svg')] bg-cover bg-center opacity-35 mix-blend-overlay"
        />
      ) : null}

      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/55",
          endingType === "perfect_homecoming" && "from-amber-950/25 via-transparent to-amber-950/50",
          endingType === "storm_rescue" && "from-slate-950/55 via-slate-950/25 to-slate-950/70",
        )}
      />

      <div aria-hidden className="kepi-ending-vignette pointer-events-none absolute inset-0" />

      {endingType === "perfect_homecoming" ? (
        <div aria-hidden className="kepi-ending-lanterns pointer-events-none absolute inset-0" />
      ) : null}

      {endingType === "storm_rescue" ? (
        <div
          aria-hidden
          className="kepi-ending-wave-foreground pointer-events-none absolute inset-0"
        />
      ) : null}

      <div className="relative z-10 flex flex-col gap-6 p-6 md:p-10">
        <header className="space-y-3 text-center">
          <div className="mx-auto flex max-w-lg flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-100/20 bg-black/35 px-3 py-1 text-[0.6875rem] text-amber-100/90">
              <GameIcon src={UI.kebi} size={14} />
              客批 {narrative.kebi}/{narrative.kebiThreshold}
            </span>
            {kebiReady ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-950/35 px-3 py-1 text-[0.6875rem] text-emerald-50/95">
                <GameIcon src={ENDING.homewardTicketProp} size={16} />
                归乡票就绪
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/20 bg-black/30 px-3 py-1 text-[0.6875rem] text-amber-100/75">
                <GameIcon src={ENDING.homewardTicketProp} size={16} />
                归乡票未足
              </span>
            )}
          </div>

          <p className="text-xs tracking-[0.35em] text-amber-200/70 uppercase">
            {copy.badge}
          </p>
          <h1 className="font-heading text-3xl font-bold md:text-4xl">{copy.title}</h1>
          <p className="mx-auto max-w-2xl text-sm text-amber-100/85">{copy.intro}</p>
          {narrative.pawnedKebi > 0 ? (
            <p className="text-xs text-amber-200/60">
              本局曾典当 {narrative.pawnedKebi} 封客批 · 土楼庇护 {narrative.homeRepairTier} 阶
            </p>
          ) : null}
        </header>

        {step === "storm" || step === "catch" ? (
          <div className="space-y-4">
            <GestureLayer
              letterCount={letterCount}
              caughtCount={caughtCount}
              onCatch={handleCatch}
              onSlowTime={() => setSlowTime(true)}
              gestureMode={gestureMode}
              slowTime={slowTime}
              fragmentLabel={fragmentLabel}
            />

            {caughtCount >= letterCount ? (
              <div className="flex justify-center">
                <WoodButton
                  variant="primary"
                  className="px-5 py-2.5 text-sm"
                  onClick={() => setStep("reading")}
                >
                  开信阅读
                </WoodButton>
              </div>
            ) : (
              <div className="flex justify-center">
                <WoodButton
                  className="px-5 py-2.5 text-sm"
                  onClick={() => setStep("reading")}
                >
                  跳过接信，直接阅读
                </WoodButton>
              </div>
            )}
          </div>
        ) : null}

        {step === "reading" || step === "finale" ? (
          <div className="space-y-6">
            <LetterPicker
              letters={archivalLetters}
              selectedIndex={selectedLetterIndex}
              onSelect={handleSelectLetter}
            />
            <LetterViewer letter={archivalLetters[selectedLetterIndex]!} />

            {step === "reading" ? (
              <div className="flex justify-center">
                <WoodButton
                  variant="primary"
                  className="px-5 py-2.5 text-sm"
                  onClick={() => setStep("finale")}
                >
                  进入收尾字幕
                </WoodButton>
              </div>
            ) : null}
          </div>
        ) : null}

        {step === "finale" ? (
          <footer className="space-y-6 text-center">
            <div
              className="kepi-ending-subtitle-mask relative mx-auto max-w-2xl px-4 py-5"
              style={{
                backgroundImage: `linear-gradient(rgba(12,10,8,0.55), rgba(12,10,8,0.55)), url('${ENDING.subtitleMask}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <p className="text-sm leading-relaxed text-amber-50/95">
                {endingSubtitle(endingType, narrative)}
              </p>
            </div>

            {/* Digital narrative scrolling display */}
            {loadingDigital ? (
              <p className="text-xs text-amber-100/60">数字客批加载中…</p>
            ) : digitalNarrative ? (
              <DigitalLetterScroll
                title={digitalNarrative.title}
                narrative={digitalScrollBody}
              />
            ) : null}

            <div className="flex flex-wrap justify-center gap-3">
              {onComplete ? (
                <WoodButton
                  variant="primary"
                  className="px-5 py-2.5 text-sm"
                  onClick={() => {
                    stopAll();
                    onComplete();
                  }}
                >
                  重新开始
                </WoodButton>
              ) : null}
              <WoodButton
                className="px-5 py-2.5 text-sm"
                onClick={() => {
                  setStep("reading");
                  setSelectedLetterIndex(0);
                }}
              >
                重读侨批
              </WoodButton>
            </div>
          </footer>
        ) : null}
      </div>

      {slowTime ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[5] bg-[radial-gradient(circle_at_50%_40%,rgba(255,220,160,0.22),transparent_60%)] animate-pulse"
        />
      ) : null}
    </section>
  );
}
