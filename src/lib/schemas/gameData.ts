import { z } from "zod";

const rangeSchema = z.enum(["melee", "mid", "ranged"]);

export const pieceDefinitionSchema = z.object({
  type: z.enum(["farmer", "guard", "teacher", "fengshui", "patriarch"]),
  name: z.string().min(1),
  cost: z.number().int().min(1).max(5),
  hp: z.number().int().positive(),
  atk: z.number().int().nonnegative(),
  atkSpeed: z.number().positive(),
  armor: z.number().int().nonnegative(),
  range: rangeSchema,
  clan: z.string().min(1),
  skillId: z.string().min(1),
  description: z.string().min(1),
  assetId: z.string().min(1),
  portrait: z.string().startsWith("/images/"),
});

export const supportDefinitionSchema = z.object({
  type: z.enum(["shuike", "xiangxian"]),
  name: z.string().min(1),
  costTier: z.number().positive(),
  hp: z.number().int().positive(),
  atk: z.number().int().nonnegative(),
  atkSpeed: z.number().nonnegative(),
  armor: z.number().int().nonnegative(),
  range: rangeSchema.nullable(),
  description: z.string().min(1),
  assetId: z.string().min(1),
  portrait: z.string().startsWith("/images/"),
});

export const enemyDefinitionSchema = z.object({
  type: z.enum([
    "qianhaibei",
    "luyinguanli",
    "zhuzaiqi",
    "ehushan",
    "hongtouchuan",
    "xiedouhuo",
  ]),
  name: z.string().min(1),
  assetId: z.string().min(1),
  portrait: z.string().startsWith("/images/"),
  hp: z.number().int().positive(),
  atk: z.number().int().positive(),
  atkSpeed: z.number().positive(),
  armor: z.number().int().nonnegative(),
  range: rangeSchema,
  historicalNote: z.string().min(1),
  description: z.string().min(1),
});

export const stageDefinitionSchema = z.object({
  stage: z.number().int().min(1).max(6),
  name: z.string().min(1),
  enemyCount: z.number().int().min(1).max(6),
  scaling: z.number().positive(),
  enemyPool: z.array(enemyDefinitionSchema.shape.type).min(1),
  prepTimeSec: z.number().int().positive(),
  difficulty: z.enum(["tutorial", "normal", "hard"]),
  aiDynamic: z.boolean(),
  boardAsset: z.string().startsWith("/images/"),
});

export const balanceSchema = z.object({
  snapshotVersion: z.number().int().positive(),
  initial: z.object({
    stage: z.literal(1),
    totalStages: z.literal(6),
    survival: z.literal(2),
    kebi: z.literal(0),
    kebiThreshold: z.literal(5),
    sangzi: z.literal(0),
    homeRepair: z.literal(0),
    gold: z.literal(10),
    population: z.literal(3),
    winStreak: z.literal(0),
    loseStreak: z.literal(0),
    result: z.null(),
  }),
  population: z.object({
    max: z.literal(6),
    upgradeCost: z.number().int().positive(),
  }),
  economy: z.object({
    roundWage: z.literal(5),
    interestPerTenGold: z.literal(1),
    maxInterest: z.literal(5),
    shopRefreshCost: z.literal(2),
    shopSlotCount: z.literal(5),
    streakBonuses: z.object({
      2: z.literal(1),
      3: z.literal(2),
      4: z.literal(3),
    }),
  }),
  battle: z.object({
    tickMs: z.literal(8),
    maxMs: z.literal(40_000),
    ticksPerFrameCap: z.literal(22),
    prepTimeSec: z.literal(30),
    damageFormula: z.literal("atk * 100 / (100 + armor)"),
    enemyHpFactor: z.literal(0.55),
    damageMultiplier: z.literal(1.75),
  }),
  progression: z.object({
    sangziPerWin: z.number().int().positive(),
    homeRepairPerWin: z.number().int().positive(),
    starHpAtkMultiplier: z.literal(2),
  }),
});

export const archivalLetterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  originalText: z.string().min(1),
  modernText: z.string().min(1),
  source: z.string().min(1),
  voiceAudio: z.string().nullable(),
});

export const digitalLetterFallbackSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  body: z.string().min(1),
  tags: z.array(z.string()).min(1),
});
