"use client";

import { StatRadarChart } from "@/components/game/StatRadarChart";
import { WoodPanel } from "@/components/game/ui";
import {
  buildInspectRadar,
  INSPECT_CARD_HEIGHT,
  INSPECT_CARD_WIDTH,
} from "@/lib/game/inspectRadar";
import type { UnitInspectInfo } from "@/lib/game/unitInspect";
import { cn } from "@/lib/utils";

export function InspectCard({ info }: { info: UnitInspectInfo }) {
  const isEnemy = info.side === "enemy";
  const accent = isEnemy ? "#c1121f" : "#4a6fa5";
  const fill = isEnemy ? "rgba(193, 18, 31, 0.35)" : "rgba(74, 111, 165, 0.35)";
  const radar = buildInspectRadar(info);
  const hpText =
    info.hp < info.maxHp ? `${info.hp} / ${info.maxHp}` : `${info.maxHp}`;

  return (
    <WoodPanel
      className="w-[min(15.5rem,calc(100vw-1.5rem))] shadow-lg"
      innerClassName="px-3 py-2.5"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className={cn(
              "truncate text-sm font-bold",
              isEnemy ? "text-kepi-enemy" : "text-kepi-accent",
            )}
          >
            {info.name}
          </h3>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.625rem] text-kepi-ink-muted">
            {info.star ? <span className="text-kepi-gold">★{info.star}</span> : null}
            <span className="tabular-nums">生命 {hpText}</span>
          </div>
        </div>
        {info.badge ? (
          <span className="shrink-0 rounded-sm bg-kepi-panel px-1.5 py-0.5 text-[0.6rem] text-kepi-ink-muted ring-1 ring-kepi-panel-border/40">
            {info.badge}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-center gap-1">
        <StatRadarChart stats={radar} stroke={accent} fill={fill} size={104} />
        <dl className="grid min-w-[4.5rem] grid-cols-1 gap-1 text-[0.625rem]">
          <MiniStat label="攻" value={String(info.atk)} />
          <MiniStat label="甲" value={String(info.armor)} />
          <MiniStat label="速" value={info.atkSpeed.toFixed(2)} />
          <MiniStat label="距" value={info.rangeLabel} />
        </dl>
      </div>

      <p className="mt-2 border-t border-kepi-panel-border/25 pt-2 text-[0.6875rem] leading-relaxed text-kepi-ink-muted">
        {info.description}
      </p>
    </WoodPanel>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 tabular-nums">
      <dt className="text-kepi-ink-muted">{label}</dt>
      <dd className="font-medium text-kepi-ink">{value}</dd>
    </div>
  );
}

export type InspectPlacement = "above" | "below";

export function clampInspectAnchor(
  anchorX: number,
  anchorY: number,
  panelWidth: number = INSPECT_CARD_WIDTH,
  panelHeight: number = INSPECT_CARD_HEIGHT,
): { x: number; anchorY: number; gap: number; placement: InspectPlacement } {
  const margin = 12;
  const gap = 14;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;

  const x = Math.max(
    margin + panelWidth / 2,
    Math.min(vw - margin - panelWidth / 2, anchorX),
  );

  const placement: InspectPlacement =
    anchorY - panelHeight - gap >= margin ? "above" : "below";

  return { x, anchorY, gap, placement };
}

export function inspectCardTransform(placement: InspectPlacement, gap: number): string {
  return placement === "above"
    ? `translate(-50%, calc(-100% - ${gap}px))`
    : `translate(-50%, ${gap}px)`;
}
