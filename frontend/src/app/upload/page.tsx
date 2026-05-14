"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/components/ui/Toast";
import type { UsageStatus } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const UPLOAD_URL = `${API_BASE}/api/v1/documents/upload`;
const MAX_DEMO_FILE_SIZE_MB = 2;
const MAX_DEMO_FILE_SIZE = MAX_DEMO_FILE_SIZE_MB * 1024 * 1024;
const DAILY_UPLOAD_LIMIT = 2;

function shouldUseSimpleUpload(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0
  );
}

async function uploadWithFetch(file: File): Promise<Response> {
  const formData = new FormData();
  formData.append("file", file);
  return fetch(UPLOAD_URL, {
    method: "POST",
    body: formData,
  });
}

function hasSupportedExtension(fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  return (
    lowerName.endsWith(".pdf") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".docx")
  );
}

export default function UploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState("");
  const [uploadLimit, setUploadLimit] = useState<UsageStatus | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    let active = true;

    async function loadDemoLimits() {
      try {
        const data = await api.demoLimits();
        if (active) {
          setUploadLimit(data.upload);
        }
      } catch {
        if (active) {
          setUploadLimit({
            used: 0,
            limit: DAILY_UPLOAD_LIMIT,
            remaining: DAILY_UPLOAD_LIMIT,
            reached: false,
          });
        }
      }
    }

    loadDemoLimits();

    return () => {
      active = false;
    };
  }, []);

  const handleUpload = useCallback(
    (file: File) => {
      if (uploadLimit?.reached) {
        toast("Daily upload limit reached. Please try again tomorrow.", "error");
        return;
      }

      const validTypes = [
        "application/pdf",
        "text/plain",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (
        !hasSupportedExtension(file.name) &&
        !validTypes.includes(file.type) &&
        file.type !== ""
      ) {
        toast("Only PDF, TXT and DOCX files are supported", "error");
        return;
      }

      if (file.size > MAX_DEMO_FILE_SIZE) {
        toast(
          `File too large. Maximum size is ${MAX_DEMO_FILE_SIZE_MB} MB for the public demo.`,
          "error"
        );
        return;
      }

      setFileName(file.name);
      setIsUploading(true);
      setProgress(0);

      const handleUploadResponse = (status: number, responseText: string) => {
        if (status === 201) {
          toast("Document uploaded successfully", "success");
          router.push("/");
        } else if (status === 413) {
          setIsUploading(false);
          toast(
            `File too large. Maximum size is ${MAX_DEMO_FILE_SIZE_MB} MB for the public demo.`,
            "error"
          );
        } else {
          setIsUploading(false);
          try {
            const err = JSON.parse(responseText);
            toast(err.detail || "Upload failed", "error");
          } catch {
            toast("Upload failed. Please try again.", "error");
          }
        }
      };

      if (shouldUseSimpleUpload()) {
        setProgress(40);
        uploadWithFetch(file)
          .then(async (response) => {
            const responseText = await response.text();
            setProgress(100);
            handleUploadResponse(response.status, responseText);
          })
          .catch(() => {
            setIsUploading(false);
            setProgress(0);
            toast(`Network error while uploading to ${UPLOAD_URL}`, "error");
          });
        return;
      }

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      const formData = new FormData();
      formData.append("file", file);

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress((e.loaded / e.total) * 100);
        }
      });

      xhr.addEventListener("load", () => {
        handleUploadResponse(xhr.status, xhr.responseText);
      });

      xhr.addEventListener("error", async () => {
        setProgress(0);
        try {
          const response = await uploadWithFetch(file);
          const responseText = await response.text();
          handleUploadResponse(response.status, responseText);
        } catch {
          setIsUploading(false);
          toast(`Network error while uploading to ${UPLOAD_URL}`, "error");
        }
      });

      xhr.addEventListener("abort", () => {
        setIsUploading(false);
        setProgress(0);
      });

      xhr.open("POST", UPLOAD_URL);
      xhr.send(formData);
    },
    [router, toast, uploadLimit?.reached]
  );

  const handleCancel = () => {
    xhrRef.current?.abort();
  };

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-semibold tracking-tight mb-2">
          Upload Document
        </h1>
        <p className="text-sm text-[var(--color-ink-muted)] mb-8">
          Public demo: max {DAILY_UPLOAD_LIMIT} uploads per visitor per day,
          files up to {MAX_DEMO_FILE_SIZE_MB} MB
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() =>
          !isUploading && !uploadLimit?.reached && fileInputRef.current?.click()
        }
        className={`flex flex-col items-center justify-center py-24 px-8 border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer animate-fade-in ${
          isDragging
            ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] scale-[1.01]"
            : "border-[var(--color-border)] hover:border-[var(--color-accent)]/30 hover:bg-[var(--color-surface)]"
        } ${isUploading || uploadLimit?.reached ? "cursor-default" : ""}`}
      >
        {uploadLimit?.reached ? (
          <div className="flex flex-col items-center text-center max-w-md animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-error-bg)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--color-error)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12V16.5zm9-4.5a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-medium mb-2">Daily upload limit reached</h2>
            <p className="text-sm text-[var(--color-ink-muted)] leading-relaxed mb-5">
              This public demo allows {DAILY_UPLOAD_LIMIT} uploads per visitor per
              day. Please try again tomorrow.
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push("/");
              }}
              className="px-5 py-2.5 rounded-lg bg-[var(--color-ink)] text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              View Documents
            </button>
          </div>
        ) : isUploading ? (
          <div className="flex flex-col items-center gap-4">
            <ProgressBar progress={progress} fileName={fileName} />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="text-xs text-[var(--color-ink-muted)] hover:text-[var(--color-error)] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-accent-light)] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-[var(--color-ink-muted)] text-lg mb-2">
              Drop your document here
            </p>
            <p className="text-[var(--color-ink-muted)]/50 text-sm">
              or click to browse &middot; max {MAX_DEMO_FILE_SIZE_MB} MB &middot;{" "}
              {uploadLimit
                ? `${uploadLimit.remaining} upload${uploadLimit.remaining === 1 ? "" : "s"} left today`
                : `${DAILY_UPLOAD_LIMIT} uploads/day`}
            </p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.docx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />
      </div>
    </div>
  );
}
