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
