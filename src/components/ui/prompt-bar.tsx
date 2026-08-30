import type { FormEvent, KeyboardEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function PromptBar({
  id,
  value,
  onChange,
  onSubmit,
  onStop,
  busy,
  disabled,
  placeholder,
  extra,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  busy?: boolean;
  disabled?: boolean;
  placeholder: string;
  extra?: ReactNode;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!busy) onSubmit();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!busy) onSubmit();
    }
  };

  return (
    <form onSubmit={submit}>
      {extra}
      <div className="ui-card flex items-end gap-3 px-4 py-3">
        <label className="sr-only" htmlFor={id}>
          {placeholder}
        </label>
        <textarea
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          placeholder={placeholder}
          disabled={disabled}
          className="min-h-[3rem] flex-1 resize-none border-0 bg-transparent py-1.5 outline-none"
        />
        {busy ? (
          <Button type="button" variant="secondary" onClick={onStop}>
            Stop
          </Button>
        ) : (
          <Button type="submit" disabled={!value.trim() || disabled}>
            Send
          </Button>
        )}
      </div>
    </form>
  );
}
