import { create } from "zustand";
import { createInitialSnapshot, reduceGameState } from "@/engine";
import { saveSnapshot } from "@/lib/storage/snapshot";
import { useUIStore } from "@/store/uiStore";
import type { BoardPosition, GameAction, GameSnapshot, PieceType } from "@/types";

type GameStore = {
  snapshot: GameSnapshot;
  selectedPieceId: string | null;
  dispatch: (action: GameAction) => void;
  setSelectedPiece: (pieceId: string | null) => void;
  buyFromShop: (pieceType: PieceType) => boolean;
  sellSelected: () => boolean;
  moveSelected: (position: BoardPosition) => boolean;
  startBattle: () => boolean;
  endBattle: () => void;
  advanceStage: () => void;
  resetGame: () => void;
  replaceSnapshot: (snapshot: GameSnapshot) => void;
};

function persist(snapshot: GameSnapshot): void {
  if (snapshot.phase !== "settings") {
    saveSnapshot(snapshot);
  }
}

function apply(
  set: (partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void,
  get: () => GameStore,
  action: GameAction,
): boolean {
  const prev = get().snapshot;
  const next = reduceGameState(prev, action);
  if (next === prev) return false;
  set({ snapshot: next });
  persist(next);
  return true;
}

export const useGameStore = create<GameStore>((set, get) => ({
  snapshot: createInitialSnapshot(),
  selectedPieceId: null,

  dispatch: (action) => {
    apply(set, get, action);
  },

  setSelectedPiece: (selectedPieceId) => {
    useUIStore.getState().setHoveredUnit(null);
    set({ selectedPieceId });
  },

  buyFromShop: (pieceType) => {
    const prevBoardLen = get().snapshot.board.length;
    const ok = apply(set, get, { type: "BUY_PIECE", pieceType });
    if (!ok) return false;
    const board = get().snapshot.board;
    const bought = board[board.length - 1];
    if (board.length > prevBoardLen && bought) {
      set({ selectedPieceId: bought.id });
    }
    return true;
  },

  sellSelected: () => {
    const id = get().selectedPieceId;
    if (!id) return false;
    const ok = apply(set, get, { type: "SELL_PIECE", pieceId: id });
    if (ok) set({ selectedPieceId: null });
    return ok;
  },

  moveSelected: (position) => {
    const id = get().selectedPieceId;
    if (!id) return false;
    return apply(set, get, { type: "MOVE_PIECE", pieceId: id, position });
  },

  startBattle: () => {
    if (get().snapshot.board.length === 0) return false;
    return apply(set, get, { type: "START_BATTLE" });
  },

  endBattle: () => {
    apply(set, get, { type: "END_BATTLE" });
  },

  advanceStage: () => {
    const ok = apply(set, get, { type: "ADVANCE_STAGE" });
    if (ok && get().snapshot.phase === "prep") {
      useUIStore.getState().setDomPieceInspect(null);
      set({ selectedPieceId: null });
    }
  },

  resetGame: () => {
    const next = createInitialSnapshot();
    set({ snapshot: next, selectedPieceId: null });
    persist(next);
  },

  replaceSnapshot: (snapshot) => {
    set({ snapshot, selectedPieceId: null });
    persist(snapshot);
  },
}));
