"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import type { AdminStatsResponse } from "@/lib/types";

const STORAGE_KEY = "docai-admin-password";

const ACTION_LABELS: Record<string, string> = {
  upload: "Uploads",
  delete: "Deletes",
  chat: "Chat",
  summary: "Summaries",
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const savedPassword = window.localStorage.getItem(STORAGE_KEY);
    if (savedPassword) {
      setPassword(savedPassword);
      loadStats(savedPassword);
    }
  }, []);

  const maxDailyValue = useMemo(() => {
    if (!stats) return 1;
    return Math.max(
      1,
      ...stats.recent_usage.flatMap((day) => [
        day.upload,
        day.delete,
        day.chat,
        day.summary,
      ])
    );
  }, [stats]);

  async function loadStats(adminPassword = password) {
    if (!adminPassword.trim()) {
      setError("Enter the admin password to view statistics.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const data = await api.admin.stats(adminPassword);
      window.localStorage.setItem(STORAGE_KEY, adminPassword);
      setStats(data);
    } catch {
      setStats(null);
      setError("Admin password is invalid or the stats endpoint is unavailable.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    loadStats();
  }

  function logout() {
    window.localStorage.removeItem(STORAGE_KEY);
    setPassword("");
    setStats(null);
    setError("");
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Admin</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            Private usage statistics for the public demo.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Admin password"
            className="min-w-0 flex-1 md:w-64 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]/40"
          />
          <button
            type="submit"
            disabled={loading}
            className="h-10 px-4 rounded-xl bg-[var(--color-button)] text-[var(--color-button-ink)] text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all"
          >
            {loading ? "Loading" : "Open"}
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-[var(--color-error)]/20 bg-[var(--color-error-bg)] px-4 py-3 text-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-ink-muted)]">
              Documents in database:{" "}
              <span className="font-semibold text-[var(--color-ink)]">
                {stats.documents_total}
              </span>
            </p>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-error)] transition-colors"
            >
              Clear password
            </button>
          </div>

          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.actions.map((action) => (
              <div
                key={action.action}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
              >
                <p className="text-xs uppercase font-semibold text-[var(--color-ink-muted)] tracking-wide">
                  {ACTION_LABELS[action.action] || action.action}
                </p>
                <p className="text-3xl font-semibold mt-3">{action.today}</p>
                <p className="text-xs text-[var(--color-ink-muted)] mt-1">
                  today · {action.total} total
                </p>
              </div>
            ))}
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatsList
              title="Document Status"
              rows={stats.statuses.map((item) => ({
                label: item.status,
                value: item.count,
              }))}
            />
            <StatsList
              title="File Types"
              rows={stats.file_types.map((item) => ({
                label: item.file_type.toUpperCase(),
                value: item.count,
              }))}
            />
          </section>

          <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="text-lg font-medium mb-4">Last 7 Days</h2>
            <div className="space-y-4">
              {stats.recent_usage.map((day) => (
                <div key={day.usage_date} className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--color-ink-muted)]">
                    <span>{day.usage_date}</span>
                    <span>
                      {day.upload + day.delete + day.chat + day.summary} actions
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["upload", "delete", "chat", "summary"] as const).map(
                      (action) => (
                        <div key={action}>
                          <div className="h-2 rounded-full bg-[var(--color-background)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-[var(--color-accent)]"
                              style={{
                                width: `${Math.max(
                                  4,
                                  (day[action] / maxDailyValue) * 100
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="mt-1 text-[10px] text-[var(--color-ink-muted)]">
                            {ACTION_LABELS[action]}: {day[action]}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function StatsList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
}) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <h2 className="text-lg font-medium mb-4">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--color-ink-muted)]">No data yet.</p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-ink-muted)]">
                {row.label}
              </span>
              <span className="text-sm font-semibold">{row.value}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
