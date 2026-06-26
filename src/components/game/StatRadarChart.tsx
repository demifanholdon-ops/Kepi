"use client";

import type { RadarAxis } from "@/lib/game/inspectRadar";

type StatRadarChartProps = {
  stats: RadarAxis[];
  stroke: string;
  fill: string;
  size?: number;
};

export function StatRadarChart({
  stats,
  stroke,
  fill,
  size = 96,
}: StatRadarChartProps) {
  const n = stats.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const angleOffset = -Math.PI / 2;

  const polar = (index: number, ratio: number) => {
    const angle = angleOffset + (2 * Math.PI * index) / n;
    return {
      x: cx + Math.cos(angle) * radius * ratio,
      y: cy + Math.sin(angle) * radius * ratio,
    };
  };

  const ring = (ratio: number) =>
    stats
      .map((_, index) => {
        const { x, y } = polar(index, ratio);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";

  const dataPath =
    stats
      .map((stat, index) => {
        const { x, y } = polar(index, stat.value);
        return `${index === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ") + " Z";

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden
    >
      {[0.25, 0.5, 0.75, 1].map((level) => (
        <path
          key={level}
          d={ring(level)}
          fill="none"
          stroke={stroke}
          strokeOpacity={0.18}
          strokeWidth={0.75}
        />
      ))}

      {stats.map((stat, index) => {
        const outer = polar(index, 1.08);
        const axis = polar(index, 1);
        return (
          <g key={stat.label}>
            <line
              x1={cx}
              y1={cy}
              x2={axis.x}
              y2={axis.y}
              stroke={stroke}
              strokeOpacity={0.14}
              strokeWidth={0.75}
            />
            <text
              x={outer.x}
              y={outer.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="currentColor"
              className="fill-kepi-ink-muted text-[7px] font-medium"
            >
              {stat.label}
            </text>
          </g>
        );
      })}

      <path d={dataPath} fill={fill} fillOpacity={0.38} stroke={stroke} strokeWidth={1.5} />
      {stats.map((stat, index) => {
        const { x, y } = polar(index, stat.value);
        return (
          <circle key={`${stat.label}-dot`} cx={x} cy={y} r={2.2} fill={stroke} fillOpacity={0.9} />
        );
      })}
    </svg>
  );
}
