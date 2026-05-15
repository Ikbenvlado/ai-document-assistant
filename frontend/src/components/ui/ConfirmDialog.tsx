"use client";

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onCancel} />
      <div className="relative bg-[var(--color-surface)] rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4 animate-fade-in border border-[var(--color-border)]">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-[var(--color-ink-muted)] mb-6 break-words">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-[var(--color-ink-muted)] hover:bg-[var(--color-background)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-[var(--color-error)] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
