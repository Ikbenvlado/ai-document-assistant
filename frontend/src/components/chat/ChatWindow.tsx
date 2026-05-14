"use client";

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { api } from "@/lib/api";
import { friendlyChatError } from "@/lib/errors";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

export function ChatWindow({
  documentId,
  disabled = false,
}: {
  documentId: string;
  disabled?: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (question: string) => {
    if (disabled) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);
    setError(null);

    try {
      const data = await api.chat.ask(documentId, question);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer, sources: data.sources },
      ]);
    } catch (err) {
      setError(
        friendlyChatError(
          err instanceof Error ? err.message : "Chat is unavailable right now."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-[var(--color-ink-muted)]/40">
            {disabled
              ? "Chat will be available when processing finishes."
              : "Ask a question about this document."}
          </div>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} {...msg} />
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-[var(--color-background)] border border-[var(--color-border)] rounded-2xl px-4 py-3">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[var(--color-accent)]/40 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-[var(--color-accent)]/40 rounded-full animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 bg-[var(--color-accent)]/40 rounded-full animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          </div>
        )}
        {error && (
          <p className="text-sm text-[var(--color-error)] text-center">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="pt-4 border-t border-[var(--color-border)] mt-4">
        <ChatInput onSend={handleSend} disabled={loading || disabled} />
      </div>
    </div>
  );
}
