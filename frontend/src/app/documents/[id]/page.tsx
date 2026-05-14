"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { DocumentDetail } from "@/lib/types";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { friendlySummaryError } from "@/lib/errors";

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryLimitNotice, setSummaryLimitNotice] = useState<string | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadDoc = useCallback(async () => {
    try {
      const data = await api.documents.get(id);
      setDoc(data);
      setError(null);
    } catch {
      setError("Document not found. It may have been deleted.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let active = true;

    async function loadInitialDoc() {
      try {
        const data = await api.documents.get(id);
        if (!active) return;
        setDoc(data);
        setError(null);
      } catch {
        if (active) {
          setError("Document not found. It may have been deleted.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialDoc();

    return () => {
      active = false;
    };
  }, [id]);

  const fetchDoc = useCallback(async () => {
    setLoading(true);
    setError(null);
    await loadDoc();
  }, [loadDoc]);

  const handleSummarize = async () => {
    setSummaryLoading(true);
    setSummaryLimitNotice(null);
    try {
      const data = await api.documents.summarize(id);
      setDoc((prev) => (prev ? { ...prev, summary: data.summary } : prev));
      toast("Summary generated", "success");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Summary could not be generated right now.";
      const isLimitError =
        message.toLowerCase().includes("limit") ||
        message.toLowerCase().includes("too many");

      if (isLimitError) {
        setSummaryLimitNotice(
          "The public demo has reached its summary limit for now. You can still read the document and use chat if your chat limit is available."
        );
        toast("Summary limit reached for the public demo", "info");
      } else {
        toast(friendlySummaryError(message), "error");
      }
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await api.documents.delete(id);
      toast("Document deleted", "success");
      router.push("/");
    } catch {
      toast("Document could not be deleted right now. Please try again.", "error");
    }
  };

  if (loading) return <PageLoading />;

  if (error || !doc) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <ErrorState message={error || "Document not found"} onRetry={fetchDoc} />
      </div>
    );
  }

  const isProcessing = doc.status === "processing";

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{doc.filename}</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            {doc.file_type.toUpperCase()} &middot;{" "}
            {new Date(doc.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
            {" "}&middot; {doc.status}
          </p>
        </div>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isProcessing}
          className="px-4 py-2 rounded-lg text-sm text-[var(--color-error)] hover:bg-[var(--color-error-bg)] transition-colors font-medium"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-[var(--color-border)] rounded-2xl p-6 bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <h2 className="text-lg font-medium">Summary</h2>
          </div>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-[var(--color-ink-muted)]/50">
                This document is still processing.
              </p>
              <button
                onClick={fetchDoc}
                className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-dark)] transition-all duration-200"
              >
                Refresh
              </button>
            </div>
          ) : doc.summary ? (
            <div className="animate-fade-in">
              <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed whitespace-pre-wrap">
                {doc.summary}
              </p>
              <span className="inline-block mt-3 text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent-dark)] font-medium uppercase tracking-wide">
                AI Generated
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              {summaryLimitNotice && (
                <div className="w-full rounded-xl border border-[var(--color-accent)]/25 bg-[var(--color-accent-light)] p-4 text-left animate-fade-in">
                  <div className="flex items-start gap-3">
                    <span className="w-8 h-8 rounded-lg bg-[var(--color-surface)] text-[var(--color-accent)] flex items-center justify-center shrink-0">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.8}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                        Summary limit reached
                      </h3>
                      <p className="text-xs text-[var(--color-ink-muted)] leading-relaxed mt-1">
                        {summaryLimitNotice}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <p className="text-sm text-[var(--color-ink-muted)]/50">
                Generate an AI-powered summary of this document.
              </p>
              <button
                onClick={handleSummarize}
                disabled={summaryLoading}
                className="px-5 py-2.5 rounded-lg bg-[var(--color-accent)] text-white text-sm font-medium hover:bg-[var(--color-accent-dark)] disabled:opacity-50 transition-all duration-200 flex items-center gap-2"
              >
                {summaryLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Summary"
                )}
              </button>
            </div>
          )}
        </div>

        <div className="border border-[var(--color-border)] rounded-2xl p-6 bg-[var(--color-surface)]">
          <div className="flex items-center gap-2 mb-4">
            <svg className="w-5 h-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
            <h2 className="text-lg font-medium">Chat</h2>
          </div>
          <ChatWindow documentId={id} disabled={isProcessing} />
        </div>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Document"
        message={`Are you sure you want to delete "${doc.filename}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
