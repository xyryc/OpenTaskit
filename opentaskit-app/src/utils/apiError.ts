/** API validation errors may contain several messages; transport errors have no body. */
export function getApiErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = error.data;
    if (typeof data === 'object' && data !== null && 'message' in data) {
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.message)) {
        const messages = data.message.filter((item): item is string => typeof item === 'string');
        if (messages.length) return messages.join('\n');
      }
    }
  }
  return 'Unable to complete the request. Please try again.';
}
