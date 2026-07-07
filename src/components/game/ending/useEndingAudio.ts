"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ArchivalLetter } from "@/data/types";
import { playCollectLetterSfx, playWaveSfx } from "@/lib/audio/sfx";
import { stopBgm } from "@/lib/audio/bgm";

type UseEndingAudioOptions = {
  enabled?: boolean;
  volume?: number;
};

export function useEndingAudio({ enabled = true, volume = 0.8 }: UseEndingAudioOptions = {}) {
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // 结局让位给海浪与客家话朗读：停掉生成式 BGM。
    stopBgm();

    voiceRef.current = new Audio();
    voiceRef.current.volume = volume;
    voiceRef.current.preload = "auto";

    return () => {
      voiceRef.current?.pause();
    };
  }, [enabled, volume]);

  const playStorm = useCallback(() => {
    // 海浪：低通长噪声铺底（程序化合成，无需文件）。
    playWaveSfx();
  }, []);

  const playOpen = useCallback(() => {
    playCollectLetterSfx();
  }, []);

  const playVoice = useCallback(
    (letter: ArchivalLetter) => {
      if (!voiceRef.current || !letter.voiceAudio) return;
      voiceRef.current.src = letter.voiceAudio;
      voiceRef.current.currentTime = 0;
      void voiceRef.current.play().catch(() => {
        /* 语音素材缺失时静默降级 */
      });
    },
    [],
  );

  const stopAll = useCallback(() => {
    voiceRef.current?.pause();
  }, []);

  return { playStorm, playOpen, playVoice, stopAll };
}
