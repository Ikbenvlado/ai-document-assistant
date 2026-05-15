const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }

  return res.json();
}

export const api = {
  admin: {
    stats: (password: string) =>
      request<import("./types").AdminStatsResponse>("/api/v1/admin/stats", {
        headers: { "X-Admin-Password": password },
      }),
  },
  demoLimits: () =>
    request<import("./types").DemoLimitsResponse>("/api/v1/documents/demo-limits"),
  documents: {
    list: () => request<import("./types").DocumentItem[]>("/api/v1/documents"),
    get: (id: string) =>
      request<import("./types").DocumentDetail>(`/api/v1/documents/${id}`),
    upload: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return fetch(`${API_BASE}/api/v1/documents/upload`, {
        method: "POST",
        body: formData,
      });
    },
    delete: (id: string) =>
      request<{ message: string }>(`/api/v1/documents/${id}`, {
        method: "DELETE",
      }),
    summarize: (id: string) =>
      request<import("./types").SummarizeResponse>(
        `/api/v1/documents/${id}/summarize`,
        { method: "POST" }
      ),
    getSummary: (id: string) =>
      request<import("./types").SummarizeResponse>(
        `/api/v1/documents/${id}/summary`
      ),
  },
  chat: {
    ask: (id: string, question: string) =>
      request<import("./types").ChatResponse>(
        `/api/v1/documents/${id}/chat`,
        {
          method: "POST",
          body: JSON.stringify({ question }),
        }
      ),
  },
};
