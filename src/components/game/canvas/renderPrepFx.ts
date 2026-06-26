import { ASSET_MANIFEST } from "@/data/assets";
import { loadCachedImage } from "@/lib/game/imageCache";
import type { PrepFx } from "@/store/fxStore";
import type { CanvasRenderState } from "./types";

const FX_SRC: Record<PrepFx["kind"], string> = {
  shop_refresh: ASSET_MANIFEST.effects.shopRefresh,
  star_up: ASSET_MANIFEST.effects.starUp,
  letter_pickup: ASSET_MANIFEST.effects.letterPickup,
  buy_piece: ASSET_MANIFEST.effects.starUp,
  population_up: ASSET_MANIFEST.effects.starUp,
};

export const PREP_FX_SRCS = [
  ASSET_MANIFEST.effects.shopRefresh,
  ASSET_MANIFEST.effects.starUp,
  ASSET_MANIFEST.effects.letterPickup,
] as const;

export function renderPrepFxLayer(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  prepFx: PrepFx[],
): void {
  if (prepFx.length === 0) return;

  const { width, height } = state.metrics;
  const now = state.timeMs;

  for (const fx of prepFx) {
    const elapsed = now - fx.startedAt;
    const t = elapsed / fx.durationMs;
    if (t >= 1) continue;

    const src = FX_SRC[fx.kind];
    const img = loadCachedImage(state.imageCache, src, state.requestRepaint);
    if (!img?.naturalWidth) continue;

    const x = fx.xRatio * width;
    const y = fx.yRatio * height;
    const fade = 1 - t ** 1.6;
    const pulse = 0.75 + 0.25 * Math.sin(t * Math.PI);
    const baseSize =
      fx.kind === "letter_pickup"
        ? state.metrics.cellSize * 2.4
        : fx.kind === "shop_refresh"
          ? state.metrics.cellSize * 2
          : state.metrics.cellSize * 1.65;
    const size = baseSize * (0.85 + t * 0.35) * pulse;

    ctx.save();
    ctx.globalCompositeOperation = "lighten";
    ctx.globalAlpha = fade * (fx.kind === "letter_pickup" ? 0.92 : 0.78);
    ctx.drawImage(img, x - size / 2, y - size / 2, size, size);

    if (fx.kind === "letter_pickup" && t < 0.55) {
      const trail = ctx.createRadialGradient(x, y, 0, x, y, size * 0.9);
      trail.addColorStop(0, `rgba(245, 234, 214, ${0.35 * (1 - t / 0.55)})`);
      trail.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = trail;
      ctx.fillRect(x - size, y - size, size * 2, size * 2);
    }

    ctx.restore();
  }
}
