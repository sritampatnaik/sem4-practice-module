"use client";

import { useMemo, useState } from "react";
import type { FlashcardSet } from "@/agents/_shared/types";
import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/icons";
import ApprovalCard, { type ApprovalQuestion } from "@/components/primitives/ApprovalCard";
import { MarkdownBody } from "./markdown-body";

const REVIEW = ["I know this", "Still learning"] as const;

export function FlashcardWidget({ deck }: { deck: FlashcardSet }) {
  const [done, setDone] = useState(false);
  const [known, setKnown] = useState(0);

  const questions = useMemo<ApprovalQuestion[]>(
    () =>
      deck.cards.map((card) => ({
        q: card.front,
        type: "radio",
        options: [...REVIEW],
        heading: (
          <div>
            <p className="ui-label mb-1.5">{card.topic}</p>
            <MarkdownBody text={card.front} className="text-[14px] leading-6 font-medium" />
          </div>
        ),
      })),
    [deck.cards],
  );

  if (done) {
    const percentage = Math.round((known / deck.cards.length) * 100);
    const isExcellent = percentage >= 90;
    const isGood = percentage >= 70;
    
    return (
      <div className="rounded-xl border border-line/50 bg-gradient-to-br from-accent-tint to-surface p-6 shadow-card" style={{ animation: "pop-in 260ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-accent text-white shadow-md">
            <Icon icon="flashcards" size={20} strokeWidth={2} />
          </div>
          <div>
            <h4 className="text-lg font-bold text-ink">{deck.title}</h4>
            <p className="text-sm text-ink-2">Flashcard Review</p>
          </div>
        </div>
        
        <div className="mb-4 rounded-lg border border-accent/20 bg-white/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl font-bold text-accent">
              {known} / {deck.cards.length}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              isExcellent ? 'bg-green text-white' : isGood ? 'bg-accent-tint text-accent' : 'bg-orange-tint text-orange'
            }`}>
              {isExcellent ? '🌟 Excellent!' : isGood ? '✓ Well done!' : '📖 Keep reviewing'}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-3/20">
            <div 
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-3">{deck.cards.length - known} cards still learning</p>
        </div>
        
        <Button 
          type="button" 
          variant="secondary" 
          size="sm" 
          onClick={() => setDone(false)}
          className="w-full"
        >
          Review again
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-line/50 bg-surface/50 p-5 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
          <Icon icon="flashcards" size={16} className="text-accent" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Flashcard Deck</p>
          <h4 className="text-sm font-bold text-ink">{deck.title}</h4>
        </div>
      </div>
      <ApprovalCard
        key={deck.title}
        className="max-w-full"
        questions={questions}
        allowCustom={false}
        autoAdvance={false}
        lockAfterAnswer
        labels={{
          skip: "Skip card",
          continue: "Next card",
          send: "Finish deck",
          sentMessage: "Deck reviewed",
          open: "Open flashcards",
          startOver: "Review again",
        }}
        renderExtra={(index, selected) => {
          const card = deck.cards[index];
          if (!card || selected.length === 0) return null;
          return (
            <div className="mt-4 rounded-lg border border-accent/20 bg-accent-tint p-4">
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-accent">
                <span className="flex size-5 items-center justify-center rounded-full bg-accent text-white">
                  <Icon icon="flip" size={12} strokeWidth={2.5} />
                </span>
                Answer
              </p>
              <MarkdownBody text={card.back} className="text-sm" />
            </div>
          );
        }}
        onSubmitted={(answers) => {
          const knownCount = Object.values(answers).filter((picked) => picked[0] === 0).length;
          setKnown(knownCount);
          setDone(true);
        }}
      />
    </div>
  );
}
