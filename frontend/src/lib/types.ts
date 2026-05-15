export interface DocumentItem {
  id: string;
  filename: string;
  file_type: string;
  text_preview: string | null;
  summary: string | null;
  status: string;
  created_at: string;
}

export interface DocumentDetail extends DocumentItem {
  full_text: string | null;
}

export interface ChatRequest {
  question: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
}

export interface SummarizeResponse {
  summary: string;
}

export interface UsageStatus {
  used: number;
  limit: number;
  remaining: number;
  reached: boolean;
}

export interface DemoLimitsResponse {
  upload: UsageStatus;
}

export interface AdminActionStats {
  action: "upload" | "delete" | "chat" | "summary";
  today: number;
  total: number;
}

export interface AdminStatusStats {
  status: string;
  count: number;
}

export interface AdminFileTypeStats {
  file_type: string;
  count: number;
}

export interface AdminDailyUsage {
  usage_date: string;
  upload: number;
  delete: number;
  chat: number;
  summary: number;
}

export interface AdminStatsResponse {
  documents_total: number;
  actions: AdminActionStats[];
  statuses: AdminStatusStats[];
  file_types: AdminFileTypeStats[];
  recent_usage: AdminDailyUsage[];
}
