/**
 * 高层音效集合（程序化合成，无音频文件依赖）。
 *
 * 命名约定 play*Sfx / play*。语音朗读走 playFile（文件缺失则静默降级）。
 * 调用方：ShopStrip / CampfirePanel / OpeningBuffLayer / useGameCanvas /
 * tulouMilestone / battleSfx（再导出）。
 */

import {
  noteToFreq,
  playChord,
  playGlide,
  playNoise,
  playPluck,
  playTone,
} from "./synth";
import type { EnemyType, HomeRepairTier } from "@/types";

const freq = (note: string): number => noteToFreq(note);

/* --------------------------- 商店 / 备战 --------------------------- */

/** 购买棋子：上行两音拨弦（明亮）。 */
export function playBuySfx(): void {
  playPluck(freq("C5"), { gain: 0.4 });
  window.setTimeout(() => playPluck(freq("G5"), { gain: 0.32 }), 70);
}

/** 刷新商店：快速噪声扫频 + 轻拨。 */
export function playRefreshSfx(): void {
  playNoise({ durationMs: 150, frequency: 2000, q: 0.7, gain: 0.2, type: "bandpass" });
  window.setTimeout(() => playPluck(freq("E5"), { gain: 0.28 }), 60);
}

/** 升人口：三度和弦上行。 */
export function playPopulationSfx(): void {
  playChord([freq("C4"), freq("E4"), freq("G4")], { type: "triangle", gain: 0.3, durationMs: 420 });
}

/** 升星：前置主题 B「家」C4→G4 暖拨弦 + 闪光三连音上行 + 微噪。 */
export function playStarUpSfx(): void {
  // 主题 B 片段（家的根音对位），温暖低拨
  playPluck(freq("C4"), { gain: 0.3, durationMs: 200 });
  window.setTimeout(() => playPluck(freq("G4"), { gain: 0.28, durationMs: 200 }), 60);
  // 闪光上行
  const notes = ["C5", "E5", "G5", "C6"];
  notes.forEach((n, i) =>
    window.setTimeout(() => playPluck(freq(n), { gain: 0.4 }), 140 + i * 55),
  );
  playNoise({ durationMs: 120, frequency: 6000, q: 2, gain: 0.1, type: "highpass" });
}

/** 卖出棋子：下行轻音。 */
export function playSellSfx(): void {
  playPluck(freq("G4"), { gain: 0.26, durationMs: 200 });
  window.setTimeout(() => playPluck(freq("D4"), { gain: 0.22, durationMs: 200 }), 70);
}

/* --------------------------- 结算 / 收信 --------------------------- */

/** 收信：主题 A 句尾拖腔（G4 长延音）+ 柔和钟铃。 */
export function playCollectLetterSfx(): void {
  // 主题 A 拖腔：客家山歌句尾下滑
  playTone({ freq: freq("G4"), type: "sine", durationMs: 360, attackMs: 8, releaseMs: 300, gain: 0.22 });
  playTone({ freq: freq("E6"), type: "sine", durationMs: 420, attackMs: 4, releaseMs: 320, gain: 0.3 });
  window.setTimeout(
    () => playTone({ freq: freq("B5"), type: "sine", durationMs: 360, releaseMs: 300, gain: 0.2 }),
    90,
  );
}

/** 家园修缮：低频木鱼/水滴。 */
export function playRepairHomeSfx(): void {
  playTone({ freq: freq("C3"), type: "sine", durationMs: 280, releaseMs: 200, gain: 0.38 });
  playNoise({ durationMs: 90, frequency: 400, q: 1, gain: 0.1, type: "lowpass" });
}

/** 胜利：主题 B「家」C-G-C 和弦 swell + 五声音阶上行收束。 */
export function playWinSfx(): void {
  // 主题 B 和弦 swell（家的稳固收束）
  playChord([freq("C4"), freq("G4"), freq("C5")], { type: "sine", gain: 0.22, durationMs: 480 });
  // 五声上行
  const notes = ["C5", "D5", "E5", "G5", "A5", "C6"];
  notes.forEach((n, i) =>
    window.setTimeout(() => playPluck(freq(n), { gain: 0.34 }), 120 + i * 90),
  );
}

/** 失败：下行低沉两音。 */
export function playLoseSfx(): void {
  playTone({ freq: freq("A3"), type: "sine", durationMs: 420, releaseMs: 400, gain: 0.34 });
  window.setTimeout(
    () => playTone({ freq: freq("E3"), type: "sine", durationMs: 520, releaseMs: 500, gain: 0.32 }),
    220,
  );
}

/* --------------------------- 典当行 --------------------------- */

/** 典当盖章：闷击噪声 + 低频 thud。 */
export function playPawnStampSfx(): void {
  playNoise({ durationMs: 140, frequency: 220, q: 0.6, gain: 0.5, type: "lowpass" });
  playTone({ freq: freq("A2"), type: "sine", durationMs: 160, releaseMs: 120, gain: 0.4 });
}

/** 典当金币：两声清脆金属 ping。 */
export function playPawnGoldSfx(): void {
  playTone({ freq: freq("C6"), type: "square", durationMs: 110, releaseMs: 220, gain: 0.16 });
  window.setTimeout(
    () => playTone({ freq: freq("G6"), type: "square", durationMs: 110, releaseMs: 220, gain: 0.14 }),
    110,
  );
}

/* --------------------------- 开场增益 / 篝火 --------------------------- */

/** 获得开场增益：温暖和弦 swell。 */
export function playOpeningBuffSfx(): void {
  playChord([freq("C4"), freq("E4"), freq("G4"), freq("B4")], {
    type: "sine",
    gain: 0.2,
    durationMs: 520,
  });
}

/** 篝火选择：拨弦单音。 */
export function playCampfireChoiceSfx(): void {
  playPluck(freq("A4"), { gain: 0.34, durationMs: 300 });
}

/* --------------------------- 战斗 --------------------------- */

let lastHitAt = 0;

/** 攻击/受击：短促噪声 burst，按伤害轻微变调（内部节流，避免音爆）。 */
export function playHitSfx(damage = 10): void {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastHitAt < 80) return;
  lastHitAt = now;
  const center = 160 + Math.min(Math.max(damage, 1), 80) * 4;
  playNoise({ durationMs: 70, frequency: center, q: 0.8, gain: 0.16, type: "bandpass" });
}

/** 技能释放：上扬滑音。 */
export function playSkillSfx(): void {
  playGlide({ fromFreq: freq("C4"), toFreq: freq("C6"), durationMs: 260, type: "triangle", gain: 0.2 });
}

/** 落叶羁绊触发：主题 A「乡愁」上行琶音 + 五声轻拨串（"归根"叙事收束）。 */
export function playLeafFallSfx(): void {
  // 主题 A 上行琶音：E4 → G4 → C5 → A5（归乡母题收束）
  const motif = ["E4", "G4", "C5", "A5"];
  motif.forEach((n, i) =>
    window.setTimeout(
      () => playPluck(freq(n), { gain: 0.3, durationMs: 240 }),
      i * 70,
    ),
  );
  // 落叶轻拨串
  const leaves = ["G5", "E5", "D5", "C5"];
  leaves.forEach((n, i) =>
    window.setTimeout(
      () => playPluck(freq(n), { gain: 0.22, durationMs: 220 }),
      300 + i * 90,
    ),
  );
}

/** 结局海浪：低通长噪声铺底（程序化合成）。 */
export function playWaveSfx(): void {
  playNoise({ durationMs: 2400, frequency: 320, q: 0.4, gain: 0.12, type: "lowpass" });
  window.setTimeout(
    () => playNoise({ durationMs: 1800, frequency: 220, q: 0.4, gain: 0.08, type: "lowpass" }),
    600,
  );
}

/* --------------------------- 水客 / 土楼 · 既有设计迁移 --------------------------- */

/** 水客危机（低血量）：柔和低频呼吸感。 */
export function playWaterGuestBreathSfx(): void {
  playTone({ freq: freq("D3"), type: "sine", durationMs: 320, releaseMs: 280, gain: 0.22 });
}

/** 水客濒危（极低血量）：两声低沉心跳。 */
export function playWaterGuestHeartbeatSfx(): void {
  playTone({ freq: freq("A2"), type: "sine", durationMs: 160, releaseMs: 140, gain: 0.34 });
  window.setTimeout(
    () => playTone({ freq: freq("A2"), type: "sine", durationMs: 200, releaseMs: 180, gain: 0.26 }),
    420,
  );
}

/** 水客阵亡：低沉长音 + 客家话朗读兜底（文件缺失静默）。 */
export function playWaterGuestDeathSfx(voiceSrc?: string): void {
  playTone({ freq: freq("E3"), type: "sine", durationMs: 600, releaseMs: 600, gain: 0.34 });
  if (voiceSrc) {
    window.setTimeout(() => playFile(voiceSrc, 0.22), 180);
  }
}

/** 土楼·护盾（tier≥1）：低频木鱼。 */
export function playTulouShieldSfx(): void {
  playTone({ freq: freq("C3"), type: "triangle", durationMs: 240, releaseMs: 180, gain: 0.32 });
  playNoise({ durationMs: 80, frequency: 500, q: 1, gain: 0.1, type: "lowpass" });
}

/** 土楼·攻速（tier≥2）：上扬拨弦。 */
export function playTulouAtkSpeedSfx(): void {
  playGlide({ fromFreq: freq("G4"), toFreq: freq("G5"), durationMs: 260, type: "triangle", gain: 0.2 });
}

/** 土楼·免死（tier≥3）：微光 shimmer。 */
export function playTulouCheatDeathSfx(): void {
  playChord([freq("C5"), freq("E5"), freq("G5")], { type: "sine", gain: 0.18, durationMs: 520 });
  playNoise({ durationMs: 160, frequency: 5000, q: 2, gain: 0.08, type: "highpass" });
}

/** 开战前土楼增益提示（按 tier 组合）。 */
export function playTulouBattleStartSfx(tier: HomeRepairTier): void {
  if (tier >= 1) playTulouShieldSfx();
  if (tier >= 2) {
    window.setTimeout(() => playTulouAtkSpeedSfx(), tier >= 3 ? 420 : 260);
  }
}

/* --------------------------- 语音回填（文件缺失静默降级） --------------------------- */

/** 用文件播放（语音朗读等）。缺失/失败静默降级。 */
export function playFile(src: string, volume = 0.8): void {
  if (typeof window === "undefined") return;
  const audio = new Audio(src);
  audio.volume = volume;
  void audio.play().catch(() => undefined);
}

/* --------------------------- 敌人专属攻击音（6 敌历史符号音色） --------------------------- */

let lastEnemyHitAt = 0;

/**
 * 敌人攻击时的专属音色——按敌人历史符号区分，强化叙事识别。
 * 见 docs/kepi_audio-design_v1.md §5.3。内部节流（与 playHitSfx 共享上限）。
 */
export function playEnemyAttackSfx(enemyType: EnemyType, damage = 10): void {
  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now - lastEnemyHitAt < 80) return;
  lastEnemyHitAt = now;
  // 按伤害微调强度
  const intensity = Math.min(1, Math.max(0.4, damage / 30));

  switch (enemyType) {
    case "qianhaibei":
      // 迁海碑·石碑/官印：闷石击（低通噪声 + 低 sine thud）
      playNoise({ durationMs: 120, frequency: 180, q: 0.5, gain: 0.32 * intensity, type: "lowpass" });
      playTone({ freq: freq("A2"), type: "sine", durationMs: 140, releaseMs: 120, gain: 0.3 * intensity });
      break;
    case "luyinguanli":
      // 路引关吏·纸/盖章：纸张沙沙（高通噪声）+ 短闷击
      playNoise({ durationMs: 90, frequency: 5000, q: 0.8, gain: 0.18 * intensity, type: "highpass" });
      playTone({ freq: freq("D3"), type: "sine", durationMs: 100, releaseMs: 80, gain: 0.24 * intensity });
      break;
    case "zhuzaiqi":
      // 猪仔契·锁链/纸：金属链 sss（带通噪声）+ 金属 ping
      playNoise({ durationMs: 110, frequency: 3500, q: 1.5, gain: 0.22 * intensity, type: "bandpass" });
      playTone({ freq: freq("A5"), type: "square", durationMs: 80, releaseMs: 160, gain: 0.12 * intensity });
      break;
    case "ehushan":
      // 饿虎山·山/枯田：低频吼（低 sine 颤音 + 低通噪声）
      playTone({ freq: freq("G2"), type: "sine", durationMs: 260, releaseMs: 220, gain: 0.3 * intensity, detune: 12 });
      playNoise({ durationMs: 200, frequency: 240, q: 0.6, gain: 0.16 * intensity, type: "lowpass" });
      break;
    case "hongtouchuan":
      // 红头船·船/账单：木板吱嘎（锯齿低频抖动）+ 水花
      playGlide({ fromFreq: freq("E3"), toFreq: freq("A3"), durationMs: 180, type: "sawtooth", gain: 0.14 * intensity });
      playNoise({ durationMs: 80, frequency: 1500, q: 0.5, gain: 0.12 * intensity, type: "bandpass" });
      break;
    case "xiedouhuo":
      // 械斗火·火/农具：火噪声（带通）+ 金属撞击
      playNoise({ durationMs: 160, frequency: 900, q: 0.8, gain: 0.2 * intensity, type: "bandpass" });
      playTone({ freq: freq("C5"), type: "square", durationMs: 70, releaseMs: 140, gain: 0.14 * intensity });
      break;
  }
}
