import type { GameSnapshot, Piece, PieceStar, PieceType } from "@/types";
import {
  MAX_POPULATION,
  MAX_STAR,
  PIECE_TEMPLATES,
  POPULATION_UPGRADE_COST,
  SHOP_REFRESH_COST,
  SHOP_SLOT_COUNT,
  STAR_HP_ATK_MULTIPLIER,
} from "../constants";

const PIECE_TYPES = Object.keys(PIECE_TEMPLATES) as PieceType[];

let pieceCounter = 0;

export function resetPieceCounter(forTests = 0): void {
  pieceCounter = forTests;
}

function nextPieceId(type: PieceType): string {
  pieceCounter += 1;
  return `${type}_${pieceCounter}`;
}

function scaleStat(base: number, star: PieceStar): number {
  return base * STAR_HP_ATK_MULTIPLIER ** (star - 1);
}

export function createPiece(
  type: PieceType,
  star: PieceStar = 1,
  id?: string,
): Piece {
  if (star < 1 || star > MAX_STAR) {
    throw new Error(`Invalid star level: ${star}`);
  }

  const template = PIECE_TEMPLATES[type];
  const hp = scaleStat(template.hp, star);
  const atk = scaleStat(template.atk, star);

  return {
    id: id ?? nextPieceId(type),
    type,
    cost: template.cost,
    star,
    hp,
    maxHp: hp,
    atk,
    atkSpeed: template.atkSpeed,
    armor: template.armor,
    range: template.range,
    clan: template.clan,
    position: null,
  };
}

function rollShopSlots(stage: number): PieceType[] {
  const maxCost = Math.min(5, 2 + Math.floor((stage - 1) / 2));
  const pool = PIECE_TYPES.filter((type) => PIECE_TEMPLATES[type].cost <= maxCost);

  const slots: PieceType[] = [];
  const used = new Set<number>();

  for (let i = 0; i < SHOP_SLOT_COUNT; i += 1) {
    if (i < pool.length) {
      const pick = pool[(stage + i) % pool.length]!;
      slots.push(pick);
      continue;
    }

    let idx = (stage * 5 + i * 3) % pool.length;
    let guard = 0;
    while (used.has(idx) && guard < pool.length) {
      idx = (idx + 1) % pool.length;
      guard += 1;
    }
    used.add(idx);
    slots.push(pool[idx]!);
  }

  return slots;
}

export function rollShop(snapshot: GameSnapshot): GameSnapshot {
  return {
    ...snapshot,
    shop: {
      slots: rollShopSlots(snapshot.state.stage),
      refreshCost: SHOP_REFRESH_COST,
    },
  };
}

function boardLengthAfterBuy(board: Piece[], pieceType: PieceType): number {
  const sameOnes = board.filter((piece) => piece.type === pieceType && piece.star === 1);
  if (sameOnes.length >= 2) {
    return board.length - 1;
  }
  return board.length + 1;
}

/** Merge 3 matching 1-star pieces into one 2-star (V2.0 cap). */
export function mergeMatchingOneStars(
  board: Piece[],
  pieceType: PieceType,
): Piece[] {
  const matches = board.filter((piece) => piece.type === pieceType && piece.star === 1);
  if (matches.length < 3) return board;

  const removeIds = new Set(matches.slice(0, 3).map((piece) => piece.id));
  const merged = createPiece(pieceType, 2);
  return [...board.filter((piece) => !removeIds.has(piece.id)), merged];
}

export function buyPiece(
  snapshot: GameSnapshot,
  pieceType: PieceType,
): GameSnapshot {
  const template = PIECE_TEMPLATES[pieceType];
  const { state, board, shop } = snapshot;

  if (boardLengthAfterBuy(board, pieceType) > state.population) return snapshot;
  if (state.gold < template.cost) return snapshot;
  if (!shop.slots.includes(pieceType)) return snapshot;

  const nextBoard = mergeMatchingOneStars([...board, createPiece(pieceType)], pieceType);

  return {
    ...snapshot,
    state: {
      ...state,
      gold: state.gold - template.cost,
    },
    board: nextBoard,
  };
}

export function sellRefund(piece: Piece): number {
  if (piece.star === 1) return piece.cost;
  return piece.cost * 3;
}

export function sellPiece(snapshot: GameSnapshot, pieceId: string): GameSnapshot {
  const piece = snapshot.board.find((entry) => entry.id === pieceId);
  if (!piece) return snapshot;

  return {
    ...snapshot,
    state: {
      ...snapshot.state,
      gold: snapshot.state.gold + sellRefund(piece),
    },
    board: snapshot.board.filter((entry) => entry.id !== pieceId),
  };
}

export function movePiece(
  snapshot: GameSnapshot,
  pieceId: string,
  position: Piece["position"] & object,
): GameSnapshot {
  const exists = snapshot.board.some((entry) => entry.id === pieceId);
  if (!exists) return snapshot;

  return {
    ...snapshot,
    board: snapshot.board.map((entry) =>
      entry.id === pieceId ? { ...entry, position } : entry,
    ),
  };
}

/** New prep phase: remove casualties, heal survivors, return all to bench. */
export function recallBoardToBench(snapshot: GameSnapshot): GameSnapshot {
  return {
    ...snapshot,
    board: snapshot.board
      .filter((piece) => piece.hp > 0)
      .map((piece) => ({ ...piece, hp: piece.maxHp, position: null })),
  };
}

export function refreshShop(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.state.gold < snapshot.shop.refreshCost) return snapshot;

  const rolled = rollShop({
    ...snapshot,
    state: {
      ...snapshot.state,
      gold: snapshot.state.gold - snapshot.shop.refreshCost,
    },
  });

  return rolled;
}

export function buyPopulation(snapshot: GameSnapshot): GameSnapshot {
  const { state } = snapshot;
  if (state.population >= MAX_POPULATION) return snapshot;
  if (state.gold < POPULATION_UPGRADE_COST) return snapshot;

  return {
    ...snapshot,
    state: {
      ...state,
      gold: state.gold - POPULATION_UPGRADE_COST,
      population: state.population + 1,
    },
  };
}
