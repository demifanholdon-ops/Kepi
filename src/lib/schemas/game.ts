import { z } from "zod";

const boardPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const pieceTypeSchema = z.enum([
  "farmer",
  "guard",
  "teacher",
  "fengshui",
  "patriarch",
]);

export const enemyTypeSchema = z.enum([
  "qianhaibei",
  "luyinguanli",
  "zhuzaiqi",
  "ehushan",
  "hongtouchuan",
  "xiedouhuo",
]);

export const supportTypeSchema = z.enum(["shuike", "xiangxian"]);

export const rangeTypeSchema = z.enum(["melee", "mid", "ranged"]);

export const gameResultSchema = z.enum(["playing", "win", "lose"]).nullable();

export const scenePhaseSchema = z.enum([
  "prep",
  "battle",
  "settlement",
  "ending",
  "settings",
]);

export const gameStateSchema = z.object({
  stage: z.number().int().min(1),
  totalStages: z.number().int().min(1),
  survival: z.number().int().min(0),
  kebi: z.number().int().min(0),
  kebiThreshold: z.number().int().min(1),
  sangzi: z.number().int().min(0),
  homeRepair: z.number().min(0).max(100),
  gold: z.number().int().min(0),
  population: z.number().int().min(1),
  winStreak: z.number().int().min(0),
  loseStreak: z.number().int().min(0),
  result: gameResultSchema,
});

export const pieceSchema = z.object({
  id: z.string().min(1),
  type: pieceTypeSchema,
  cost: z.number().positive(),
  star: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  hp: z.number(),
  maxHp: z.number().positive(),
  atk: z.number().min(0),
  atkSpeed: z.number().min(0),
  armor: z.number().min(0),
  range: rangeTypeSchema,
  clan: z.string(),
  position: boardPositionSchema.nullable(),
});

export const enemySchema = z.object({
  id: z.string().min(1),
  type: enemyTypeSchema,
  hp: z.number(),
  maxHp: z.number().positive(),
  atk: z.number().min(0),
  atkSpeed: z.number().min(0),
  armor: z.number().min(0),
  range: rangeTypeSchema,
  position: boardPositionSchema,
});

export const supportUnitSchema = z.object({
  type: supportTypeSchema,
  slot: supportTypeSchema,
});

export const battleEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("attack"),
    sourceId: z.string(),
    targetId: z.string(),
    damage: z.number(),
  }),
  z.object({
    type: z.literal("kill"),
    unitId: z.string(),
  }),
  z.object({
    type: z.literal("skill"),
    sourceId: z.string(),
    skillId: z.string(),
  }),
  z.object({
    type: z.literal("roundEnd"),
  }),
]);

export const shopStateSchema = z.object({
  slots: z.array(pieceTypeSchema),
  refreshCost: z.number().int().min(0),
});

export const battleResultSchema = z.object({
  won: z.boolean(),
  tick: z.number().int().min(0),
  elapsedMs: z.number().min(0),
  events: z.array(battleEventSchema),
  alliesRemaining: z.number().int().min(0),
  enemiesRemaining: z.number().int().min(0),
  allyHpPercent: z.number().min(0),
  enemyHpPercent: z.number().min(0),
});

export const settlementSummarySchema = z.object({
  won: z.boolean(),
  kebiGained: z.number().int().min(0),
  sangziGained: z.number().int().min(0),
  sangziConsumed: z.number().int().min(0),
  homeRepairBefore: z.number().min(0).max(100),
  homeRepairGained: z.number().min(0).max(100),
  homeRepairAfter: z.number().min(0).max(100),
  survivalLost: z.number().int().min(0),
});

export const gameSnapshotSchema = z.object({
  version: z.number().int().min(1),
  phase: scenePhaseSchema,
  state: gameStateSchema,
  board: z.array(pieceSchema),
  shop: shopStateSchema,
  support: z.array(supportUnitSchema).length(2),
  battle: z
    .object({
      tick: z.number().int().min(0),
      elapsedMs: z.number().min(0),
      allies: z.array(pieceSchema),
      enemies: z.array(enemySchema),
      events: z.array(battleEventSchema),
      cooldowns: z.record(z.string(), z.number()).optional(),
      finished: z.boolean().optional(),
    })
    .nullable()
    .optional(),
  lastBattleResult: battleResultSchema.nullable().optional(),
  settlement: settlementSummarySchema.nullable().optional(),
});

export type GameSnapshotInput = z.infer<typeof gameSnapshotSchema>;
