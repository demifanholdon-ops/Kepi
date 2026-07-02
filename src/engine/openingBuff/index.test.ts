import { describe, expect, it } from "vitest";
import {
  BATTLE_OPENING_BUFFS,
  OPENING_BUFF_IDS,
} from "@/data/battleBuffs";
import { createInitialSnapshot, reduceGameState } from "@/engine";
import { createPiece } from "@/engine/shop";

describe("opening buff (V3.1)", () => {
  it("defines at most three buff kinds", () => {
    expect(OPENING_BUFF_IDS.length).toBeLessThanOrEqual(3);
    for (const id of OPENING_BUFF_IDS) {
      expect(BATTLE_OPENING_BUFFS[id]).toBeDefined();
    }
  });

  it("enters opening_buff phase when battle starts", () => {
    let snapshot = createInitialSnapshot();
    snapshot = reduceGameState(snapshot, {
      type: "PICK_CAMPFIRE_CHOICE",
      choiceId: "share-gold",
    });
    snapshot = {
      ...snapshot,
      board: [
        { ...createPiece("farmer", 1), position: { x: 2, y: 4 } },
        { ...createPiece("shuike", 1), position: { x: 3, y: 3 } },
      ],
    };

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });

    expect(snapshot.phase).toBe("opening_buff");
    expect(snapshot.openingBuff?.offered).toBeDefined();
  });

  it("applies buff when caught and enters battle", () => {
    let snapshot = createInitialSnapshot();
    snapshot = reduceGameState(snapshot, {
      type: "PICK_CAMPFIRE_CHOICE",
      choiceId: "share-gold",
    });
    snapshot = {
      ...snapshot,
      board: [
        { ...createPiece("farmer", 1), position: { x: 2, y: 4 } },
        { ...createPiece("shuike", 1), position: { x: 3, y: 3 } },
      ],
    };
    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = reduceGameState(snapshot, { type: "CATCH_OPENING_BUFF" });

    expect(snapshot.phase).toBe("battle");
    expect(snapshot.activeOpeningBuff).toBeDefined();
    expect(snapshot.battle?.openingBuffAtkMultiplier).toBeGreaterThan(0);
  });

  it("skips to battle with weak buff on timeout action", () => {
    let snapshot = createInitialSnapshot();
    snapshot = reduceGameState(snapshot, {
      type: "PICK_CAMPFIRE_CHOICE",
      choiceId: "share-gold",
    });
    snapshot = {
      ...snapshot,
      board: [
        { ...createPiece("guard", 1), position: { x: 1, y: 4 } },
        { ...createPiece("shuike", 1), position: { x: 3, y: 3 } },
      ],
    };
    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = reduceGameState(snapshot, { type: "SKIP_OPENING_BUFF" });

    expect(snapshot.phase).toBe("battle");
    expect(snapshot.activeOpeningBuff?.label).toContain("余音");
  });
});
