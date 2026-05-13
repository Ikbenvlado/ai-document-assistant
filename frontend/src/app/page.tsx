"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { DocumentItem } from "@/lib/types";
import { DocumentCard } from "@/components/documents/DocumentCard";
import { PageLoading } from "@/components/ui/LoadingSpinner";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

export default function Home() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const { toast } = useToast();

  const loadDocs = useCallback(async () => {
    try {
      const data = await api.documents.list();
      setDocs(data);
      setError(null);
    } catch {
      setError("Failed to load documents. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialDocs() {
      try {
        const data = await api.documents.list();
        if (!active) return;
        setDocs(data);
        setError(null);
      } catch {
        if (active) {
          setError("Failed to load documents. Is the backend running?");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInitialDocs();

    return () => {
      active = false;
    };
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError(null);
    await loadDocs();
  }, [loadDocs]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.documents.delete(deleteTarget.id);
      setDocs((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      toast(`"${deleteTarget.filename}" deleted`, "success");
    } catch {
      toast("Failed to delete document", "error");
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Documents</h1>
          <p className="text-sm text-[var(--color-ink-muted)] mt-1">
            {docs.length} document{docs.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/upload"
          className="px-4 py-2 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:opacity-90 transition-all duration-200 hover:shadow-md"
        >
          Upload New
        </Link>
      </div>

      {error && <ErrorState message={error} onRetry={fetchDocs} />}

      {!error && docs.length === 0 && (
        <EmptyState
          title="No documents yet"
          description="Upload your first PDF or TXT document to get started."
          actionLabel="Upload Document"
          actionHref="/upload"
        />
      )}

      {!error && docs.length > 0 && (
        <div className="grid gap-3">
          {docs.map((doc, i) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={() => setDeleteTarget(doc)}
              className={`animate-fade-in stagger-${Math.min(i + 1, 8)}`}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteTarget?.filename}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
