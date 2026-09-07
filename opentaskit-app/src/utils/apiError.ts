import type { ApiErrorResponse, ParsedApiError } from "@/types/api";

/**
 * Extracts a single user-friendly message from an RTK Query or Axios error response.
 */
export function getApiErrorMessage(
  error: unknown,
  fallback = "Unable to complete the request. Please try again.",
): string {
  if (typeof error !== "object" || error === null) return fallback;

  // Handle RTK Query Fetch error (e.g., network offline, wrong host)
  if ("status" in error && error.status === "FETCH_ERROR") {
    return "Cannot connect to the server. Please check your network connection.";
  }

  // Handle HTTP status 429 Too Many Requests
  if ("status" in error && error.status === 429) {
    return "Too many requests. Please wait a moment and try again.";
  }

  // Handle standard JSON error envelope from backend AllExceptionsFilter
  if ("data" in error) {
    const data = error.data as Partial<ApiErrorResponse> | undefined;
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim().length > 0) {
        return data.message;
      }
      if (Array.isArray(data.message) && data.message.length > 0) {
        const messages = data.message.filter(
          (msg): msg is string =>
            typeof msg === "string" && msg.trim().length > 0,
        );
        if (messages.length > 0) return messages.join("\n");
      }
      if (typeof data.error === "string" && data.error.trim().length > 0) {
        return data.error;
      }
    }
  }

  return fallback;
}

/**
 * Parses a backend error response into a general banner message and field-specific errors.
 * Matches class-validator output (e.g. "email must be an email") to the respective input field.
 */
export function parseApiError(
  error: unknown,
  knownFields: string[] = [],
  fallback = "Unable to complete the request. Please try again.",
): ParsedApiError {
  const fieldErrors: Record<string, string> = {};
  const unmatchedMessages: string[] = [];

  if (typeof error !== "object" || error === null) {
    return { generalMessage: fallback, fieldErrors };
  }

  const status =
    "status" in error && typeof error.status === "number"
      ? error.status
      : undefined;

  if ("status" in error && error.status === "FETCH_ERROR") {
    return {
      status,
      generalMessage:
        "Cannot connect to the server. Please check your network connection.",
      fieldErrors,
    };
  }

  if ("data" in error) {
    const data = error.data as Partial<ApiErrorResponse> | undefined;
    if (data && typeof data === "object") {
      const messages: string[] = [];

      if (typeof data.message === "string") {
        messages.push(data.message);
      } else if (Array.isArray(data.message)) {
        messages.push(
          ...data.message.filter((m): m is string => typeof m === "string"),
        );
      }

      // Map each message to a known form field if applicable
      for (const msg of messages) {
        let matched = false;
        const lowerMsg = msg.toLowerCase();

        for (const field of knownFields) {
          const lowerField = field.toLowerCase();
          if (
            lowerMsg.startsWith(lowerField) ||
            lowerMsg.includes(` ${lowerField} `)
          ) {
            if (!fieldErrors[field]) {
              fieldErrors[field] = msg.charAt(0).toUpperCase() + msg.slice(1);
            }
            matched = true;
            break;
          }
        }

        if (!matched) {
          unmatchedMessages.push(msg);
        }
      }

      const generalMessage =
        unmatchedMessages.length > 0
          ? unmatchedMessages.join("\n")
          : Object.keys(fieldErrors).length > 0
            ? ""
            : data.error || fallback;

      return { status, generalMessage, fieldErrors };
    }
  }

  return { status, generalMessage: fallback, fieldErrors };
}
