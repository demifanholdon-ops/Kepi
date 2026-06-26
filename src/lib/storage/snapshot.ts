import { gameSnapshotSchema } from "@/lib/schemas";
import type { GameSnapshot } from "@/types";
import { STORAGE_KEYS } from "./keys";

export function saveSnapshot(snapshot: GameSnapshot): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEYS.snapshot, JSON.stringify(snapshot));
}

export function loadSnapshot(): GameSnapshot | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(STORAGE_KEYS.snapshot);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    const result = gameSnapshotSchema.safeParse(parsed);
    return result.success ? (result.data as GameSnapshot) : null;
  } catch {
    return null;
  }
}

export function clearSnapshot(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEYS.snapshot);
}

export function hasSavedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEYS.snapshot) !== null;
}
