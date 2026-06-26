import { loadCachedImage, type ImageCache } from "@/lib/game/imageCache";
import {
  resolveTransitionOverlay,
  resolveTulouBackgroundLayers,
} from "@/lib/game/tulouBackground";
import type { CanvasRenderState, CanvasTheme } from "./types";

/** Image focal point for object-cover crop (matches tulou courtyard center). */
const BG_FOCAL_X = 0.5;
const BG_FOCAL_Y = 0.46;

export function renderBackgroundLayer(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  const { width, height } = state.metrics;
  const layers = resolveTulouBackgroundLayers(state.homeRepair);
  let drewAny = false;

  for (const layer of layers) {
    if (layer.alpha <= 0) continue;
    const img = loadCachedImage(state.imageCache, layer.src, state.requestRepaint);
    if (!img) continue;

    ctx.save();
    ctx.globalAlpha = layer.alpha;
    drawCoverImage(ctx, img, width, height, BG_FOCAL_X, BG_FOCAL_Y);
    ctx.restore();
    drewAny = true;
  }

  const overlay = resolveTransitionOverlay(state.homeRepair);
  if (overlay) {
    const img = loadCachedImage(state.imageCache, overlay.src, state.requestRepaint);
    if (img) {
      ctx.save();
      ctx.globalAlpha = overlay.alpha;
      drawCoverImage(ctx, img, width, height, BG_FOCAL_X, BG_FOCAL_Y);
      ctx.restore();
      drewAny = true;
    }
  }

  if (state.transitionBurst) {
    const burstAlpha = Math.sin(state.transitionBurst.progress * Math.PI) * 0.68;
    const img = loadCachedImage(
      state.imageCache,
      state.transitionBurst.src,
      state.requestRepaint,
    );
    if (img && burstAlpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = burstAlpha;
      drawCoverImage(ctx, img, width, height, BG_FOCAL_X, BG_FOCAL_Y);
      ctx.restore();
      drewAny = true;
    }
  }

  if (!drewAny) {
    ctx.fillStyle = theme.sceneFallback;
    ctx.fillRect(0, 0, width, height);
    return;
  }

  drawWarmOverlay(ctx, width, height);
  drawAtriumGlow(ctx, state, theme);
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  width: number,
  height: number,
  focalX: number,
  focalY: number,
): void {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const canvasRatio = width / height;

  let drawW: number;
  let drawH: number;
  let dx: number;
  let dy: number;

  if (canvasRatio > imgRatio) {
    drawW = width;
    drawH = width / imgRatio;
    dx = 0;
    dy = height * focalY - drawH * focalY;
  } else {
    drawH = height;
    drawW = height * imgRatio;
    dx = width * focalX - drawW * focalX;
    dy = 0;
  }

  ctx.drawImage(img, dx, dy, drawW, drawH);
}

function drawWarmOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "rgba(232, 168, 73, 0.1)");
  gradient.addColorStop(0.55, "rgba(245, 234, 214, 0.04)");
  gradient.addColorStop(1, "rgba(61, 46, 31, 0.14)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawAtriumGlow(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
  theme: CanvasTheme,
): void {
  const { width, height } = state.metrics;
  const cx = width * BG_FOCAL_X;
  const cy = height * BG_FOCAL_Y;
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, width * 0.22);
  glow.addColorStop(0, theme.tulouGlow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.globalAlpha = 0.12 + state.homeRepair / 600;
  ctx.fillRect(0, 0, width, height);
  ctx.globalAlpha = 1;
}

export type { ImageCache };
