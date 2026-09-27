"use client";

import { Button } from "@/components/atoms/Button";
import { Icon } from "@/components/icons";
import GlideMenu from "@/components/primitives/GlideMenu";

export type ConversationItem = {
  id: string;
  title: string;
  updatedAt: string;
};

export function ConversationRail({
  items,
  activeId,
  onNew,
  onPick,
}: {
  items: ConversationItem[];
  activeId: string | null;
  onNew: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <div className="mt-6 flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2 px-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-3">Chat History</p>
        <Button 
          type="button" 
          variant="quiet" 
          size="xs" 
          onClick={onNew}
          className="gap-1.5 transition-transform hover:scale-105"
        >
          <Icon icon="newChat" size={14} />
          New
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 rounded-lg border border-line/50 bg-inset/30 p-4 text-center">
          <Icon icon="chat" size={20} className="mx-auto mb-2 text-ink-3" />
          <p className="text-xs text-ink-3">No conversations yet</p>
          <p className="mt-1 text-xs text-ink-3">Start chatting to see history</p>
        </div>
      ) : (
        <div className="mt-3 min-h-0 flex-1 space-y-1 overflow-y-auto py-1">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                title={item.title}
                onClick={() => onPick(item.id)}
                className={`group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                  active 
                    ? "bg-accent/10 font-medium text-accent shadow-[0_0_0_1px_var(--accent-tint)]" 
                    : "text-ink-2 hover:bg-hover/60 hover:text-ink hover:shadow-hairline"
                }`}
              >
                <Icon 
                  icon="chat" 
                  size={14} 
                  className={`shrink-0 transition-all ${
                    active 
                      ? "text-accent" 
                      : "text-ink-3 group-hover:text-ink-2 group-hover:scale-110"
                  }`} 
                />
                <span className="flex-1 truncate">{item.title || "New chat"}</span>
                {active && (
                  <div className="h-1.5 w-1.5 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
