"use client";

import PromptBarPrimitive from "@/components/primitives/PromptBar";

export function PromptBar({
  id,
  onSubmit,
  onStop,
  busy,
  placeholder,
}: {
  id: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit: (text: string) => void;
  onStop?: () => void;
  busy?: boolean;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <PromptBarPrimitive
      id={id}
      demo={false}
      tall
      busy={busy}
      onStop={onStop}
      placeholder={placeholder}
      onSend={(text) => onSubmit(text)}
    />
  );
}
