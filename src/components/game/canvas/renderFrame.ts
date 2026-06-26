import {
  renderForegroundAtmosphere,
  renderSceneAtmosphere,
} from "./renderAtmosphere";
import { renderBackgroundLayer } from "./renderBackground";
import { renderBoardLayer } from "./renderBoard";
import { buildBattleEffects, renderEffectsLayer } from "./renderEffects";
import { renderPrepFxLayer } from "./renderPrepFx";
import { renderUnitsLayer } from "./renderPieces";
import { readCanvasTheme, type CanvasRenderState } from "./types";

export function renderGameCanvas(
  ctx: CanvasRenderingContext2D,
  state: CanvasRenderState,
): void {
  const theme = readCanvasTheme(state.tulouStage);
  const { width, height } = state.metrics;

  ctx.clearRect(0, 0, width, height);
  renderBackgroundLayer(ctx, state, theme);
  renderSceneAtmosphere(ctx, state);
  renderBoardLayer(ctx, state, theme);
  renderUnitsLayer(ctx, state, theme);
  renderEffectsLayer(
    ctx,
    state.effects,
    state.metrics,
    state.imageCache,
    state.requestRepaint,
  );
  renderPrepFxLayer(ctx, state, state.prepFx);
  renderForegroundAtmosphere(ctx, state);
}

export { buildBattleEffects, readCanvasTheme };
export type { CanvasRenderState };
