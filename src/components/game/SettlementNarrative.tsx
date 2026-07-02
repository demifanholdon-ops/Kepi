"use client";

import { useTurnNarrative } from "@/components/game/useTurnNarrative";
import type { TurnNarrativeInput } from "@/lib/ai/types";

export function SettlementNarrative({
  input,
  cacheKey,
}: {
  input: TurnNarrativeInput | null;
  cacheKey: string;
}) {
  const { narrative, loading } = useTurnNarrative(input, cacheKey);

  if (loading) {
    return (
      <div
        className="kepi-settlement-narrative kepi-settlement-narrative-loading"
        aria-busy="true"
        aria-label="侨批旁白加载中"
      >
        <p className="text-[0.6875rem] text-kepi-ink-muted">侨批余音……</p>
      </div>
    );
  }

  if (!narrative) return null;

  return (
    <blockquote
      className="kepi-settlement-narrative"
      cite="侨批旁白"
      aria-label={`侨批旁白：${narrative.text}`}
    >
      <p className="kepi-settlement-narrative-text">{narrative.text}</p>
      <footer className="kepi-settlement-narrative-author">{narrative.author}</footer>
    </blockquote>
  );
}
