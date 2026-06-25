export const STORAGE_KEYS = {
  settings: "kepi.settings",
  snapshot: "kepi.snapshot",
  debug: "kepi.debug",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
