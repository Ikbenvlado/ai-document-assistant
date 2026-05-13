import Link from "next/link";
import type { DocumentItem } from "@/lib/types";

export function DocumentCard({
  doc,
  onDelete,
  className = "",
}: {
  doc: DocumentItem;
  onDelete: (id: string) => void;
  className?: string;
}) {
  const date = new Date(doc.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isReady = doc.status === "ready" || doc.status === "summarized";

  return (
    <div
      className={`border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-accent)]/30 hover:shadow-md transition-all duration-200 bg-[var(--color-surface)] ${className}`}
    >
      <div className="flex items-start justify-between gap-4">
        <Link href={`/documents/${doc.id}`} className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{doc.filename}</h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-[var(--color-background)] text-[var(--color-ink-muted)] uppercase tracking-wide font-medium">
              {doc.file_type}
            </span>
            <span className="text-xs text-[var(--color-ink-muted)]/60">{date}</span>
            <span
              className={`text-[11px] px-1.5 py-0.5 rounded-md font-medium ${
                isReady
                  ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                  : "bg-[var(--color-accent-light)] text-[var(--color-accent-dark)]"
              }`}
            >
              {doc.status}
            </span>
          </div>
          {doc.text_preview && (
            <p className="text-xs text-[var(--color-ink-muted)]/50 mt-2 line-clamp-2 font-mono">
              {doc.text_preview}
            </p>
          )}
        </Link>
        <button
          onClick={(e) => {
            e.preventDefault();
            onDelete(doc.id);
          }}
          className="text-[var(--color-ink-muted)]/30 hover:text-[var(--color-error)] transition-colors shrink-0 p-1"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
