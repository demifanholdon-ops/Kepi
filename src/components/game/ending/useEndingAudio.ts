"use client";

import { useCallback, useEffect, useRef } from "react";
import { ASSET_MANIFEST } from "@/data/assets";
import type { ArchivalLetter } from "@/data/types";

type UseEndingAudioOptions = {
  enabled?: boolean;
  volume?: number;
};

export function useEndingAudio({ enabled = true, volume = 0.8 }: UseEndingAudioOptions = {}) {
  const waveRef = useRef<HTMLAudioElement | null>(null);
  const openRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    waveRef.current = new Audio(ASSET_MANIFEST.audio.sfxEndingWave);
    openRef.current = new Audio(ASSET_MANIFEST.audio.sfxCollectLetter);
    voiceRef.current = new Audio();

    for (const audio of [waveRef.current, openRef.current, voiceRef.current]) {
      audio.volume = volume;
      audio.preload = "auto";
    }

    return () => {
      for (const audio of [waveRef.current, openRef.current, voiceRef.current]) {
        audio?.pause();
      }
    };
  }, [enabled, volume]);

  const playSafe = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* 素材缺失或浏览器策略阻止时静默降级 */
    });
  }, []);

  const playStorm = useCallback(() => {
    playSafe(waveRef.current);
  }, [playSafe]);

  const playOpen = useCallback(() => {
    playSafe(openRef.current);
  }, [playSafe]);

  const playVoice = useCallback(
    (letter: ArchivalLetter) => {
      if (!voiceRef.current || !letter.voiceAudio) return;
      voiceRef.current.src = letter.voiceAudio;
      playSafe(voiceRef.current);
    },
    [playSafe],
  );

  const stopAll = useCallback(() => {
    for (const audio of [waveRef.current, openRef.current, voiceRef.current]) {
      audio?.pause();
    }
  }, []);

  return { playStorm, playOpen, playVoice, stopAll };
}
