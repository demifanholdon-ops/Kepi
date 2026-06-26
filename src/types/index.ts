/** Cross-layer shared types. */

export type ScenePhase =
  | "prep"
  | "battle"
  | "settlement"
  | "ending"
  | "settings";

export type {
  BattleEvent,
  BattleInput,
  BattleResult,
  BattleSnapshot,
  BoardPosition,
  Enemy,
  EnemyType,
  GameAction,
  GameResult,
  GameSnapshot,
  GameState,
  Piece,
  PieceType,
  RangeType,
  ShopState,
  SupportType,
  SupportUnit,
} from "./game";
