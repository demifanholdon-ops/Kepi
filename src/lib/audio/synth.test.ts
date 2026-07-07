import { describe, expect, it } from "vitest";
import { buildMelodySequence, midiToFreq, noteToFreq, MOTIFS } from "./synth";

describe("synth 纯函数", () => {
  it("midiToFreq: A4=69 → 440Hz, A3=57 → 220Hz", () => {
    expect(midiToFreq(69)).toBeCloseTo(440, 5);
    expect(midiToFreq(57)).toBeCloseTo(220, 5);
    expect(midiToFreq(60)).toBeCloseTo(261.6256, 3);
  });

  it("noteToFreq: 科学音高记号解析", () => {
    expect(noteToFreq("A4")).toBeCloseTo(440, 5);
    expect(noteToFreq("C4")).toBeCloseTo(261.6256, 3);
    expect(noteToFreq("C5")).toBeCloseTo(523.2511, 3);
    expect(noteToFreq("A#4")).toBeCloseTo(midiToFreq(70), 5);
    expect(noteToFreq("Bb4")).toBeCloseTo(midiToFreq(70), 5);
  });

  it("noteToFreq: 非法音名抛错", () => {
    expect(() => noteToFreq("H4")).toThrow();
    expect(() => noteToFreq("C")).toThrow();
    expect(() => noteToFreq("")).toThrow();
  });

  it("buildMelodySequence: 生成指定步数且音名合法", () => {
    const seq = buildMelodySequence({
      scale: ["C", "D", "E", "G", "A"],
      octaves: 1,
      steps: 8,
      rng: () => 0.42,
    });
    expect(seq).toHaveLength(8);
    for (const step of seq) {
      expect(step.note).toMatch(/^[CDEGAB](#|b)?[0-9]$/);
      expect([0.5, 1]).toContain(step.beats);
    }
  });

  it("buildMelodySequence: 步数受 steps 控制（确定性 rng）", () => {
    const rng = (() => {
      let i = 0;
      const vals = [0.1, 0.2, 0.9, 0.4, 0.5, 0.6, 0.7, 0.8, 0.3, 0.0];
      return () => vals[i++ % vals.length]!;
    })();
    const seq = buildMelodySequence({
      scale: ["C", "D"],
      octaves: 0,
      steps: 5,
      rng,
    });
    expect(seq).toHaveLength(5);
  });

  it("MOTIFS: 四个主题动机音名全部可被 noteToFreq 解析", () => {
    for (const [id, steps] of Object.entries(MOTIFS)) {
      expect(steps.length).toBeGreaterThan(0);
      for (const step of steps) {
        // 每个音名都能解析为正频率，不抛错
        expect(() => noteToFreq(step.note)).not.toThrow();
        expect(noteToFreq(step.note)).toBeGreaterThan(0);
        expect(step.beats).toBeGreaterThan(0);
      }
      void id;
    }
  });

  it("MOTIFS: 罪恶主题 guilt 含半音 Ab（全剧唯一允许的半音）", () => {
    const guiltNotes = MOTIFS.guilt.map((s) => s.note);
    expect(guiltNotes).toContain("Ab3");
  });

  it("MOTIFS: 乡愁/家/风浪主题只含客家五声音阶（无半音 fa/F、ti/B）", () => {
    const pentatonic = ["C", "D", "E", "G", "A"];
    for (const id of ["nostalgia", "home", "storm"] as const) {
      for (const step of MOTIFS[id]) {
        const letter = step.note.replace(/[0-9]/g, "").replace(/[#b]/g, "");
        expect(pentatonic).toContain(letter);
      }
    }
  });
});
