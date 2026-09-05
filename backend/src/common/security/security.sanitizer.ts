/**
 * Security Sanitization Utility
 * Provides protection against NoSQL Injection, Prototype Pollution, and Stored XSS.
 */

// sanitize-html exposes a CommonJS callable; this import keeps Jest and Node aligned.
// eslint-disable-next-line @typescript-eslint/no-require-imports
import sanitizeHtml = require('sanitize-html');

// Fields that must retain raw original values (e.g. passwords for bcrypt, tokens for crypto hashing)
const SENSITIVE_FIELDS_TO_SKIP_XSS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'oldpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'refreshtokenhash',
  'authorization',
  'signature',
  'secret',
  'otp',
  'resetotp',
]);

const FORBIDDEN_PROTOTYPE_KEYS = new Set([
  '__proto__',
  'prototype',
  'constructor',
]);

const HTML_ALLOWLIST: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'ul',
    'ol',
    'li',
    'blockquote',
    'h2',
    'h3',
    'h4',
    'a',
  ],
  allowedAttributes: { a: ['href', 'title', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesAppliedToAttributes: ['href'],
  allowProtocolRelative: false,
  disallowedTagsMode: 'discard',
  enforceHtmlBoundary: true,
  transformTags: {
    a: (_tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        ...(attribs.target === '_blank' ? { rel: 'noopener noreferrer' } : {}),
      },
    }),
  },
};

/**
 * Sanitize a string against Cross-Site Scripting (XSS)
 * Uses an explicit allowlist for the formatting supported by product and article
 * descriptions. Plain text bypasses the HTML parser so names and URLs are not
 * entity-encoded before validation and persistence.
 */
export function sanitizeXss(value: string): string {
  if (typeof value !== 'string') return value;

  if (!value.includes('<')) return value;
  return sanitizeHtml(value, HTML_ALLOWLIST);
}

/**
 * Check if a key is a MongoDB query operator or illegal property accessor
 */
export function isForbiddenKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  // MongoDB query operators start with $
  if (trimmed.startsWith('$')) return true;
  // MongoDB dot notation injection
  if (trimmed.includes('.')) return true;
  // Prototype pollution keys
  if (FORBIDDEN_PROTOTYPE_KEYS.has(trimmed.toLowerCase())) return true;
  return false;
}

export interface SanitizeOptions {
  sanitizeXss?: boolean;
  sanitizeNoSql?: boolean;
  skipFields?: Set<string>;
  maxDepth?: number;
}

/**
 * Recursively sanitizes any payload (Object, Array, Primitive)
 * - Strips forbidden NoSQL operator keys and prototype pollution keys
 * - Strips XSS patterns from string values (except for explicitly skipped sensitive fields like passwords)
 */
export function sanitizePayload<T = any>(
  data: T,
  options: SanitizeOptions = {},
  currentDepth = 0,
  currentKey = '',
): T {
  const {
    sanitizeXss: enableXss = true,
    sanitizeNoSql: enableNoSql = true,
    skipFields = SENSITIVE_FIELDS_TO_SKIP_XSS,
    maxDepth = 15,
  } = options;

  if (currentDepth > maxDepth || data === null || data === undefined) {
    return data;
  }

  // Handle Strings
  if (typeof data === 'string') {
    const isSensitive = skipFields.has(currentKey.toLowerCase());
    if (enableXss && !isSensitive) {
      return sanitizeXss(data) as unknown as T;
    }
    return data;
  }

  // Handle Primitives (number, boolean, etc.)
  if (typeof data !== 'object') {
    return data;
  }

  // Handle Date & RegExp & Buffer instances without modifying them
  if (
    data instanceof Date ||
    data instanceof RegExp ||
    (typeof Buffer !== 'undefined' && Buffer.isBuffer(data))
  ) {
    return data;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    const items: unknown[] = data;
    return items.map((item) =>
      sanitizePayload(item, options, currentDepth + 1, currentKey),
    ) as unknown as T;
  }

  // Handle Objects
  const sanitizedObj: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // 1. NoSQL Injection & Prototype Pollution check on Object Key
    if (enableNoSql && isForbiddenKey(key)) {
      // Omit forbidden keys
      continue;
    }

    // 2. Sanitize value recursively
    sanitizedObj[key] = sanitizePayload(value, options, currentDepth + 1, key);
  }

  return sanitizedObj as T;
}
