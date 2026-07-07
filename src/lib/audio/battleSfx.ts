/**
 * 战斗相关音效的对外入口。
 *
 * 底层已全部改为程序化合成（见 sfx.ts），此处仅做再导出，
 * 旧调用点（ShopStrip / useGameCanvas / tulouMilestone）零改动。
 */

export {
  playPawnStampSfx,
  playPawnGoldSfx,
  playTulouShieldSfx,
  playTulouAtkSpeedSfx,
  playTulouCheatDeathSfx,
  playWaterGuestBreathSfx,
  playWaterGuestHeartbeatSfx,
  playWaterGuestDeathSfx,
  playTulouBattleStartSfx,
} from "./sfx";
