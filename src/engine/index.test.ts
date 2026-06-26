import { describe, expect, it } from "vitest";
import {
  createInitialSnapshot,
  reduceGameState,
  resetPieceCounter,
  ENGINE_VERSION,
} from "./index";

describe("engine", () => {
  it("exports snapshot version", () => {
    expect(ENGINE_VERSION).toBe(1);
  });

  it("runs prep → battle → settlement → next prep loop", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();

    snapshot = reduceGameState(snapshot, { type: "BUY_PIECE", pieceType: "farmer" });
    expect(snapshot.board).toHaveLength(1);

    snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
    expect(snapshot.phase).toBe("battle");
    expect(snapshot.lastBattleResult).not.toBeNull();

    snapshot = reduceGameState(snapshot, { type: "END_BATTLE" });
    expect(snapshot.phase).toBe("settlement");

    snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    expect(snapshot.phase).toBe("prep");
    expect(snapshot.state.stage).toBe(2);
  });

  it("ends game when survival reaches zero", () => {
    resetPieceCounter(0);
    let snapshot = createInitialSnapshot();

    for (let round = 0; round < 2; round += 1) {
      snapshot = reduceGameState(snapshot, { type: "START_BATTLE" });
      snapshot = reduceGameState(snapshot, { type: "END_BATTLE" });
      if (snapshot.phase === "ending") break;
      snapshot = reduceGameState(snapshot, { type: "ADVANCE_STAGE" });
    }

    expect(snapshot.phase).toBe("ending");
    expect(snapshot.state.result).toBe("lose");
  });
});
