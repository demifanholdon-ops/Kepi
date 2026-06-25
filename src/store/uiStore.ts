import { create } from "zustand";

type UIStore = {
  debugOpen: boolean;
  setDebugOpen: (open: boolean) => void;
};

export const useUIStore = create<UIStore>((set) => ({
  debugOpen: false,
  setDebugOpen: (debugOpen) => set({ debugOpen }),
}));
