"use client";

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
        <button
          type="button"
          onClick={onNew}
          className="rounded-[8px] px-2 py-1 text-[12.5px] font-medium text-ink-2 transition-colors hover:bg-hover-2 hover:text-ink"
        >
          New chat
        </button>
      </div>
      <ul className="mt-2 min-h-0 flex-1 space-y-px overflow-y-auto">
        {items.length === 0 ? (
          <li className="px-2 py-2 text-[12.5px] text-ink-3">No chats yet.</li>
        ) : (
          items.map((item) => {
            const active = item.id === activeId;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  title={item.title}
                  onClick={() => onPick(item.id)}
                  className={`flex h-8 w-full items-center rounded-[8px] px-2 text-left text-[13px] transition-colors ${
                    active
                      ? "bg-hover-2 font-medium text-ink"
                      : "text-ink-2 hover:bg-hover hover:text-ink"
                  }`}
                >
                  <span className="truncate">{item.title || "New chat"}</span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
