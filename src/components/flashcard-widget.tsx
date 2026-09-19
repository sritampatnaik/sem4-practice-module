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
    return (
      <div className="mt-4 flex flex-wrap items-center gap-3" style={{ animation: "pop-in 260ms cubic-bezier(0.23,1,0.32,1) both" }}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint py-1 pr-2.5 pl-1 text-[12.5px] font-medium text-green">
          <span className="flex size-4.5 items-center justify-center rounded-full bg-green text-white">
            <Icon icon="flashcards" size={12} strokeWidth={2} />
          </span>
          {known} / {deck.cards.length} known
        </span>
        <p className="text-[12.5px] text-ink-2">{deck.title}</p>
        <Button type="button" variant="ghost" size="sm" onClick={() => setDone(false)}>
          Review again
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <p className="ui-label mb-2 inline-flex items-center gap-1">
        <Icon icon="flashcards" size={12} />
        Flashcards
      </p>
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
            <div className="mt-3 rounded-control bg-field px-2.5 py-2 text-[12.5px] leading-5 text-ink-2">
              <p className="inline-flex items-center gap-1 font-medium text-ink">
                <Icon icon="flip" size={13} />
                Answer
              </p>
              <MarkdownBody text={card.back} className="mt-1" />
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
