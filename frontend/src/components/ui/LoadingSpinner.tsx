export function LoadingSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 animate-fade-in">
      <div className="w-8 h-8 border-3 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin" />
      <p className="text-sm text-[var(--color-ink-muted)]">{label}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-[var(--color-border)] rounded-xl p-5 bg-[var(--color-surface)] animate-shimmer">
      <div className="h-4 w-48 rounded bg-[var(--color-border)] mb-3" />
      <div className="flex gap-2">
        <div className="h-5 w-10 rounded bg-[var(--color-border)]" />
        <div className="h-5 w-24 rounded bg-[var(--color-border)]" />
        <div className="h-5 w-16 rounded bg-[var(--color-border)]" />
      </div>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="h-8 w-48 rounded bg-[var(--color-border)] mb-8 animate-shimmer" />
      <div className="grid gap-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
