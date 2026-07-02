import type { BattleOpeningBuff } from "@/data/battleBuffs";
import { levelInteractionForNode } from "@/data/levelInteractions";
import {
  BATTLE_OPENING_BUFFS,
  OPENING_BUFF_IDS,
  OPENING_BUFF_TIMEOUT_WEAK,
} from "@/data/battleBuffs";
import type { GameSnapshot } from "@/types";
import {
  battleStageForNode,
  currentJourneyNode,
  scalingForNode,
} from "../journey";
import { waterGuestAtBattleStart } from "../waterGuest";
import {
  advanceBattleTick,
  createBattleSnapshot,
  syncBoardFromBattle,
} from "../battle";
import { transitionPhase } from "../stateMachine";

function pickRandomOpeningBuff(seed: number): BattleOpeningBuff {
  const id = OPENING_BUFF_IDS[seed % OPENING_BUFF_IDS.length]!;
  return BATTLE_OPENING_BUFFS[id];
}

export function beginOpeningBuffPhase(snapshot: GameSnapshot): GameSnapshot {
  const base = pickRandomOpeningBuff(snapshot.state.journeyIndex + snapshot.state.gold);
  const interaction = levelInteractionForNode(snapshot.state.currentNodeId);
  const offered = interaction
    ? {
        ...base,
        label: interaction.xiangyinBuff.label,
        description: interaction.xiangyinBuff.description,
      }
    : base;

  return transitionPhase(
    {
      ...snapshot,
      openingBuff: {
        offered,
        caught: false,
        resolved: false,
      },
      activeOpeningBuff: null,
    },
    "opening_buff",
  );
}

function resolveOpeningBuff(
  snapshot: GameSnapshot,
  caught: boolean,
): GameSnapshot {
  const offered = snapshot.openingBuff?.offered;
  const buff = caught && offered ? offered : OPENING_BUFF_TIMEOUT_WEAK;

  let next = snapshot;
  if (buff.goldBonus) {
    next = {
      ...next,
      state: { ...next.state, gold: next.state.gold + buff.goldBonus },
    };
  }

  return {
    ...next,
    activeOpeningBuff: buff,
    openingBuff: snapshot.openingBuff
      ? { ...snapshot.openingBuff, caught, resolved: true }
      : null,
  };
}

export function catchOpeningBuff(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.phase !== "opening_buff") return snapshot;
  return resolveOpeningBuff(snapshot, true);
}

export function skipOpeningBuff(snapshot: GameSnapshot): GameSnapshot {
  if (snapshot.phase !== "opening_buff") return snapshot;
  return resolveOpeningBuff(snapshot, false);
}

export function enterBattleFromOpeningBuff(snapshot: GameSnapshot): GameSnapshot {
  const node = currentJourneyNode(snapshot);
  const stage = battleStageForNode(node);
  const scalingOverride = scalingForNode(node);
  const atkMultiplier = snapshot.activeOpeningBuff?.atkMultiplier ?? 1;

  const placedAllies = snapshot.board.filter(
    (piece) => piece.position !== null && piece.hp > 0,
  );
  const waterGuest = waterGuestAtBattleStart(placedAllies);

  const battle = createBattleSnapshot({
    stage,
    allies: placedAllies,
    homeRepairTier: snapshot.state.homeRepairTier,
    openingBuffAtkMultiplier: atkMultiplier,
    enemyHpFactorOverride: snapshot.state.nextBattleEnemyHpFactor,
    scalingOverride,
  });

  return transitionPhase(
    {
      ...snapshot,
      battle: { ...battle, waterGuest },
      lastBattleResult: null,
      settlement: null,
      state: { ...snapshot.state, stage },
    },
    "battle",
  );
}

export { advanceBattleTick, createBattleSnapshot, syncBoardFromBattle };
