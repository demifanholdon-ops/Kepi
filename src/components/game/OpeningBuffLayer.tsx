"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import { BALANCE } from "@/data/balance";
import { OPENING_BUFF_TIMEOUT_WEAK } from "@/data/battleBuffs";
import { openingBuffIcon } from "@/lib/game/battleBuffUi";
import { playOpeningBuffSfx } from "@/lib/audio/sfx";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import { cn } from "@/lib/utils";
import { GameIcon, WoodButton, WoodPanel } from "@/components/game/ui";

const UI = ASSET_MANIFEST.ui;
const EFFECTS = ASSET_MANIFEST.effects;

export function OpeningBuffLayer() {
  const snapshot = useGameStore((state) => state.snapshot);
  const dispatch = useGameStore((state) => state.dispatch);
  const pushToast = useUIStore((state) => state.pushToast);
  const offered = snapshot.openingBuff?.offered;
  const phase = snapshot.phase;
  const sessionKey = offered ? `${phase}:${offered.id}` : phase;

  if (phase !== "opening_buff" || !offered) return null;

  return (
    <OpeningBuffSession
      key={sessionKey}
      offered={offered}
      dispatch={dispatch}
      pushToast={pushToast}
    />
  );
}

function OpeningBuffSession({
  offered,
  dispatch,
  pushToast,
}: {
  offered: NonNullable<ReturnType<typeof useGameStore.getState>["snapshot"]["openingBuff"]>["offered"];
  dispatch: ReturnType<typeof useGameStore.getState>["dispatch"];
  pushToast: ReturnType<typeof useUIStore.getState>["pushToast"];
}) {
  const [dismissed, setDismissed] = useState(false);
  const [flash, setFlash] = useState<"catch" | "miss" | null>(null);

  useEffect(() => {
    if (dismissed) return;

    const timer = window.setTimeout(() => {
      setDismissed(true);
      setFlash("miss");
      window.setTimeout(() => {
        dispatch({ type: "SKIP_OPENING_BUFF" });
        pushToast(`未抓住乡音符，获得弱 Buff：${OPENING_BUFF_TIMEOUT_WEAK.label}`, "default");
      }, 320);
    }, BALANCE.openingBuff.catchWindowMs);

    return () => window.clearTimeout(timer);
  }, [dismissed, dispatch, pushToast]);

  const catchBuff = () => {
    if (dismissed) return;
    setDismissed(true);
    setFlash("catch");
    playOpeningBuffSfx();
    window.setTimeout(() => {
      dispatch({ type: "CATCH_OPENING_BUFF" });
      pushToast(`抓住乡音符：${offered.label}`, "success");
    }, 280);
  };

  const skipBuff = () => {
    if (dismissed) return;
    dispatch({ type: "SKIP_OPENING_BUFF" });
    setDismissed(true);
  };

  const buffIcon = openingBuffIcon(offered.id);

  return (
    <div className="kepi-opening-buff-layer absolute inset-0 z-40 overflow-hidden bg-black/35 pt-[max(5.5rem,calc(env(safe-area-inset-top)+5rem))]">
      {flash === "catch" ? (
        <Image
          src={EFFECTS.openingNoteCatch}
          alt=""
          fill
          className="kepi-opening-buff-flash pointer-events-none object-cover mix-blend-screen"
          sizes="100vw"
          priority
        />
      ) : null}
      {flash === "miss" ? (
        <Image
          src={EFFECTS.openingNoteMiss}
          alt=""
          fill
          className="kepi-opening-buff-flash pointer-events-none object-cover opacity-80"
          sizes="100vw"
          priority
        />
      ) : null}

      <div className="flex h-full flex-col items-center justify-center px-[5%] pb-[18%]">
        <button
          type="button"
          className={cn(
            "kepi-opening-note pointer-events-auto flex flex-col items-center gap-2",
            flash === "catch" && "kepi-opening-note--caught",
            dismissed && "pointer-events-none opacity-0",
          )}
          onClick={catchBuff}
          aria-label={`抓取乡音符：${offered.label}`}
        >
          <span className="kepi-opening-note-orbit" aria-hidden>
            <GameIcon src={UI.openingNote} size={72} className="kepi-opening-note-icon" />
          </span>
          <span className="kepi-opening-note-card rounded-lg px-4 py-3 text-center">
            <span className="inline-flex items-center justify-center gap-2">
              <GameIcon src={buffIcon} size={22} />
              <span className="text-sm font-bold text-amber-50">{offered.label}</span>
            </span>
            <span className="mt-1 block text-xs text-amber-100/88">{offered.description}</span>
          </span>
        </button>

        <WoodPanel
          className="pointer-events-auto absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] mx-4 max-w-md"
          innerClassName="p-3"
        >
          <p className="text-xs leading-relaxed text-kepi-ink-muted">
            乡音符飘落——点击抓取本场开局 Buff。无摄像头也可 pointer 点击；超时将获得弱 Buff。
          </p>
          <WoodButton className="mt-2 w-full text-xs" onClick={skipBuff} disabled={dismissed}>
            跳过
          </WoodButton>
        </WoodPanel>
      </div>
    </div>
  );
}
