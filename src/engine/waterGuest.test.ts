import { describe, expect, it } from "vitest";
import { createInitialSnapshot, reduceGameState } from "@/engine";
import { createPiece, recallBoardToBench } from "@/engine/shop";
import { enterBattleFromOpeningBuff } from "@/engine/openingBuff";
import { waterGuestAtBattleStart } from "./waterGuest";

function leaveCampfire(snapshot: ReturnType<typeof createInitialSnapshot>) {
  if (snapshot.phase !== "campfire") return snapshot;
  return reduceGameState(snapshot, {
    type: "PICK_CAMPFIRE_CHOICE",
    choiceId: "share-gold",
  });
}

describe("waterGuest deployment", () => {
  it("does not deploy a dead shuike left on the bench", () => {
    const deadShuike = createPiece("shuike");
    deadShuike.hp = 0;

    expect(waterGuestAtBattleStart([deadShuike]).deployed).toBe(false);
  });

  it("does not deploy shuike that is only on the bench without placement", () => {
    const benchShuike = createPiece("shuike");

    expect(waterGuestAtBattleStart([benchShuike]).deployed).toBe(false);
  });

  it("deploys shuike when placed on an ally row with hp > 0", () => {
    const shuike = createPiece("shuike");
    shuike.position = { x: 3, y: 3 };

    const state = waterGuestAtBattleStart([shuike]);
    expect(state).toMatchObject({
      pieceId: shuike.id,
      deployed: true,
      survived: true,
      died: false,
    });
  });

  it("recallBoardToBench removes dead pieces and heals survivors", () => {
    const shuike = createPiece("shuike");
    shuike.hp = 0;
    shuike.position = { x: 2, y: 3 };
    const farmer = createPiece("farmer");
    farmer.hp = 120;
    farmer.maxHp = 450;
    farmer.position = { x: 1, y: 4 };

    const next = recallBoardToBench({
      ...leaveCampfire(createInitialSnapshot()),
      board: [shuike, farmer],
    });

    expect(next.board).toHaveLength(1);
    expect(next.board[0]).toMatchObject({
      type: "farmer",
      hp: 450,
      position: null,
    });
  });

  it("keeps placed shuike in battle after stage 3 prep recall", () => {
    let snapshot = leaveCampfire(createInitialSnapshot());
    const shuike = createPiece("shuike");
    shuike.position = { x: 3, y: 3 };
    const farmer = createPiece("farmer");
    farmer.position = { x: 2, y: 4 };
    snapshot = {
      ...snapshot,
      state: { ...snapshot.state, stage: 3, currentNodeId: "battle-3", journeyIndex: 3 },
      board: [shuike, farmer],
    };

    snapshot = recallBoardToBench(snapshot);
    expect(snapshot.board.some((piece) => piece.type === "shuike")).toBe(true);

    snapshot = reduceGameState(snapshot, {
      type: "MOVE_PIECE",
      pieceId: shuike.id,
      position: { x: 3, y: 3 },
    });
    snapshot = reduceGameState(snapshot, {
      type: "MOVE_PIECE",
      pieceId: farmer.id,
      position: { x: 2, y: 4 },
    });

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    snapshot = reduceGameState(snapshot, { type: "SKIP_OPENING_BUFF" });

    expect(snapshot.battle?.waterGuest.deployed).toBe(true);
    expect(snapshot.battle?.allies.some((piece) => piece.type === "shuike")).toBe(true);
  });

  it("enterBattleFromOpeningBuff excludes unplaced bench pieces", () => {
    const shuike = createPiece("shuike");
    shuike.position = { x: 3, y: 3 };
    const farmer = createPiece("farmer");

    const snapshot = enterBattleFromOpeningBuff({
      ...leaveCampfire(createInitialSnapshot()),
      phase: "opening_buff",
      openingBuff: {
        offered: {
          id: "ancestral_blessing",
          label: "破关",
          description: "test",
          atkMultiplier: 1.15,
        },
        caught: false,
        resolved: true,
      },
      activeOpeningBuff: {
        id: "ancestral_blessing",
        label: "破关",
        description: "test",
        atkMultiplier: 1.15,
      },
      state: { ...leaveCampfire(createInitialSnapshot()).state, stage: 3 },
      board: [shuike, farmer],
    });

    expect(snapshot.battle?.allies).toHaveLength(1);
    expect(snapshot.battle?.allies[0]?.type).toBe("shuike");
    expect(snapshot.battle?.waterGuest.deployed).toBe(true);
  });
});
