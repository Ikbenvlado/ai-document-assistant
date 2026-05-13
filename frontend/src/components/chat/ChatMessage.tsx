export function ChatMessage({
  role,
  content,
  sources,
}: {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
          role === "user"
            ? "bg-[var(--color-ink)] text-white"
            : "bg-[var(--color-background)] text-[var(--color-ink)] border border-[var(--color-border)]"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        {sources && sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-[var(--color-border)]/40">
            <p className="text-xs text-[var(--color-ink-muted)]/60 mb-1 font-medium">Sources</p>
            {sources.map((s, i) => (
              <p key={i} className="text-xs text-[var(--color-ink-muted)]/50 italic line-clamp-1 leading-relaxed">
                {s}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
