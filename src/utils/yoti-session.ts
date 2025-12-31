import type { YotiCallbackPayload } from '../hooks/useYotiCallbackListener';

const INVALID_SESSION_PREFIX = '[object ';

export function normalizeYotiSessionId(value?: string | null) {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (trimmed.startsWith(INVALID_SESSION_PREFIX)) {
    console.warn('Discarding suspicious Yoti session id', trimmed);
    return undefined;
  }
  if (trimmed === 'undefined' || trimmed === 'null') {
    return undefined;
  }
  return trimmed;
}

export function extractSessionIdFromPayload(payload: YotiCallbackPayload) {
  const candidates = [payload.sessionId, payload.session?.id, payload.session?.session_id];
  for (const candidate of candidates) {
    const normalized = normalizeYotiSessionId(candidate);
    if (normalized) {
      return normalized;
    }
  }
  return undefined;
}
