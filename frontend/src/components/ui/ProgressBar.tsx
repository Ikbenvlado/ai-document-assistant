export function ProgressBar({ progress, fileName }: { progress: number; fileName?: string }) {
  return (
    <div className="w-full max-w-sm mx-auto">
      {fileName && (
        <p className="text-sm text-[var(--color-ink-muted)] mb-3 text-center truncate">
          {fileName}
        </p>
      )}
      <div className="h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-[var(--color-ink-muted)] mt-2 text-center">
        {progress < 100 ? `${Math.round(progress)}% uploaded` : "Processing document..."}
      </p>
    </div>
  );
}
