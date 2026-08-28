"use client";

import { useState } from "react";
import type { FlashcardSet } from "@/agents/_shared/types";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { MarkdownBody } from "./markdown-body";

export function FlashcardWidget({ deck }: { deck: FlashcardSet }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = deck.cards[index];

  if (!card) return null;

  return (
    <section className="mt-4">
      <div className="flex items-center justify-between gap-3">
        <Chip>
          {deck.subject} · {deck.title}
        </Chip>
        <p className="text-xs text-[var(--bui-ink-3)]">
          {index + 1} / {deck.cards.length}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setFlipped((value) => !value)}
        className="ui-card mt-3 flex min-h-40 w-full items-center justify-center px-6 py-8 text-center"
      >
        <div>
          <p className="ui-label">
            {flipped ? "Answer" : "Prompt"} · {card.topic}
          </p>
          <MarkdownBody
            text={flipped ? card.back : card.front}
            inline
            className="mt-3 text-2xl leading-snug font-semibold tracking-tight"
          />
          <p className="mt-4 text-xs text-[var(--bui-ink-3)]">Tap to flip</p>
        </div>
      </button>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={index === 0}
          onClick={() => {
            setIndex((value) => Math.max(0, value - 1));
            setFlipped(false);
          }}
        >
          Previous
        </Button>
        <Button
          type="button"
          disabled={index === deck.cards.length - 1}
          onClick={() => {
            setIndex((value) => Math.min(deck.cards.length - 1, value + 1));
            setFlipped(false);
          }}
        >
          Next card
        </Button>
      </div>
    </section>
  );
}
