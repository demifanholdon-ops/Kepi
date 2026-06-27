import type { EnemyType, PieceType, RangeType, SupportType } from "@/types";

/** Static definition for a combat piece (shop / board). */
export type PieceDefinition = {
  type: PieceType;
  name: string;
  cost: number;
  hp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType;
  clan: string;
  skillId: string;
  description: string;
  assetId: string;
  portrait: string;
};

/** Static definition for a support unit (后勤位). */
export type SupportDefinition = {
  type: SupportType;
  name: string;
  costTier: number;
  hp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType | null;
  description: string;
  assetId: string;
  portrait: string;
};

/** Static definition for an enemy archetype. */
export type EnemyDefinition = {
  type: EnemyType;
  name: string;
  assetId: string;
  portrait: string;
  hp: number;
  atk: number;
  atkSpeed: number;
  armor: number;
  range: RangeType;
  historicalNote: string;
  description: string;
};

/** Per-stage encounter configuration. */
export type StageDefinition = {
  stage: number;
  name: string;
  enemyCount: number;
  scaling: number;
  enemyPool: readonly EnemyType[];
  prepTimeSec: number;
  difficulty: "tutorial" | "normal" | "hard";
  aiDynamic: boolean;
  boardAsset: string;
};

/** Real archival letter used in endings (朗读主体). */
export type ArchivalLetter = {
  id: string;
  title: string;
  originalText: string;
  modernText: string;
  source: string;
  voiceAudio: string | null;
};

/** Pre-written digital letter for AI fallback (沿途 flavor). */
export type DigitalLetterFallback = {
  id: string;
  title: string;
  body: string;
  tags: readonly string[];
};

/** Tulou visual stage keyed by homeRepair thresholds. */
export type TulouVisualStage = {
  id: "stage1" | "stage2" | "stage3" | "stage4" | "stage5" | "stage6";
  minRepair: number;
  maxRepair: number;
  label: string;
  boardAsset: string;
  transitionAsset: string | null;
};
