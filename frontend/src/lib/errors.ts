export function friendlyUploadError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("password protected") || lower.includes("unlocked pdf")) {
    return "This PDF is locked. Please upload an unlocked PDF file.";
  }
  if (lower.includes("could not be read") || lower.includes("valid pdf")) {
    return "This PDF could not be read. Please try another PDF, TXT, or DOCX file.";
  }
  if (lower.includes("unsupported file")) {
    return "This file type is not supported. Please upload PDF, TXT, or DOCX.";
  }
  if (lower.includes("too large")) {
    return "This file is too large for the public demo. Please upload a file up to 2 MB.";
  }
  if (lower.includes("limit") || lower.includes("too many")) {
    return "The public demo upload limit has been reached. Please try again later.";
  }

  return "Upload could not be completed. Please try another PDF, TXT, or DOCX file.";
}

export function friendlyChatError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("limit") || lower.includes("too many")) {
    return "The public demo chat limit has been reached. Please try again later.";
  }
  if (lower.includes("processing")) {
    return "This document is still processing. Please try again in a moment.";
  }
  if (lower.includes("failed document")) {
    return "This document could not be processed, so chat is unavailable for it.";
  }
  if (lower.includes("too long")) {
    return "That question is too long for the public demo. Please shorten it and try again.";
  }

  return "Chat is temporarily unavailable for this document. Please try again later.";
}

export function friendlySummaryError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("processing")) {
    return "This document is still processing. Please try again in a moment.";
  }
  if (lower.includes("failed document")) {
    return "This document could not be processed, so summary is unavailable for it.";
  }

  return "Summary could not be generated right now. Please try again later.";
}
