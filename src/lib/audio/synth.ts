/**
 * 合成原语 + 纯函数（可单测）。
 *
 * 所有播放函数都走 `sfxGain`（默认）或调用方传入的 destination，
 * 最终汇入 masterGain，受设置音量统一控制。
 *
 * 纯函数（无副作用，可在 Node 下单测）：
 * - midiToFreq / noteToFreq
 * - buildMelodySequence
 */

import { getAudioContext, getSfxGain } from "./context";

/* ----------------------------- 纯函数 ----------------------------- */

const A4_MIDI = 69;
const A4_FREQ = 440;

/** MIDI 音高 → 频率（A4 = 69 = 440Hz）。 */
export function midiToFreq(midi: number): number {
  return A4_FREQ * Math.pow(2, (midi - A4_MIDI) / 12);
}

const NOTE_SEMITONE: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

/** 科学音高记号 → 频率，例如 "A4" → 440、"C5" → 523.25。 */
export function noteToFreq(note: string): number {
  const match = /^([A-Ga-g])(#|b)?(-?\d)$/.exec(note.trim());
  if (!match) throw new Error(`Invalid note name: ${note}`);
  const letter = match[1]!.toUpperCase() + (match[2] ?? "");
  const octave = Number(match[3]);
  const semitone = NOTE_SEMITONE[letter];
  if (semitone === undefined) throw new Error(`Invalid note name: ${note}`);
  const midi = (octave + 1) * 12 + semitone;
  return midiToFreq(midi);
}

export interface MelodyStep {
  note: string;
  beats: number;
}

/**
 * 从一个音阶生成一段旋律（纯函数，rng 可注入以便测试确定性）。
 * 生成的音名形如 "C0"、 "D1"，配合 noteToFreq 使用。
 */
export function buildMelodySequence(opts: {
  scale: string[];
  octaves?: number;
  steps: number;
  rng: () => number;
}): MelodyStep[] {
  const octaves = opts.octaves ?? 2;
  const pool: string[] = [];
  for (let octave = 0; octave <= octaves; octave += 1) {
    for (const step of opts.scale) {
      pool.push(`${step}${octave}`);
    }
  }

  const out: MelodyStep[] = [];
  for (let i = 0; i < opts.steps; i += 1) {
    const idx = Math.floor(opts.rng() * pool.length) % pool.length;
    out.push({ note: pool[idx]!, beats: opts.rng() < 0.3 ? 0.5 : 1 });
  }
  return out;
}

/* ----------------------------- 播放原语 ----------------------------- */

export interface ToneOptions {
  freq: number;
  type?: OscillatorType;
  durationMs?: number;
  attackMs?: number;
  releaseMs?: number;
  /** 峰值增益（相对 destination，0–1）。 */
  gain?: number;
  detune?: number;
  /** 相对当前 ctx 时间的起始偏移（秒）。 */
  delaySeconds?: number;
  destination?: AudioNode | null;
}

/** ADSR 简化包络的单音振荡器。 */
export function playTone(opts: ToneOptions): void {
  const ctx = getAudioContext();
  const dest = opts.destination === undefined ? getSfxGain() : opts.destination;
  if (!ctx || !dest) return;

  const now = ctx.currentTime + (opts.delaySeconds ?? 0);
  const duration = (opts.durationMs ?? 220) / 1000;
  const attack = (opts.attackMs ?? 6) / 1000;
  const release = (opts.releaseMs ?? 90) / 1000;
  const peak = Math.max(0.0001, opts.gain ?? 0.5);

  const osc = ctx.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.freq, now);
  if (opts.detune) osc.detune.setValueAtTime(opts.detune, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peak, now + attack);
  gain.gain.setValueAtTime(peak, Math.max(now + attack, now + duration));
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + duration + release + 0.02);
}

export interface NoiseOptions {
  durationMs?: number;
  type?: BiquadFilterType;
  frequency?: number;
  q?: number;
  gain?: number;
  destination?: AudioNode | null;
  delaySeconds?: number;
}

/** 滤波白噪声（打击、刮擦、风声等）。 */
export function playNoise(opts: NoiseOptions): void {
  const ctx = getAudioContext();
  const dest = opts.destination === undefined ? getSfxGain() : opts.destination;
  if (!ctx || !dest) return;

  const now = ctx.currentTime + (opts.delaySeconds ?? 0);
  const duration = (opts.durationMs ?? 120) / 1000;
  const peak = Math.max(0.0001, opts.gain ?? 0.3);

  const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const src = ctx.createBufferSource();
  src.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = opts.type ?? "bandpass";
  filter.frequency.value = opts.frequency ?? 1200;
  filter.Q.value = opts.q ?? 1;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peak, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(dest);
  src.start(now);
  src.stop(now + duration + 0.02);
}

/** 拨弦感单音（三角波 + 快速衰减）。 */
export function playPluck(
  freq: number,
  opts?: { durationMs?: number; gain?: number; destination?: AudioNode | null; delaySeconds?: number },
): void {
  playTone({
    freq,
    type: "triangle",
    durationMs: opts?.durationMs ?? 260,
    attackMs: 3,
    releaseMs: 160,
    gain: opts?.gain ?? 0.4,
    destination: opts?.destination,
    delaySeconds: opts?.delaySeconds,
  });
}

/** 同时奏响一组频率（和弦）。 */
export function playChord(
  freqs: number[],
  opts?: {
    type?: OscillatorType;
    durationMs?: number;
    gain?: number;
    destination?: AudioNode | null;
    delaySeconds?: number;
  },
): void {
  const base = opts?.delaySeconds ?? 0;
  freqs.forEach((freq, i) => {
    playTone({
      freq,
      type: opts?.type ?? "sine",
      durationMs: opts?.durationMs ?? 420,
      attackMs: 30,
      releaseMs: 320,
      gain: opts?.gain ?? 0.22,
      destination: opts?.destination,
      delaySeconds: base + i * 0.04,
    });
  });
}

/** 频率上滑（技能、提示）。 */
export function playGlide(opts: {
  fromFreq: number;
  toFreq: number;
  durationMs?: number;
  type?: OscillatorType;
  gain?: number;
  destination?: AudioNode | null;
}): void {
  const ctx = getAudioContext();
  const dest = opts.destination === undefined ? getSfxGain() : opts.destination;
  if (!ctx || !dest) return;

  const now = ctx.currentTime;
  const duration = (opts.durationMs ?? 300) / 1000;
  const peak = Math.max(0.0001, opts.gain ?? 0.4);

  const osc = ctx.createOscillator();
  osc.type = opts.type ?? "sine";
  osc.frequency.setValueAtTime(opts.fromFreq, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.toFreq), now + duration);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.linearRampToValueAtTime(peak, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.connect(gain);
  gain.connect(dest);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}

export interface SequenceNote {
  freq: number;
  durationMs: number;
}

/** 顺序播放一串音符（旋律/琶音）。 */
export function playSequence(
  notes: SequenceNote[],
  opts?: {
    type?: OscillatorType;
    gain?: number;
    gapMs?: number;
    destination?: AudioNode | null;
    startTime?: number;
  },
): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  let cursor = (opts?.startTime ?? ctx.currentTime) + (opts?.gapMs ?? 0) / 1000;
  for (const note of notes) {
    playTone({
      freq: note.freq,
      type: opts?.type ?? "triangle",
      durationMs: note.durationMs,
      gain: opts?.gain ?? 0.35,
      destination: opts?.destination,
      delaySeconds: Math.max(0, cursor - ctx.currentTime),
    });
    cursor += note.durationMs / 1000 + (opts?.gapMs ?? 0) / 1000;
  }
}

/* ----------------------------- BGM 专用原语 ----------------------------- */

export interface PadSwellOptions {
  type?: OscillatorType;
  durationMs?: number;
  gain?: number;
  attackMs?: number;
  releaseMs?: number;
  /** 微失谐量（cents），用于营造椰胡颤音感。 */
  detuneCents?: number;
  destination?: AudioNode | null;
  delaySeconds?: number;
}

/**
 * 多 sine 缓起 pad swell（持续氛围层）。
 * 一组频率同时奏响、缓起缓落，营造"温婉底色"。
 */
export function playPadSwell(
  freqs: number[],
  opts?: PadSwellOptions,
): void {
  const type = opts?.type ?? "sine";
  const durationMs = opts?.durationMs ?? 2400;
  const gain = opts?.gain ?? 0.12;
  const attackMs = opts?.attackMs ?? 600;
  const releaseMs = opts?.releaseMs ?? 900;
  const detune = opts?.detuneCents ?? 0;
  const base = opts?.delaySeconds ?? 0;
  freqs.forEach((f, i) => {
    playTone({
      freq: f,
      type,
      durationMs,
      attackMs,
      releaseMs,
      gain: gain * (i === 0 ? 1 : 0.78),
      detune: detune * (i % 2 === 0 ? 1 : -1),
      destination: opts?.destination,
      delaySeconds: base + i * 0.012,
    });
  });
}

/**
 * 双振荡器微失谐单音（椰胡颤音质感）。
 * 用于客家山歌腔旋律线，比单 osc 更有"人声/弦"的温度。
 */
export function playDetunedPair(
  freq: number,
  opts?: {
    type?: OscillatorType;
    durationMs?: number;
    gain?: number;
    detuneCents?: number;
    destination?: AudioNode | null;
    delaySeconds?: number;
  },
): void {
  const ctx = getAudioContext();
  const dest = opts?.destination === undefined ? getSfxGain() : opts.destination;
  if (!ctx || !dest) return;

  const now = ctx.currentTime + (opts?.delaySeconds ?? 0);
  const duration = (opts?.durationMs ?? 520) / 1000;
  const peak = Math.max(0.0001, opts?.gain ?? 0.2);
  const detune = opts?.detuneCents ?? 8;
  const type = opts?.type ?? "sine";

  for (const sign of [1, -1]) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.detune.setValueAtTime(sign * detune, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }
}

/**
 * 在指定绝对时间调度一个单音（前瞻调度用，供 BGM 分层调度器调用）。
 * 与 playTone 的区别：以 ctx 绝对时间为准，不依赖 delaySeconds。
 */
export function scheduleTone(
  freq: number,
  atTime: number,
  opts?: {
    type?: OscillatorType;
    durationMs?: number;
    gain?: number;
    attackMs?: number;
    releaseMs?: number;
    detuneCents?: number;
    destination?: AudioNode | null;
  },
): void {
  const ctx = getAudioContext();
  const dest = opts?.destination === undefined ? getSfxGain() : opts.destination;
  if (!ctx || !dest) return;

  const now = ctx.currentTime;
  const startOffset = Math.max(0, atTime - now);
  const duration = (opts?.durationMs ?? 260) / 1000;
  const attack = (opts?.attackMs ?? 5) / 1000;
  const release = (opts?.releaseMs ?? 160) / 1000;
  const peak = Math.max(0.0001, opts?.gain ?? 0.3);
  const detune = opts?.detuneCents ?? 0;
  const type = opts?.type ?? "triangle";

  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, atTime);
  if (detune) osc.detune.setValueAtTime(detune, atTime);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, atTime);
  gain.gain.linearRampToValueAtTime(peak, atTime + attack);
  gain.gain.setValueAtTime(peak, Math.max(atTime + attack, atTime + duration));
  gain.gain.exponentialRampToValueAtTime(0.0001, atTime + duration + release);

  osc.connect(gain);
  gain.connect(dest);
  // start/stop 用绝对 ctx 时间
  osc.start(atTime);
  osc.stop(atTime + duration + release + 0.02);
  // 防止因调度过远被遗漏，延迟起点用 startOffset 仅作语义，实际由 ctx 调度
  void startOffset;
}

/* ----------------------------- 主题动机（Leitmotif） ----------------------------- */

/** 客家五声音阶（宫商角徵羽），跨八度使用。 */
export const HAKKA_SCALE = ["C", "D", "E", "G", "A"] as const;

/**
 * 四个贯穿全剧的主题动机。
 * 每个动机是一串「音名+拍数」，配合 noteToFreq / scheduleTone 使用。
 * 见 docs/kepi_audio-design_v1.md §3。
 */
export const MOTIFS = {
  /** 主题 A「乡愁」：A4 → C5 → G4 → E4 →(长)G4，客家山歌句尾下滑拖腔。 */
  nostalgia: [
    { note: "A4", beats: 1 },
    { note: "C5", beats: 1 },
    { note: "G4", beats: 1 },
    { note: "E4", beats: 1 },
    { note: "G4", beats: 2 },
  ],
  /** 主题 B「家·土楼」：C4 → G4 → C5 → G4，纯五度跳进=家的根音对位。 */
  home: [
    { note: "C4", beats: 1 },
    { note: "G4", beats: 1 },
    { note: "C5", beats: 1 },
    { note: "G4", beats: 2 },
  ],
  /** 主题 C「罪恶·典当」：A3 → bA3 → G3，半音下滑（全剧唯一半音）+ 低沉。 */
  guilt: [
    { note: "A3", beats: 1 },
    { note: "Ab3", beats: 1 },
    { note: "G3", beats: 2 },
  ],
  /** 主题 D「风浪」：五声在高音区碎片化，由噪声海浪承接。 */
  storm: [
    { note: "E5", beats: 0.5 },
    { note: "G5", beats: 0.5 },
    { note: "D5", beats: 0.5 },
    { note: "C6", beats: 1 },
    { note: "G6", beats: 2 },
  ],
} as const;

export type MotifId = keyof typeof MOTIFS;

export interface MotifStep {
  note: string;
  beats: number;
}
