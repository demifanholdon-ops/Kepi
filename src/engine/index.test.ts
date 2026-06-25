import { describe, expect, it } from "vitest";
import { ENGINE_VERSION } from "./index";

describe("engine bootstrap", () => {
  it("exports a version marker for Phase 0", () => {
    expect(ENGINE_VERSION).toBe(0);
  });
});
