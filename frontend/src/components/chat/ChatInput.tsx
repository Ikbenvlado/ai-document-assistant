import { useState, useRef, useEffect, KeyboardEvent } from "react";

const MAX_DEMO_QUESTION_LENGTH = 500;

export function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (message: string) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !disabled) {
      onSend(trimmed);
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question..."
          disabled={disabled}
          rows={1}
          maxLength={MAX_DEMO_QUESTION_LENGTH}
          className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2.5 text-sm placeholder:text-[var(--color-ink-muted)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]/40 disabled:opacity-50 transition-all"
        />
        <p className="mt-1 text-[10px] text-[var(--color-ink-muted)]/50 text-right">
          {value.length}/{MAX_DEMO_QUESTION_LENGTH}
        </p>
      </div>
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="shrink-0 px-4 py-2.5 rounded-xl bg-[var(--color-button)] text-[var(--color-button-ink)] text-sm font-medium hover:opacity-90 disabled:opacity-30 transition-all"
      >
        Send
      </button>
    </div>
  );
}
