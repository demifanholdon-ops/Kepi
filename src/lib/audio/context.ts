/**
 * Web Audio 运行时核心：单一 AudioContext + 主增益 + 首次手势 resume。
 *
 * 设计要点：
 * - masterGain 由设置里的「音量」控制，BGM 与所有 SFX 都汇入它，
 *   因此一个滑块即可统一控制全局（修复此前 SFX 不受音量控制的缺陷）。
 * - bgmGain 固定在主增益之下的 0.55 倍，保留「BGM 压在音效之下」的平衡，
 *   并支持 duckBgm/restoreBgm 在战斗危机时压低。
 * - 浏览器自动播放策略：必须在首次用户手势后 resume()，否则静音。
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let bgmGain: GainNode | null = null;
let sfxGain: GainNode | null = null;

let masterVolume = 0.8;
let gestureBound = false;

const prefersNoAudio = (): boolean => typeof window === "undefined";

function createContext(): void {
  if (audioCtx || prefersNoAudio()) return;

  const Ctor: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;

  audioCtx = new Ctor();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = masterVolume;
  masterGain.connect(audioCtx.destination);

  bgmGain = audioCtx.createGain();
  bgmGain.gain.value = 0.55;
  bgmGain.connect(masterGain);

  sfxGain = audioCtx.createGain();
  sfxGain.gain.value = 1;
  sfxGain.connect(masterGain);
}

export function getAudioContext(): AudioContext | null {
  createContext();
  return audioCtx;
}

export function getMasterGain(): GainNode | null {
  createContext();
  return masterGain;
}

export function getBgmGain(): GainNode | null {
  createContext();
  return bgmGain;
}

export function getSfxGain(): GainNode | null {
  createContext();
  return sfxGain;
}

/** 设置主增益（全局音量）。参数为 0–1。 */
export function setMasterVolume(volume: number): void {
  masterVolume = Math.max(0, Math.min(1, volume));
  const ctx = getAudioContext();
  if (ctx && masterGain) {
    masterGain.gain.setTargetAtTime(masterVolume, ctx.currentTime, 0.02);
  }
}

/** 在首个用户手势后唤起被挂起的 AudioContext。 */
export function resumeAudio(): void {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }
}

/** 绑定一次性手势监听，确保用户首次交互后音频出声。 */
export function ensureGestureResume(): void {
  if (prefersNoAudio() || gestureBound) return;
  gestureBound = true;
  const handler = () => resumeAudio();
  window.addEventListener("pointerdown", handler, { passive: true });
  window.addEventListener("keydown", handler);
  window.addEventListener("touchstart", handler, { passive: true });
}
