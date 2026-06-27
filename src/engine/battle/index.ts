import type {
  BattleEvent,
  BattleInput,
  BattleResult,
  BattleSnapshot,
  Enemy,
  Piece,
} from "@/types";
import { ENEMY_TYPES, scaledEnemyStats } from "@/data";
import { layoutEnemyPositions } from "@/lib/game/boardLayout";
import {
  BATTLE_DAMAGE_MULTIPLIER,
  BATTLE_ENEMY_HP_FACTOR,
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

type BattleRuntime = {
  allyUnits: CombatUnit[];
  enemyUnits: CombatUnit[];
  cooldowns: Map<string, number>;
};

export function calcDamage(atk: number, armor: number): number {
  return (atk * 100 * BATTLE_DAMAGE_MULTIPLIER) / (100 + armor);
}

export function spawnEnemiesForStage(stage: number): Enemy[] {
  const count = enemyCountForStage(stage);
  const scale = stageScaling(stage);

  return Array.from({ length: count }, (_, index) => {
    const type = ENEMY_TYPES[index % ENEMY_TYPES.length]!;
    const stats = scaledEnemyStats(type, scale);
    const positions = layoutEnemyPositions(count);

    const scaledHp = Math.max(1, Math.round(stats.hp * BATTLE_ENEMY_HP_FACTOR));

    return {
      id: `enemy_${stage}_${index}`,
      type,
      hp: scaledHp,
      maxHp: scaledHp,
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

function syncUnitsToSnapshot(
  battle: BattleSnapshot,
  allyUnits: CombatUnit[],
  enemyUnits: CombatUnit[],
): BattleSnapshot {
  const allyHp = new Map(allyUnits.map((unit) => [unit.id, unit.hp]));
  const enemyHp = new Map(enemyUnits.map((unit) => [unit.id, unit.hp]));

  return {
    ...battle,
    allies: battle.allies.map((ally) => ({
      ...ally,
      hp: Math.max(0, allyHp.get(ally.id) ?? ally.hp),
    })),
    enemies: battle.enemies.map((enemy) => ({
      ...enemy,
      hp: Math.max(0, enemyHp.get(enemy.id) ?? enemy.hp),
    })),
  };
}

function runtimeFromSnapshot(battle: BattleSnapshot): BattleRuntime {
  return {
    allyUnits: battle.allies.map(toCombatUnit),
    enemyUnits: battle.enemies.map(enemyToCombatUnit),
    cooldowns: new Map(Object.entries(battle.cooldowns ?? {})),
  };
}

function buildBattleResult(
  allyUnits: CombatUnit[],
  enemyUnits: CombatUnit[],
  tick: number,
  events: BattleEvent[],
  timedOut: boolean,
): BattleResult {
  const alliesRemaining = allyUnits.filter((unit) => unit.hp > 0).length;
  const enemiesRemaining = enemyUnits.filter((unit) => unit.hp > 0).length;
  const allyHpPercent = hpPercent(allyUnits);
  const enemyHpPercent = hpPercent(enemyUnits);

  let won: boolean;
  if (enemiesRemaining === 0 && alliesRemaining > 0) {
    // PRD §5.1.4: wipe the enemy side.
    won = true;
  } else if (alliesRemaining === 0) {
    won = false;
  } else if (timedOut) {
    // PRD §3.2: timeout compares remaining HP%; tie counts as a loss.
    won = allyHpPercent > enemyHpPercent;
  } else {
    won = false;
  }

  return {
    won,
    tick,
    elapsedMs: tick * BATTLE_TICK_MS,
    events,
    alliesRemaining,
    enemiesRemaining,
    allyHpPercent,
    enemyHpPercent,
  };
}

export function createBattleSnapshot(input: BattleInput): BattleSnapshot {
  const enemies = structuredClone(input.enemies ?? spawnEnemiesForStage(input.stage));
  const allies = structuredClone(
    input.allies.filter((piece) => piece.hp > 0),
  );
  const unitIds = [
    ...allies.map((piece) => piece.id),
    ...enemies.map((enemy) => enemy.id),
  ];

  return {
    tick: 0,
    elapsedMs: 0,
    allies,
    enemies,
    events: [],
    cooldowns: Object.fromEntries(unitIds.map((id) => [id, 0])),
    finished: false,
  };
}

export function advanceBattleTick(battle: BattleSnapshot): {
  battle: BattleSnapshot;
  finished: boolean;
  result: BattleResult | null;
} {
  if (battle.finished) {
    return { battle, finished: true, result: null };
  }

  const maxTicks = BATTLE_MAX_MS / BATTLE_TICK_MS;
  const tick = battle.tick;
  const { allyUnits, enemyUnits, cooldowns } = runtimeFromSnapshot(battle);
  const units = [...allyUnits, ...enemyUnits];
  const newEvents: BattleEvent[] = [];

  const livingAllies = allyUnits.filter((unit) => unit.hp > 0);
  const livingEnemies = enemyUnits.filter((unit) => unit.hp > 0);

  if (livingAllies.length === 0 || livingEnemies.length === 0 || tick >= maxTicks) {
    const events = [...battle.events, { type: "roundEnd" as const }];
    const result = buildBattleResult(
      allyUnits,
      enemyUnits,
      tick,
      events,
      tick >= maxTicks && livingAllies.length > 0 && livingEnemies.length > 0,
    );
    const synced = syncUnitsToSnapshot(
      {
        ...battle,
        tick,
        elapsedMs: tick * BATTLE_TICK_MS,
        events,
        cooldowns: Object.fromEntries(cooldowns),
        finished: true,
      },
      allyUnits,
      enemyUnits,
    );
    return { battle: synced, finished: true, result };
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
    newEvents.push({
      type: "attack",
      sourceId: unit.id,
      targetId: target.id,
      damage,
    });

    if (target.hp <= 0) {
      newEvents.push({ type: "kill", unitId: target.id });
    }

    cooldowns.set(unit.id, elapsed + intervalMs);
  }

  const nextTick = tick + 1;
  const livingAfter = {
    allies: allyUnits.filter((unit) => unit.hp > 0).length,
    enemies: enemyUnits.filter((unit) => unit.hp > 0).length,
  };
  const timedOut = nextTick >= maxTicks;
  const combatEnded = livingAfter.allies === 0 || livingAfter.enemies === 0;

  let events = [...battle.events, ...newEvents];
  let finished = combatEnded || timedOut;
  let result: BattleResult | null = null;

  if (finished) {
    events = [...events, { type: "roundEnd" }];
    result = buildBattleResult(
      allyUnits,
      enemyUnits,
      nextTick,
      events,
      timedOut && livingAfter.allies > 0 && livingAfter.enemies > 0,
    );
  }

  const nextBattle = syncUnitsToSnapshot(
    {
      ...battle,
      tick: nextTick,
      elapsedMs: nextTick * BATTLE_TICK_MS,
      events,
      cooldowns: Object.fromEntries(cooldowns),
      finished,
    },
    allyUnits,
    enemyUnits,
  );

  return { battle: nextBattle, finished, result };
}

export function simulateBattle(input: BattleInput): BattleResult {
  let battle = createBattleSnapshot(input);
  let result: BattleResult | null = null;
  const maxSteps = BATTLE_MAX_MS / BATTLE_TICK_MS + 2;

  for (let step = 0; step < maxSteps && !result; step += 1) {
    const next = advanceBattleTick(battle);
    battle = next.battle;
    if (next.result) {
      result = next.result;
    }
  }

  if (!result) {
    throw new Error("simulateBattle: battle did not finish");
  }

  return result;
}

export function syncBoardFromBattle(
  board: Piece[],
  battle: BattleSnapshot | null | undefined,
): Piece[] {
  if (!battle) return board;

  const hpById = new Map(battle.allies.map((ally) => [ally.id, ally.hp]));
  return board.map((piece) => {
    const hp = hpById.get(piece.id);
    return hp === undefined ? piece : { ...piece, hp };
  });
}
