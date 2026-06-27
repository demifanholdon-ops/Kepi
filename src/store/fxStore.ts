import { create } from "zustand";

export type PrepFxKind =
  | "shop_refresh"
  | "star_up"
  | "letter_pickup"
  | "repair_home"
  | "buy_piece"
  | "population_up";

export type PrepFx = {
  id: string;
  kind: PrepFxKind;
  /** Normalized canvas X (0–1). */
  xRatio: number;
  /** Normalized canvas Y (0–1). */
  yRatio: number;
  startedAt: number;
  durationMs: number;
};

type FxStore = {
  prepFx: PrepFx[];
  pushPrepFx: (
    input: Omit<PrepFx, "id" | "startedAt"> & { startedAt?: number },
  ) => void;
  prunePrepFx: (now: number) => void;
  clearPrepFx: () => void;
};

let fxCounter = 0;

export const useFxStore = create<FxStore>((set, get) => ({
  prepFx: [],

  pushPrepFx: (input) => {
    fxCounter += 1;
    set({
      prepFx: [
        ...get().prepFx,
        {
          ...input,
          id: `prep_fx_${fxCounter}`,
          startedAt: input.startedAt ?? performance.now(),
        },
      ],
    });
  },

  prunePrepFx: (now) => {
    const next = get().prepFx.filter((fx) => now - fx.startedAt < fx.durationMs);
    if (next.length !== get().prepFx.length) {
      set({ prepFx: next });
    }
  },

  clearPrepFx: () => set({ prepFx: [] }),
}));

/** Map shop slot index (0–4) to approximate canvas anchor above the shop strip. */
export function shopSlotAnchor(index: number): { xRatio: number; yRatio: number } {
  const xRatio = 0.22 + index * 0.115;
  return { xRatio, yRatio: 0.84 };
}
