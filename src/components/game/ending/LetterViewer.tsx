"use client";

import { ASSET_MANIFEST } from "@/data/assets";
import type { ArchivalLetter } from "@/data/types";
import { cn } from "@/lib/utils";
import { WoodButton, WoodPanel } from "@/components/game/ui";

type LetterViewerProps = {
  letter: ArchivalLetter;
  showModern?: boolean;
  className?: string;
};

export function LetterViewer({
  letter,
  showModern = true,
  className,
}: LetterViewerProps) {
  return (
    <WoodPanel
      className={cn("mx-auto w-full max-w-2xl", className)}
      letterEdge
      innerClassName="p-6"
    >
      <article
        style={{
          backgroundImage: `linear-gradient(rgba(255,251,235,0.88), rgba(255,251,235,0.88)), url('${ASSET_MANIFEST.ending.letterFrame}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <header className="mb-4 space-y-1 border-b border-amber-900/15 pb-3">
          <p className="text-xs tracking-widest text-amber-900/60 uppercase">
            真实馆藏侨批
          </p>
          <h2 className="font-heading text-lg font-semibold text-amber-950">
            {letter.title}
          </h2>
          <p className="text-xs text-amber-900/70">{letter.source}</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <section aria-label="繁体原文">
            <h3 className="mb-2 text-sm font-medium text-amber-900">繁体录文</h3>
            <p className="whitespace-pre-wrap font-serif text-base leading-relaxed text-amber-950">
              {letter.originalText}
            </p>
          </section>

          {showModern ? (
            <section aria-label="现代释文">
              <h3 className="mb-2 text-sm font-medium text-amber-900">
                现代释文
              </h3>
              <p className="whitespace-pre-wrap text-base leading-relaxed text-amber-950/90">
                {letter.modernText}
              </p>
            </section>
          ) : null}
        </div>
      </article>
    </WoodPanel>
  );
}

type DigitalLetterCardProps = {
  title: string;
  body: string;
  source?: string;
  fromAI?: boolean;
};

export function DigitalLetterCard({
  title,
  body,
  source,
  fromAI,
}: DigitalLetterCardProps) {
  return (
    <WoodPanel innerClassName="p-4 text-left">
      <header className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-kepi-ink">{title}</h3>
        <span className="rounded-full bg-kepi-accent-soft px-2 py-0.5 text-[10px] tracking-wide text-kepi-accent uppercase">
          {fromAI ? "AI 数字客批" : "本地文案"}
        </span>
      </header>
      <p className="text-sm leading-relaxed text-kepi-ink">{body}</p>
      {source ? (
        <p className="mt-2 text-xs text-kepi-ink-muted">{source}</p>
      ) : null}
    </WoodPanel>
  );
}

type LetterPickerProps = {
  letters: ArchivalLetter[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

export function LetterPicker({
  letters,
  selectedIndex,
  onSelect,
}: LetterPickerProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {letters.map((letter, index) => (
        <WoodButton
          key={letter.id}
          variant={selectedIndex === index ? "primary" : "default"}
          className="px-3 py-1.5 text-xs"
          onClick={() => onSelect(index)}
        >
          第 {index + 1} 封 · {letter.title}
        </WoodButton>
      ))}
    </div>
  );
}
