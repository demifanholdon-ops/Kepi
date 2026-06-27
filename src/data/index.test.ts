import { describe, expect, it } from "vitest";
import {
  ARCHIVAL_LETTERS,
  BALANCE,
  DIGITAL_LETTER_FALLBACKS,
  ENEMIES,
  ENEMY_TYPES,
  PIECES,
  PIECE_TYPES,
  STAGES,
  SUPPORT_UNITS,
  enemyCount,
  pickDigitalLetterFallback,
  scaledEnemyStats,
  stageScalingFactor,
  streakBonus,
} from "@/data";
import { calcDamage, spawnEnemiesForStage } from "@/engine/battle";
import { createPiece } from "@/engine/shop";
import {
  archivalLetterSchema,
  balanceSchema,
  digitalLetterFallbackSchema,
  enemyDefinitionSchema,
  pieceDefinitionSchema,
  stageDefinitionSchema,
  supportDefinitionSchema,
} from "@/lib/schemas";

describe("static data schemas", () => {
  it("validates balance against PRD initial values", () => {
    expect(() => balanceSchema.parse(BALANCE)).not.toThrow();
    expect(BALANCE.initial.survival).toBe(2);
    expect(BALANCE.initial.kebiThreshold).toBe(5);
    expect(BALANCE.initial.gold).toBe(10);
    expect(BALANCE.initial.population).toBe(3);
  });

  it("validates all piece definitions", () => {
    for (const piece of Object.values(PIECES)) {
      expect(() => pieceDefinitionSchema.parse(piece)).not.toThrow();
    }
    expect(PIECE_TYPES).toHaveLength(5);
  });

  it("validates support unit definitions", () => {
    for (const unit of Object.values(SUPPORT_UNITS)) {
      expect(() => supportDefinitionSchema.parse(unit)).not.toThrow();
    }
  });

  it("validates all enemy definitions", () => {
    for (const enemy of Object.values(ENEMIES)) {
      expect(() => enemyDefinitionSchema.parse(enemy)).not.toThrow();
    }
    expect(ENEMY_TYPES).toHaveLength(6);
  });

  it("validates six stage definitions with scaling curve", () => {
    expect(STAGES).toHaveLength(6);
    for (const stage of STAGES) {
      expect(() => stageDefinitionSchema.parse(stage)).not.toThrow();
    }
    expect(stageScalingFactor(1)).toBe(1);
    expect(stageScalingFactor(3)).toBe(1.5);
    expect(stageScalingFactor(6)).toBe(2);
    expect(enemyCount(1)).toBe(3);
    expect(enemyCount(4)).toBe(4);
    expect(enemyCount(6)).toBe(5);
    expect(STAGES[0]?.boardAsset).toBe("/images/board/kepi_tulou-stage1-broken.png");
    expect(STAGES[1]?.boardAsset).toBe("/images/board/kepi_tulou-stage2-well.png");
  });

  it("validates archival and fallback letters", () => {
    for (const letter of ARCHIVAL_LETTERS) {
      expect(() => archivalLetterSchema.parse(letter)).not.toThrow();
    }
    expect(ARCHIVAL_LETTERS).toHaveLength(3);
    expect(ARCHIVAL_LETTERS[0]?.id).toBe("ye-heren-1887");
    expect(DIGITAL_LETTER_FALLBACKS.length).toBeGreaterThanOrEqual(8);
    for (const letter of DIGITAL_LETTER_FALLBACKS) {
      expect(() => digitalLetterFallbackSchema.parse(letter)).not.toThrow();
    }
  });
});

describe("static data engine consumption", () => {
  it("creates pieces from data templates with star scaling", () => {
    const farmer = createPiece("farmer", 1);
    expect(farmer.hp).toBe(PIECES.farmer.hp);
    expect(farmer.atk).toBe(PIECES.farmer.atk);

    const farmer2 = createPiece("farmer", 2);
    expect(farmer2.hp).toBe(PIECES.farmer.hp * 2);
    expect(farmer2.atk).toBe(PIECES.farmer.atk * 2);
  });

  it("spawns enemies using per-type stats, stage scaling, and battle HP factor", () => {
    const stage1 = spawnEnemiesForStage(1);
    expect(stage1).toHaveLength(3);
    const base = scaledEnemyStats(stage1[0]!.type, 1).hp;
    expect(stage1[0]?.hp).toBe(Math.max(1, Math.round(base * BALANCE.battle.enemyHpFactor)));

    const stage6 = spawnEnemiesForStage(6);
    expect(stage6).toHaveLength(5);
    const scaled = scaledEnemyStats("qianhaibei", 2).hp;
    expect(stage6[0]?.hp).toBe(Math.max(1, Math.round(scaled * BALANCE.battle.enemyHpFactor)));
  });

  it("uses PRD damage formula with battle multiplier", () => {
    const raw = (35 * 100) / (100 + 10);
    expect(calcDamage(35, 10)).toBeCloseTo(raw * BALANCE.battle.damageMultiplier, 2);
  });

  it("exposes economy streak bonuses from balance table", () => {
    expect(streakBonus(2, 0)).toBe(1);
    expect(streakBonus(0, 4)).toBe(3);
  });

  it("provides deterministic AI fallback letters", () => {
    const a = pickDigitalLetterFallback(42);
    const b = pickDigitalLetterFallback(42);
    expect(a.id).toBe(b.id);
  });
});
