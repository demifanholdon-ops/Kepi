import { create } from "zustand";

import { shouldShowStageBrief } from "@/lib/game/prepUi";
import { PREP_GUIDE_NODE_ID, resolvePrepGuideStep, type PrepGuideStep } from "@/lib/game/prepGuide";
import type { Piece } from "@/types";
import type { PrepSubview } from "@/lib/game/prepUi";
import type { UnitInspectInfo } from "@/lib/game/unitInspect";

export type DomPieceInspect = {
  info: UnitInspectInfo;
  anchorX: number;
  anchorY: number;
};

export type ToastVariant = "default" | "success" | "error";

export type ToastMessage = {
  id: string;
  message: string;
  variant: ToastVariant;
};

export type DialogState = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (() => void) | null;
};

export type HoveredUnit = {
  side: "ally" | "enemy";
  unitId: string;
  anchorX: number;
  anchorY: number;
};

type UIStore = {
  debugOpen: boolean;
  setDebugOpen: (open: boolean) => void;
  /** @deprecated Use supportPopoverOpen — kept for bench layout fallback. */
  letterStripExpanded: boolean;
  setLetterStripExpanded: (open: boolean) => void;
  supportPopoverOpen: boolean;
  setSupportPopoverOpen: (open: boolean) => void;
  prepSubview: PrepSubview;
  seenStageBriefNodeIds: string[];
  prepGuideStep: PrepGuideStep;
  enterPrepNode: (nodeId: string, board?: Piece[]) => void;
  dismissStageBrief: (nodeId: string, board?: Piece[]) => void;
  skipPrepGuide: () => void;
  markPrepGuideDone: () => void;
  setPrepGuideStep: (step: PrepGuideStep) => void;
  prepDockExpanded: boolean;
  setPrepDockExpanded: (expanded: boolean) => void;
  bottomDockHeightPx: number;
  setBottomDockHeightPx: (height: number) => void;
  domPieceInspect: DomPieceInspect | null;
  setDomPieceInspect: (inspect: DomPieceInspect | null) => void;
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  /** Hide chrome settings while victory cinematic plays (settlement). */
  settlementCinematicActive: boolean;
  setSettlementCinematicActive: (active: boolean) => void;
  hoveredUnit: HoveredUnit | null;
  setHoveredUnit: (unit: HoveredUnit | null) => void;
  toasts: ToastMessage[];
  pushToast: (message: string, variant?: ToastVariant) => void;
  dismissToast: (id: string) => void;
  dialog: DialogState;
  openDialog: (input: Omit<DialogState, "open">) => void;
  closeDialog: () => void;
};

let toastCounter = 0;

const emptyDialog: DialogState = {
  open: false,
  title: "",
  description: "",
  confirmLabel: "确认",
  onConfirm: null,
};

export const useUIStore = create<UIStore>((set, get) => ({
  debugOpen: false,
  setDebugOpen: (debugOpen) => set({ debugOpen }),

  letterStripExpanded: false,
  setLetterStripExpanded: (letterStripExpanded) => set({ letterStripExpanded }),

  supportPopoverOpen: false,
  setSupportPopoverOpen: (supportPopoverOpen) => set({ supportPopoverOpen }),

  prepSubview: "active",
  seenStageBriefNodeIds: [],
  prepGuideStep: 1,

  enterPrepNode: (nodeId, board = []) => {
    const seen = new Set(get().seenStageBriefNodeIds);
    if (shouldShowStageBrief(nodeId, seen)) {
      set({ prepSubview: "stage_brief", supportPopoverOpen: false });
      return;
    }
    const guideStep = get().prepGuideStep;
    const nextGuideStep =
      nodeId === PREP_GUIDE_NODE_ID && guideStep !== "done"
        ? resolvePrepGuideStep(board)
        : guideStep;
    set({
      prepSubview: "active",
      prepGuideStep: nextGuideStep,
      prepDockExpanded:
        nodeId === PREP_GUIDE_NODE_ID &&
        nextGuideStep !== "done" &&
        nextGuideStep === 1,
    });
  },

  dismissStageBrief: (nodeId, board = []) => {
    const seen = get().seenStageBriefNodeIds;
    const nextSeen = seen.includes(nodeId) ? seen : [...seen, nodeId];
    const guideStep = get().prepGuideStep;
    const nextGuideStep =
      nodeId === PREP_GUIDE_NODE_ID && guideStep !== "done"
        ? resolvePrepGuideStep(board)
        : guideStep;
    set({
      prepSubview: "active",
      seenStageBriefNodeIds: nextSeen,
      prepGuideStep: nextGuideStep,
      prepDockExpanded:
        nodeId === PREP_GUIDE_NODE_ID &&
        nextGuideStep !== "done" &&
        nextGuideStep === 1,
    });
  },

  skipPrepGuide: () => set({ prepGuideStep: "done" }),

  markPrepGuideDone: () => set({ prepGuideStep: "done" }),

  setPrepGuideStep: (prepGuideStep) => set({ prepGuideStep }),

  prepDockExpanded: false,
  setPrepDockExpanded: (prepDockExpanded) => set({ prepDockExpanded }),

  bottomDockHeightPx: 0,
  setBottomDockHeightPx: (bottomDockHeightPx) => set({ bottomDockHeightPx }),

  domPieceInspect: null,
  setDomPieceInspect: (domPieceInspect) => set({ domPieceInspect }),

  settingsOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),

  settlementCinematicActive: false,
  setSettlementCinematicActive: (settlementCinematicActive) =>
    set({ settlementCinematicActive }),

  hoveredUnit: null,
  setHoveredUnit: (hoveredUnit) => set({ hoveredUnit }),

  toasts: [],
  pushToast: (message, variant = "default") => {
    toastCounter += 1;
    const id = `toast_${toastCounter}`;
    set({ toasts: [...get().toasts, { id, message, variant }] });
    window.setTimeout(() => get().dismissToast(id), 3200);
  },
  dismissToast: (id) =>
    set({ toasts: get().toasts.filter((toast) => toast.id !== id) }),

  dialog: emptyDialog,
  openDialog: (input) => set({ dialog: { ...input, open: true } }),
  closeDialog: () => set({ dialog: emptyDialog }),
}));
