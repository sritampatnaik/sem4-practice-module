"use client";

import { useState } from "react";
import type { FlashcardSet } from "@/agents/_shared/types";

export function FlashcardWidget({ deck }: { deck: FlashcardSet }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = deck.cards[index];

  if (!card) return null;

  return (
    <section className="mt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs tracking-[0.18em] uppercase text-[var(--ink-soft)]">
          {deck.subject} · {deck.title}
        </p>
        <p className="text-xs text-[var(--ink-soft)]">
          {index + 1} / {deck.cards.length}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="mt-3 flex min-h-40 w-full items-center justify-center border border-[oklch(0.8_0.03_85)] bg-[oklch(0.98_0.012_85)] px-6 py-8 text-center"
      >
        <div>
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-[var(--ink-soft)]">
            {flipped ? "Answer" : "Prompt"} · {card.topic}
          </p>
          <p
            className="mt-3 font-[family-name:var(--font-fraunces)] text-2xl leading-snug"
            style={{ fontVariationSettings: '"SOFT" 50, "WONK" 1' }}
          >
            {flipped ? card.back : card.front}
          </p>
          <p className="mt-4 text-xs text-[var(--ink-soft)]">Tap to flip</p>
        </div>
      </button>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="border border-[var(--ink)] px-3 py-1.5 text-sm disabled:opacity-40"
          disabled={index === 0}
          onClick={() => {
            setIndex((value) => Math.max(0, value - 1));
            setFlipped(false);
          }}
        >
          Previous
        </button>
        <button
          type="button"
          className="border border-[var(--ink)] bg-[var(--ink)] px-3 py-1.5 text-sm text-[var(--paper)] disabled:opacity-40"
          disabled={index === deck.cards.length - 1}
          onClick={() => {
            setIndex((value) => Math.min(deck.cards.length - 1, value + 1));
            setFlipped(false);
          }}
        >
          Next card
        </button>
      </div>
    </section>
  );
}
