const SENSITIVE_KEY_FRAGMENTS = [
  'password',
  'token',
  'authorization',
  'cookie',
  'otp',
  'secret',
  'apikey',
  'creditcard',
  'cardnumber',
  'cvv',
];

const normalizeKey = (key: string): string =>
  key.toLowerCase().replace(/[^a-z0-9]/g, '');

export const isSensitiveLogKey = (key: string): boolean => {
  const normalized = normalizeKey(key);
  return SENSITIVE_KEY_FRAGMENTS.some((fragment) =>
    normalized.includes(fragment),
  );
};

/**
 * Produces a log-safe clone while preserving arrays and primitive values.
 * The depth limit also protects the logger from unexpectedly deep payloads.
 */
export function sanitizeForLogging<T>(data: T, depth = 0): T {
  if (depth > 10 || data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data;
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: data.stack,
    } as T;
  }
  if (Array.isArray(data)) {
    return (data as unknown[]).map((item) =>
      sanitizeForLogging(item, depth + 1),
    ) as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    sanitized[key] = isSensitiveLogKey(key)
      ? '***REDACTED***'
      : sanitizeForLogging(value, depth + 1);
  }
  return sanitized as T;
}
