import { create } from "zustand";
import type { ScenePhase } from "@/types";

type GameStore = {
  scene: ScenePhase;
  setScene: (scene: ScenePhase) => void;
};

export const useGameStore = create<GameStore>((set) => ({
  scene: "prep",
  setScene: (scene) => set({ scene }),
}));
