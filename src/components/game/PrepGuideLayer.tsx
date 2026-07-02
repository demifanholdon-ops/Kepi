"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { isPrepInteractive } from "@/lib/game/prepUi";
import {
  nextPrepGuideStepFromBoard,
  prepGuideEnabled,
  prepGuidePrompt,
  type PrepGuideStep,
} from "@/lib/game/prepGuide";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1 as const, label: "购水客" },
  { id: 2 as const, label: "落后排" },
  { id: 3 as const, label: "开战" },
];

export function PrepGuideBanner() {
  const nodeId = useGameStore((state) => state.snapshot.state.currentNodeId);
  const prepGuideStep = useUIStore((state) => state.prepGuideStep);
  const prepSubview = useUIStore((state) => state.prepSubview);

  if (!isPrepInteractive(prepSubview) || !prepGuideEnabled(nodeId, prepGuideStep)) {
    return null;
  }

  const prompt = prepGuidePrompt(prepGuideStep);

  return (
    <div
      className="kepi-prep-guide-banner pointer-events-none min-w-0 flex-1"
      role="region"
      aria-label="首战斗引导"
    >
      <div className="kepi-prep-guide-banner-inner pointer-events-auto flex items-center gap-2 sm:gap-3">
        <ol className="flex shrink-0 items-center gap-0.5 sm:gap-1" aria-label="引导步骤">
          {STEPS.map((step, index) => {
            const done = typeof prepGuideStep === "number" && prepGuideStep > step.id;
            const active = prepGuideStep === step.id;

            return (
              <li key={step.id} className="flex items-center gap-0.5 sm:gap-1">
                {index > 0 ? (
                  <span className="kepi-prep-guide-banner-sep text-[0.55rem]" aria-hidden>
                    ·
                  </span>
                ) : null}
                <span
                  className={cn(
                    "kepi-prep-guide-banner-step whitespace-nowrap text-[0.625rem] font-medium sm:text-[0.6875rem]",
                    active && "kepi-prep-guide-banner-step--active",
                    done && "kepi-prep-guide-banner-step--done",
                  )}
                  aria-current={active ? "step" : undefined}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>

        {prompt ? (
          <p className="kepi-prep-guide-banner-prompt min-w-0 flex-1 truncate text-[0.625rem] leading-snug sm:text-[0.6875rem]">
            {prompt}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function PrepGuideLayer() {
  const phase = useGameStore((state) => state.snapshot.phase);
  const board = useGameStore((state) => state.snapshot.board);
  const nodeId = useGameStore((state) => state.snapshot.state.currentNodeId);
  const prepGuideStep = useUIStore((state) => state.prepGuideStep);
  const prepSubview = useUIStore((state) => state.prepSubview);
  const setPrepGuideStep = useUIStore((state) => state.setPrepGuideStep);
  const pushToast = useUIStore((state) => state.pushToast);
  const step3ToastShown = useRef(false);

  useEffect(() => {
    if (phase !== "prep" || !isPrepInteractive(prepSubview)) return;
    if (!prepGuideEnabled(nodeId, prepGuideStep)) return;
    const next = nextPrepGuideStepFromBoard(prepGuideStep, board);
    if (next !== prepGuideStep) {
      setPrepGuideStep(next);
    }
  }, [phase, prepSubview, nodeId, prepGuideStep, board, setPrepGuideStep]);

  useEffect(() => {
    if (prepGuideStep !== 3) {
      step3ToastShown.current = false;
      return;
    }
    if (!prepGuideEnabled(nodeId, prepGuideStep) || step3ToastShown.current) return;
    step3ToastShown.current = true;
    pushToast("水客已在后排，可以开战了", "default");
  }, [prepGuideStep, nodeId, pushToast]);

  if (
    phase !== "prep" ||
    !isPrepInteractive(prepSubview) ||
    !prepGuideEnabled(nodeId, prepGuideStep)
  ) {
    return null;
  }

  return (
    <>
      <div className="pointer-events-none absolute inset-0 z-[22]" aria-hidden>
        {prepGuideStep === 2 ? <BackRowHighlight /> : null}
      </div>
    </>
  );
}

function BackRowHighlight() {
  return (
    <div className="kepi-prep-guide-backrow pointer-events-none absolute" aria-hidden />
  );
}

export function prepGuideTargetClass(
  target: "buy-shuike" | "start-battle",
  currentStep: PrepGuideStep,
): string | undefined {
  if (currentStep === "done") return undefined;
  if (target === "start-battle" && currentStep === 3) return "kepi-prep-guide-target";
  return undefined;
}
