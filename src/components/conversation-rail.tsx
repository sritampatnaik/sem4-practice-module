"use client";

import { Button } from "@/components/atoms/Button";
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
    <div className="mt-8 flex min-h-0 flex-1 flex-col">
      <div className="flex items-center justify-between gap-2">
        <p className="ui-label">Chats</p>
        <Button type="button" variant="quiet" size="xs" onClick={onNew}>
          New chat
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 px-2 py-2 text-[12.5px] text-ink-3">No chats yet.</p>
      ) : (
        <GlideMenu className="mt-2 min-h-0 flex-1 overflow-y-auto py-0.5">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                data-menu-row
                title={item.title}
                onClick={() => onPick(item.id)}
                className={`relative z-10 flex h-8 w-full items-center rounded-[8px] px-2 text-left text-[13px] ${
                  active ? "font-medium text-ink" : "text-ink-2"
                }`}
              >
                <span className="truncate">{item.title || "New chat"}</span>
              </button>
            );
          })}
        </GlideMenu>
      )}
    </div>
  );
}
