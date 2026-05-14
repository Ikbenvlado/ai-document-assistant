import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  return (
    <nav className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
        <Link href="/" className="font-semibold text-lg tracking-tight flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[var(--color-button)] text-[var(--color-button-ink)] flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
          DocAI
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Documents
          </Link>
          <Link
            href="/upload"
            className="text-sm px-4 py-1.5 rounded-lg bg-[var(--color-button)] text-[var(--color-button-ink)] hover:opacity-90 transition-opacity font-medium"
          >
            Upload
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
