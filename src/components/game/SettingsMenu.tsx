"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { setMasterVolume } from "@/lib/audio/context";
import { loadSettings, saveSettings } from "@/lib/storage/settings";
import type { Settings } from "@/lib/schemas/settings";
import { useGameStore } from "@/store/gameStore";
import { useUIStore } from "@/store/uiStore";
import {
  KepiSlider,
  KepiToggle,
  WoodButton,
  woodButtonClassName,
  WoodPanel,
} from "@/components/game/ui";

export function SettingsMenu() {
  const open = useUIStore((state) => state.settingsOpen);
  const setSettingsOpen = useUIStore((state) => state.setSettingsOpen);
  const resetGame = useGameStore((state) => state.resetGame);
  const pushToast = useUIStore((state) => state.pushToast);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => setSettings(loadSettings()), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const updateSettings = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    if (patch.volume !== undefined) {
      setMasterVolume(patch.volume);
    }
  };

  if (!open) return null;

  const volumePercent = Math.round(settings.volume * 100);

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        aria-label="关闭设置"
        onClick={() => setSettingsOpen(false)}
      />
      <div
        className="fixed top-1/2 left-1/2 z-50 w-[min(100%-2rem,22rem)] -translate-x-1/2 -translate-y-1/2"
        role="dialog"
        aria-label="设置"
      >
        <WoodPanel letterEdge innerClassName="p-5">
          <h2 className="mb-1 text-lg font-bold text-kepi-ink">设置</h2>
          <p className="mb-4 text-xs text-kepi-ink-muted">客批 · 归乡之路</p>
          <div className="kepi-wood-divider mb-4" />

          <div className="kepi-setting-block">
            <span className="kepi-setting-label">音量</span>
            <span className="kepi-setting-hint">背景音乐与音效</span>
            <KepiSlider
              min={0}
              max={100}
              value={volumePercent}
              valueLabel={(value) => `${value}%`}
              aria-label="音量"
              onChange={(event) =>
                updateSettings({ volume: Number(event.target.value) / 100 })
              }
            />
          </div>

          <div className="mb-2 flex flex-col gap-2">
            <div className="kepi-setting-row">
              <div>
                <span className="kepi-setting-label">字幕显示</span>
                <span className="kepi-setting-hint">战斗与结算旁白</span>
              </div>
              <KepiToggle
                label="字幕显示"
                checked={settings.subtitlesEnabled}
                onCheckedChange={(checked) =>
                  updateSettings({ subtitlesEnabled: checked })
                }
              />
            </div>

            <div className="kepi-setting-row">
              <div>
                <span className="kepi-setting-label">手势接信</span>
                <span className="kepi-setting-hint">实验功能 · 结局用手势接住侨批</span>
              </div>
              <KepiToggle
                label="手势接信"
                checked={settings.gestureEnabled}
                onCheckedChange={(checked) =>
                  updateSettings({ gestureEnabled: checked })
                }
              />
            </div>
          </div>

          <div className="kepi-wood-divider mb-4" />
          <div className="flex flex-col gap-2">
            <WoodButton
              variant="primary"
              className="w-full px-4 py-2.5 text-sm"
              onClick={() => {
                resetGame();
                pushToast("已开始新局", "default");
                setSettingsOpen(false);
              }}
            >
              开始新局
            </WoodButton>
            <Link
              href="/debug"
              className={woodButtonClassName(
                "secondary",
                "w-full px-4 py-2.5 text-sm",
              )}
              onClick={() => setSettingsOpen(false)}
            >
              调试页
            </Link>
            <WoodButton
              className="w-full px-4 py-2.5 text-sm"
              onClick={() => setSettingsOpen(false)}
            >
              关闭
            </WoodButton>
          </div>
        </WoodPanel>
      </div>
    </>
  );
}
