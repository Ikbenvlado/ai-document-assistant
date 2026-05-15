"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Documents" },
    { href: "/upload", label: "Upload", button: true },
  ];

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

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] transition-colors"
          >
            Documents
          </Link>
          <Link
            href="/upload"
            className="text-sm px-4 py-1.5 rounded-lg bg-[var(--color-button)] text-[var(--color-button-ink)] hover:opacity-80 active:scale-95 transition-all font-medium"
          >
            Upload
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="p-1.5 rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-background)] transition-colors"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-3 flex flex-col gap-1">
          {links.map(({ href, label, button }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={
                button
                  ? "text-sm px-4 py-2 rounded-lg bg-[var(--color-button)] text-[var(--color-button-ink)] hover:opacity-80 transition-all font-medium text-center"
                  : `text-sm py-2 px-1 rounded-lg transition-colors font-medium ${
                      pathname === href
                        ? "text-[var(--color-ink)]"
                        : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    }`
              }
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
