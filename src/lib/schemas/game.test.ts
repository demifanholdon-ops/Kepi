import { describe, expect, it } from "vitest";
import { gameSnapshotSchema, gameStateSchema, pieceSchema } from "@/lib/schemas";
import { createInitialSnapshot, createPiece, resetPieceCounter } from "@/engine";

describe("game schemas", () => {
  it("validates core entities", () => {
    resetPieceCounter(0);
    const piece = createPiece("farmer", 1, "farmer_schema");

    expect(() => pieceSchema.parse(piece)).not.toThrow();
    expect(() => gameStateSchema.parse(createInitialSnapshot().state)).not.toThrow();
    expect(() => gameSnapshotSchema.parse(createInitialSnapshot())).not.toThrow();
  });

  it("rejects invalid survival values in snapshots", () => {
    const snapshot = createInitialSnapshot();
    snapshot.state.survival = -1;

    expect(gameSnapshotSchema.safeParse(snapshot).success).toBe(false);
  });
});
