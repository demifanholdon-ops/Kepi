// @vitest-environment jsdom

import { describe, expect, it, beforeEach, vi } from "vitest";
import { createInitialSnapshot } from "@/engine";
import { gameSnapshotSchema } from "@/lib/schemas";
import { STORAGE_KEYS } from "@/lib/storage/keys";
import {
  clearSnapshot,
  hasSavedSnapshot,
  loadSnapshot,
  saveSnapshot,
} from "@/lib/storage/snapshot";

describe("snapshot storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("persists and loads valid snapshots", () => {
    const snapshot = createInitialSnapshot();
    saveSnapshot(snapshot);

    expect(hasSavedSnapshot()).toBe(true);
    const loaded = loadSnapshot();
    expect(loaded).not.toBeNull();
    expect(gameSnapshotSchema.parse(loaded)).toEqual(snapshot);
  });

  it("returns null for corrupted data", () => {
    window.localStorage.setItem(STORAGE_KEYS.snapshot, "{bad");
    expect(loadSnapshot()).toBeNull();
  });

  it("clears saved snapshots", () => {
    saveSnapshot(createInitialSnapshot());
    clearSnapshot();
    expect(hasSavedSnapshot()).toBe(false);
    expect(loadSnapshot()).toBeNull();
  });
});

describe("requestDigitalLetter", () => {
  it("returns fallback when API responds with ok:false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        json: async () => ({
          ok: false,
          fallback: { title: "测试", body: "降级正文" },
        }),
      }),
    );

    const { requestDigitalLetter } = await import("@/lib/ai/client");
    const result = await requestDigitalLetter({
      stage: 1,
      kebi: 0,
      homeRepair: 0,
      survival: 2,
      battleSummary: "test",
    });

    expect(result.letter.title).toBe("测试");
    expect(result.fromAI).toBe(false);
    vi.unstubAllGlobals();
  });
});
