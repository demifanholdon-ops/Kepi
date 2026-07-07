import type { HomeRepairMilestone } from "@/types";
import type { PrepFxKind } from "@/store/fxStore";
import { playRepairHomeSfx, playTulouShieldSfx, playTulouCheatDeathSfx } from "@/lib/audio/sfx";
import { triggerMotif } from "@/lib/audio/bgm";

export function prepFxKindForMilestone(
  milestone: HomeRepairMilestone,
): PrepFxKind {
  if (milestone === 33) return "tulou_well";
  if (milestone === 66) return "tulou_wall";
  return "tulou_lantern";
}

export function milestoneLabel(milestone: HomeRepairMilestone): string {
  if (milestone === 33) return "修缮·初见 — 水井出水";
  if (milestone === 66) return "翻新·同心 — 外墙补全";
  return "焕然·不屈 — 祠堂灯火";
}

export function playTulouMilestoneSfx(milestone: HomeRepairMilestone): void {
  if (typeof window === "undefined") return;

  if (milestone === 33) {
    playRepairHomeSfx();
  } else if (milestone === 66) {
    playTulouShieldSfx();
  } else {
    playTulouCheatDeathSfx();
  }

  // 奏响主题 B「家·土楼」高光：tier 越高，高光越完整。
  window.setTimeout(() => triggerMotif("home"), 220);
}
