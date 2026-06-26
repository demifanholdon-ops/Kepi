import type {
  BattleEvent,
  BattleInput,
  BattleResult,
  Enemy,
  Piece,
} from "@/types";
import { ENEMY_TYPES, scaledEnemyStats } from "@/data";
import { layoutEnemyPositions } from "@/lib/game/boardLayout";
import {
  BATTLE_MAX_MS,
  BATTLE_TICK_MS,
  enemyCountForStage,
  stageScaling,
} from "../constants";

type CombatUnit = {
  id: string;
  side: "ally" | "enemy";
  hp: number;
  maxHp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
};

export function calcDamage(atk: number, armor: number): number {
  return (atk * 100) / (100 + armor);
}

export function spawnEnemiesForStage(stage: number): Enemy[] {
  const count = enemyCountForStage(stage);
  const scale = stageScaling(stage);

  return Array.from({ length: count }, (_, index) => {
    const type = ENEMY_TYPES[index % ENEMY_TYPES.length]!;
    const stats = scaledEnemyStats(type, scale);
    const positions = layoutEnemyPositions(count);

    return {
      id: `enemy_${stage}_${index}`,
      type,
      hp: stats.hp,
      maxHp: stats.maxHp,
      atk: stats.atk,
      atkSpeed: stats.atkSpeed,
      armor: stats.armor,
      range: stats.range,
      position: positions[index]!,
    };
  });
}

function toCombatUnit(piece: Piece): CombatUnit {
  return {
    id: piece.id,
    side: "ally",
    hp: piece.hp,
    maxHp: piece.maxHp,
    atk: piece.atk,
    atkSpeed: piece.atkSpeed,
    armor: piece.armor,
  };
}

function enemyToCombatUnit(enemy: Enemy): CombatUnit {
  return {
    id: enemy.id,
    side: "enemy",
    hp: enemy.hp,
    maxHp: enemy.maxHp,
    atk: enemy.atk,
    atkSpeed: enemy.atkSpeed,
    armor: enemy.armor,
  };
}

function pickTarget(
  attacker: CombatUnit,
  units: CombatUnit[],
): CombatUnit | null {
  const opponents = units.filter(
    (unit) => unit.side !== attacker.side && unit.hp > 0,
  );
  if (opponents.length === 0) return null;

  return opponents.reduce((weakest, current) =>
    current.hp < weakest.hp ? current : weakest,
  );
}

function hpPercent(units: CombatUnit[]): number {
  const totalMax = units.reduce((sum, unit) => sum + unit.maxHp, 0);
  if (totalMax === 0) return 0;
  const totalHp = units.reduce((sum, unit) => sum + Math.max(unit.hp, 0), 0);
  return (totalHp / totalMax) * 100;
}

export function simulateBattle(input: BattleInput): BattleResult {
  const enemies = input.enemies ?? spawnEnemiesForStage(input.stage);
  const fightingAllies = input.allies.filter((piece) => piece.hp > 0);

  const allyUnits = fightingAllies.map(toCombatUnit);
  const enemyUnits = enemies.map(enemyToCombatUnit);
  const units = [...allyUnits, ...enemyUnits];
  const events: BattleEvent[] = [];

  const cooldowns = new Map<string, number>(
    units.map((unit) => [unit.id, 0]),
  );

  let tick = 0;
  const maxTicks = BATTLE_MAX_MS / BATTLE_TICK_MS;

  while (tick < maxTicks) {
    const livingAllies = allyUnits.filter((unit) => unit.hp > 0);
    const livingEnemies = enemyUnits.filter((unit) => unit.hp > 0);

    if (livingAllies.length === 0 || livingEnemies.length === 0) {
      break;
    }

    for (const unit of units) {
      if (unit.hp <= 0) continue;

      const elapsed = tick * BATTLE_TICK_MS;
      const intervalMs = unit.atkSpeed > 0 ? 1000 / unit.atkSpeed : Infinity;
      const readyAt = cooldowns.get(unit.id) ?? 0;

      if (elapsed < readyAt) continue;

      const target = pickTarget(unit, units);
      if (!target) continue;

      const damage = calcDamage(unit.atk, target.armor);
      target.hp -= damage;
      events.push({
        type: "attack",
        sourceId: unit.id,
        targetId: target.id,
        damage,
      });

      if (target.hp <= 0) {
        events.push({ type: "kill", unitId: target.id });
      }

      cooldowns.set(unit.id, elapsed + intervalMs);
    }

    tick += 1;
  }

  const alliesRemaining = allyUnits.filter((unit) => unit.hp > 0).length;
  const enemiesRemaining = enemyUnits.filter((unit) => unit.hp > 0).length;

  let won = false;
  if (enemiesRemaining === 0 && alliesRemaining > 0) {
    won = true;
  } else if (alliesRemaining === 0) {
    won = false;
  } else {
    won = hpPercent(allyUnits) >= hpPercent(enemyUnits);
  }

  events.push({ type: "roundEnd" });

  return {
    won,
    tick,
    elapsedMs: tick * BATTLE_TICK_MS,
    events,
    alliesRemaining,
    enemiesRemaining,
    allyHpPercent: hpPercent(allyUnits),
    enemyHpPercent: hpPercent(enemyUnits),
  };
}
