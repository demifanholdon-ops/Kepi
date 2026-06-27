import type { ScenePhase } from "./index";

export type GameResult = "playing" | "win" | "lose" | null;

export type PieceType =
  | "farmer"
  | "guard"
  | "teacher"
  | "fengshui"
  | "patriarch";

export type EnemyType =
  | "qianhaibei"
  | "luyinguanli"
  | "zhuzaiqi"
  | "ehushan"
  | "hongtouchuan"
  | "xiedouhuo";

export type SupportType = "shuike" | "xiangxian";

export type RangeType = "melee" | "mid" | "ranged";

export type BoardPosition = { x: number; y: number };

export type GameState = {
  stage: number;
  totalStages: number;
  survival: number;
  kebi: number;
  kebiThreshold: number;
  sangzi: number;
  homeRepair: number;
  gold: number;
  population: number;
  winStreak: number;
  loseStreak: number;
  result: GameResult;
};

export type SettlementSummary = {
  won: boolean;
  kebiGained: number;
  sangziGained: number;
  sangziConsumed: number;
  homeRepairBefore: number;
  homeRepairGained: number;
  homeRepairAfter: number;
  survivalLost: number;
};

export type Piece = {
  id: string;
  type: PieceType;
  cost: number;
  star: 1 | 2 | 3;
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType;
  clan: string;
  position: BoardPosition | null;
};

export type Enemy = {
  id: string;
  type: EnemyType;
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType;
  position: BoardPosition;
};

export type SupportUnit = {
  type: SupportType;
  slot: SupportType;
};

export type BattleEvent =
  | { type: "attack"; sourceId: string; targetId: string; damage: number }
  | { type: "kill"; unitId: string }
  | { type: "skill"; sourceId: string; skillId: string }
  | { type: "roundEnd" };

export type BattleSnapshot = {
  tick: number;
  elapsedMs: number;
  allies: Piece[];
  enemies: Enemy[];
  events: BattleEvent[];
  cooldowns?: Record<string, number>;
  finished?: boolean;
};

export type BattleResult = {
  won: boolean;
  tick: number;
  elapsedMs: number;
  events: BattleEvent[];
  alliesRemaining: number;
  enemiesRemaining: number;
  allyHpPercent: number;
  enemyHpPercent: number;
};

export type BattleInput = {
  stage: number;
  allies: Piece[];
  enemies?: Enemy[];
};

export type ShopState = {
  slots: PieceType[];
  refreshCost: number;
};

export type GameSnapshot = {
  version: number;
  phase: ScenePhase;
  state: GameState;
  board: Piece[];
  shop: ShopState;
  support: SupportUnit[];
  battle?: BattleSnapshot | null;
  lastBattleResult?: BattleResult | null;
  settlement?: SettlementSummary | null;
};

export type GameAction =
  | { type: "BUY_PIECE"; pieceType: PieceType }
  | { type: "SELL_PIECE"; pieceId: string }
  | { type: "MOVE_PIECE"; pieceId: string; position: BoardPosition }
  | { type: "REFRESH_SHOP" }
  | { type: "BUY_POPULATION" }
  | { type: "START_BATTLE" }
  | { type: "BATTLE_TICK" }
  | { type: "END_BATTLE" }
  | { type: "APPLY_HOME_REPAIR" }
  | { type: "ADVANCE_STAGE" }
  | { type: "LOAD_SNAPSHOT"; snapshot: GameSnapshot };
