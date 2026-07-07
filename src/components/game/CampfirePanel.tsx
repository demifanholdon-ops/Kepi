"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import {
  campfireBackgroundForScenario,
  campfireGlowModeForScenario,
  campfireScenarioForNode,
  campfireUsesCinematicFlow,
  campfireUsesTextOnlyChoices,
  CAMPFIRE_BACKGROUND_FALLBACK,
  type CampfireChoice,
  type CampfireGlowMode,
  type CampfireScenario,
} from "@/data/campfire";
import { currentJourneyNode } from "@/engine";
import { useGameStore } from "@/store/gameStore";
import { playCampfireChoiceSfx } from "@/lib/audio/sfx";
import { cn } from "@/lib/utils";
import { GameIcon } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;

const AFTERMATH_MS = 2_500;

type CampfireBeat = "opening" | "choice" | "aftermath";

function CampfireBeatHeader({
  nodeLabel,
  subtitle,
}: {
  nodeLabel: string;
  subtitle?: string;
}) {
  return (
    <div className="kepi-campfire-beat-header">
      <p className="text-[0.65rem] font-medium tracking-[0.2em] text-amber-200/80">
        篝火夜话
      </p>
      <h2 className="mt-2 text-xl font-bold text-amber-50 sm:text-2xl">{nodeLabel}</h2>
      {subtitle ? (
        <p className="mt-2 text-[0.65rem] font-medium tracking-[0.16em] text-amber-200/72">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

function effectIcon(kind: CampfireChoice["effect"]["kind"]) {
  switch (kind) {
    case "gold":
      return UI.gold;
    case "homeRepair":
      return UI.homeRepair;
    case "nextBattleDebuff":
      return UI.buffWind;
    case "kebiHint":
      return UI.homewardTicket;
    default:
      return UI.homewardTicket;
  }
}

export function CampfirePanel() {
  const snapshot = useGameStore((state) => state.snapshot);
  const phase = snapshot.phase;
  const node = phase === "campfire" ? currentJourneyNode(snapshot) : null;
  const scenario = node ? campfireScenarioForNode(node.id) : null;

  if (phase !== "campfire" || !node || !scenario) return null;

  if (!campfireUsesCinematicFlow(node.id)) {
    return null;
  }

  return (
    <CampfireCinematic
      key={node.id}
      nodeLabel={node.label}
      scenario={scenario}
    />
  );
}

function CampfireCinematic({
  nodeLabel,
  scenario,
}: {
  nodeLabel: string;
  scenario: CampfireScenario;
}) {
  const snapshot = useGameStore((state) => state.snapshot);
  const dispatch = useGameStore((state) => state.dispatch);
  const { state } = snapshot;

  const [beat, setBeat] = useState<CampfireBeat>("opening");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aftermath, setAftermath] = useState<{
    choice: CampfireChoice;
    goldBefore: number;
    repairBefore: number;
  } | null>(null);

  const selected = scenario.choices.find((choice) => choice.id === selectedId) ?? null;
  const textOnly = campfireUsesTextOnlyChoices(scenario);

  useEffect(() => {
    if (!aftermath) return;

    const timer = window.setTimeout(() => {
      dispatch({ type: "PICK_CAMPFIRE_CHOICE", choiceId: aftermath.choice.id });
    }, AFTERMATH_MS);

    return () => window.clearTimeout(timer);
  }, [aftermath, dispatch]);

  const confirmChoice = (choice: CampfireChoice) => {
    playCampfireChoiceSfx();
    setAftermath({
      choice,
      goldBefore: state.gold,
      repairBefore: state.homeRepair,
    });
    setBeat("aftermath");
  };

  const handleSelectChoice = (choice: CampfireChoice) => {
    setSelectedId(choice.id);
  };

  const backgroundSrc = campfireBackgroundForScenario(scenario);
  const glowMode = campfireGlowModeForScenario(scenario);

  return (
    <div
      className={cn(
        "kepi-campfire-scene absolute inset-0 z-30 overflow-hidden",
        scenario.id === "camp-share-rations" && "kepi-campfire-scene--nanyang",
      )}
      aria-live="polite"
    >
      <CampfireBackdrop src={backgroundSrc} fallbackSrc={CAMPFIRE_BACKGROUND_FALLBACK} />

      <CampfireGlowLayer mode={glowMode} beat={beat} />

      <div className="kepi-campfire-stage relative z-10">
        <div className="kepi-campfire-stage__content">
          {beat === "opening" ? (
            <CampfireOpening
              nodeLabel={nodeLabel}
              actLabel={scenario.openingActLabel}
              opening={scenario.opening}
              onContinue={() => setBeat("choice")}
            />
          ) : null}

          {beat === "choice" ? (
            <CampfireChoiceBeat
              nodeLabel={nodeLabel}
              actLabel={scenario.choiceActLabel}
              choiceHint={scenario.choiceHint}
              scenarioId={scenario.id}
              prompt={scenario.prompt}
              choices={scenario.choices}
              selectedId={selectedId}
              textOnly={textOnly}
              onSelect={handleSelectChoice}
              onConfirm={() => {
                if (selected) confirmChoice(selected);
              }}
            />
          ) : null}

          {beat === "aftermath" && aftermath ? (
            <CampfireAftermath
              choice={aftermath.choice}
              goldBefore={aftermath.goldBefore}
              repairBefore={aftermath.repairBefore}
              textOnly={textOnly}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}

function CampfireBackdrop({
  src,
  fallbackSrc,
}: {
  src: string;
  fallbackSrc: string;
}) {
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setCurrentSrc(src);
  }, [src]);

  return (
    <div className="kepi-campfire-vignette pointer-events-none absolute inset-0 z-0" aria-hidden>
      <Image
        src={currentSrc}
        alt=""
        fill
        priority
        className="object-cover object-[center_42%] sm:object-[center_38%]"
        sizes="100vw"
        onError={() => {
          if (currentSrc !== fallbackSrc) {
            setCurrentSrc(fallbackSrc);
          }
        }}
      />
    </div>
  );
}

function CampfireGlowLayer({
  mode,
  beat,
}: {
  mode: CampfireGlowMode;
  beat: CampfireBeat;
}) {
  if (mode === "none") return null;

  const subtleOnly = mode === "subtle" && beat === "opening";

  return (
    <div
      className={cn(
        "kepi-campfire-glow pointer-events-none absolute inset-x-0 bottom-0 top-[58%] z-[1] sm:top-[52%]",
        subtleOnly && "kepi-campfire-glow--opening",
        mode === "subtle" && "kepi-campfire-glow--subtle",
      )}
      aria-hidden
    >
      <Image
        src={ASSET_MANIFEST.effects.campfireGlow}
        alt=""
        fill
        className="object-contain object-bottom opacity-45 mix-blend-screen sm:opacity-50"
        sizes="100vw"
      />
    </div>
  );
}

function CampfireOpening({
  nodeLabel,
  actLabel,
  opening,
  onContinue,
}: {
  nodeLabel: string;
  actLabel?: string;
  opening: readonly string[];
  onContinue: () => void;
}) {
  return (
    <div className="kepi-campfire-beat kepi-campfire-beat--opening pointer-events-auto w-full max-w-xl">
      <div className="kepi-campfire-narrative px-5 py-6 sm:px-7 sm:py-8">
        <CampfireBeatHeader nodeLabel={nodeLabel} subtitle={actLabel} />
        <div className="mt-5 space-y-3">
          {opening.map((line) => (
            <p key={line} className="text-sm leading-relaxed text-amber-50/92 sm:text-base">
              {line}
            </p>
          ))}
        </div>
        <div className="mt-7 flex justify-end border-t border-dashed border-amber-200/22 pt-5">
          <button
            type="button"
            className="kepi-campfire-continue"
            onClick={onContinue}
          >
            <span>听下去</span>
            <span className="kepi-campfire-continue__mark" aria-hidden>
              ›
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

const SPLIT_CHOICE_EYEBROWS: Record<string, string> = {
  "share-gold": "留给同行",
  "share-repair": "寄回故乡",
  "route-gold": "抄近攒盘缠",
  "route-caution": "稳着走",
};

const SPLIT_CHOICE_SCENARIOS = new Set(["camp-share-rations", "camp-old-route"]);

function CampfireChoiceBeat({
  nodeLabel,
  actLabel,
  choiceHint,
  scenarioId,
  prompt,
  choices,
  selectedId,
  textOnly,
  onSelect,
  onConfirm,
}: {
  nodeLabel: string;
  actLabel?: string;
  choiceHint?: string;
  scenarioId: string;
  prompt: string;
  choices: [CampfireChoice, CampfireChoice];
  selectedId: string | null;
  textOnly: boolean;
  onSelect: (choice: CampfireChoice) => void;
  onConfirm: () => void;
}) {
  const splitChoices = SPLIT_CHOICE_SCENARIOS.has(scenarioId);
  const showEffectLabels = splitChoices;
  const hintCopy = choiceHint ?? "此夜抉择将影响接下来的路。";

  return (
    <div
      className={cn(
        "kepi-campfire-beat kepi-campfire-beat--choice pointer-events-auto w-full max-w-xl",
        textOnly && splitChoices && "kepi-campfire-beat--choice-ration",
      )}
    >
      <div
        className={cn(
          "kepi-campfire-narrative kepi-campfire-narrative--choice px-5 pt-6 pb-4 sm:px-7 sm:pt-8 sm:pb-5",
          textOnly && splitChoices && "kepi-campfire-narrative--choice-ration",
        )}
      >
        <div className="kepi-campfire-choice-header">
          <CampfireBeatHeader
            nodeLabel={nodeLabel}
            subtitle={actLabel ?? "夜话抉择"}
          />
          <p
            className={cn(
              "text-sm leading-relaxed text-amber-50/88 sm:text-base",
              textOnly && splitChoices ? "mt-3" : "mt-4",
            )}
          >
            {prompt}
          </p>
        </div>

        {textOnly && splitChoices ? (
          <CampfireSplitChoices
            choices={choices}
            selectedId={selectedId}
            showEffectLabels={showEffectLabels}
            onSelect={onSelect}
          />
        ) : (
          <div
            className={cn(
              "kepi-campfire-choice-list mt-5",
              splitChoices && "kepi-campfire-choice-list--split",
            )}
            role="group"
            aria-label="夜话抉择"
          >
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                className={cn(
                  "kepi-campfire-choice-option text-left",
                  selectedId === choice.id && "kepi-campfire-choice-option--selected",
                  splitChoices && `kepi-campfire-choice-option--half-${index}`,
                  !splitChoices && `kepi-campfire-choice-option--stack-${index}`,
                )}
                onClick={() => onSelect(choice)}
                aria-pressed={selectedId === choice.id}
              >
                <p className="kepi-campfire-choice-option__title">{choice.title}</p>
                <p className="kepi-campfire-choice-option__desc">{choice.description}</p>
                {!textOnly ? (
                  <span className="kepi-campfire-choice-option__effect">
                    <GameIcon src={effectIcon(choice.effect.kind)} size={16} />
                    <span>{choice.effect.label}</span>
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        )}

        {textOnly ? (
          <div className="kepi-campfire-choice-footer">
            <p className="kepi-campfire-choice-footer__hint kepi-campfire-choice-footer__hint--soft text-center">
              {hintCopy}
            </p>
            <div className="kepi-campfire-choice-footer__cta mt-4 flex justify-end border-t border-dashed border-amber-200/22 pt-4">
              <button
                type="button"
                className="kepi-campfire-continue"
                disabled={!selectedId}
                onClick={onConfirm}
              >
                <span>今夜如此</span>
                <span className="kepi-campfire-continue__mark" aria-hidden>
                  ›
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="kepi-campfire-choice-footer">
            <p className="kepi-campfire-choice-footer__hint text-center text-[0.625rem] tracking-[0.06em] text-amber-200/55">
              此夜抉择将影响接下来的路。
            </p>
            <div className="kepi-campfire-choice-footer__cta flex justify-end border-t border-dashed border-amber-200/22 pt-3">
              <button
                type="button"
                className="kepi-campfire-confirm"
                disabled={!selectedId}
                onClick={onConfirm}
              >
                <span>今夜如此</span>
                <span className="kepi-campfire-continue__mark" aria-hidden>
                  ›
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CampfireSplitChoices({
  choices,
  selectedId,
  showEffectLabels,
  onSelect,
}: {
  choices: [CampfireChoice, CampfireChoice];
  selectedId: string | null;
  showEffectLabels?: boolean;
  onSelect: (choice: CampfireChoice) => void;
}) {
  const sides = [
    { side: "left" as const, choice: choices[0]! },
    { side: "right" as const, choice: choices[1]! },
  ];

  return (
    <div className="kepi-campfire-ration-split mt-3" role="group" aria-label="夜话抉择">
      <div className="kepi-campfire-ration-split__seam" aria-hidden>
        <span className="kepi-campfire-ration-split__ember" />
      </div>

      {sides.map(({ side, choice }) => {
        const eyebrow = SPLIT_CHOICE_EYEBROWS[choice.id] ?? "夜话";

        return (
          <button
            key={choice.id}
            type="button"
            className={cn(
              "kepi-campfire-ration-card",
              `kepi-campfire-ration-card--${side}`,
              selectedId === choice.id && "kepi-campfire-ration-card--selected",
            )}
            onClick={() => onSelect(choice)}
            aria-pressed={selectedId === choice.id}
          >
            <span className="kepi-campfire-ration-card__fold" aria-hidden />
            <span className="kepi-campfire-ration-card__eyebrow">{eyebrow}</span>
            <p className="kepi-campfire-ration-card__title">{choice.title}</p>
            <p className="kepi-campfire-ration-card__desc">{choice.description}</p>
            {showEffectLabels ? (
              <span className="kepi-campfire-ration-card__effect">
                <GameIcon
                  src={effectIcon(choice.effect.kind)}
                  size={16}
                  className="kepi-campfire-ration-card__effect-icon"
                />
                <span className="kepi-campfire-ration-card__effect-label">
                  {choice.effect.label}
                </span>
              </span>
            ) : null}
            <span className="kepi-campfire-ration-card__mark" aria-hidden />
          </button>
        );
      })}
    </div>
  );
}

function CampfireAftermath({
  choice,
  goldBefore,
  repairBefore,
  textOnly,
}: {
  choice: CampfireChoice;
  goldBefore: number;
  repairBefore: number;
  textOnly: boolean;
}) {
  const effect = choice.effect;
  const goldAfter =
    effect.kind === "gold" ? goldBefore + (effect.gold ?? 0) : goldBefore;
  const repairAfter =
    effect.kind === "homeRepair"
      ? Math.min(100, repairBefore + (effect.homeRepair ?? 0))
      : repairBefore;

  return (
    <div className="kepi-campfire-beat kepi-campfire-beat--aftermath pointer-events-none w-full max-w-md text-center">
      <div className="kepi-campfire-narrative px-6 py-8">
        <p className="text-lg font-bold text-amber-50">{choice.title}</p>
        <p className="mt-4 text-sm leading-relaxed text-amber-50/90 sm:text-base">
          「{choice.aftermath}」
        </p>

        {!textOnly && effect.kind === "gold" ? (
          <p className="kepi-campfire-stat-pop mt-6 inline-flex items-center gap-2 text-sm text-amber-100">
            <GameIcon src={UI.gold} size={18} />
            <span>盘缠 {goldBefore}</span>
            <span aria-hidden>→</span>
            <span className="font-semibold text-amber-50">{goldAfter}</span>
          </p>
        ) : null}

        {!textOnly && effect.kind === "homeRepair" ? (
          <p className="kepi-campfire-stat-pop mt-6 inline-flex items-center gap-2 text-sm text-amber-100">
            <GameIcon src={UI.homeRepair} size={18} />
            <span>家园修复 {repairBefore}%</span>
            <span aria-hidden>→</span>
            <span className="font-semibold text-amber-50">{repairAfter}%</span>
          </p>
        ) : null}

        {!textOnly && effect.kind === "nextBattleDebuff" ? (
          <p className="kepi-campfire-stat-pop mt-6 inline-flex items-center gap-2 text-sm text-amber-100">
            <GameIcon src={UI.buffWind} size={18} />
            <span className="font-semibold text-amber-50">{effect.label}</span>
            <span className="text-amber-100/80">· 下一场战斗生效</span>
          </p>
        ) : null}

        {!textOnly && effect.kind === "kebiHint" ? (
          <p className="kepi-campfire-stat-pop mt-6 inline-flex items-center gap-2 text-sm text-amber-100">
            <GameIcon src={UI.homewardTicket} size={18} />
            <span className="font-semibold text-amber-50">{effect.label}</span>
          </p>
        ) : null}

        {!textOnly &&
        effect.kind !== "gold" &&
        effect.kind !== "homeRepair" &&
        effect.kind !== "nextBattleDebuff" &&
        effect.kind !== "kebiHint" ? (
          <p className="kepi-campfire-stat-pop mt-6 inline-flex items-center gap-2 text-sm text-amber-100">
            <GameIcon src={effectIcon(effect.kind)} size={18} />
            <span className="font-semibold text-amber-50">{effect.label}</span>
          </p>
        ) : null}

        <p className="mt-6 text-[0.65rem] tracking-[0.16em] text-amber-200/70">夜话将尽…</p>
      </div>
    </div>
  );
}
