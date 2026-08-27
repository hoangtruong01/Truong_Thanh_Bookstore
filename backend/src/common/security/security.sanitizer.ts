/**
 * Security Sanitization Utility
 * Provides protection against NoSQL Injection, Prototype Pollution, and Stored XSS.
 */

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

/**
 * XSS Dangerous patterns and tags
 */
const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const IFRAME_TAG_REGEX = /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi;
const OBJECT_TAG_REGEX = /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi;
const EMBED_TAG_REGEX = /<embed\b[^>]*>/gi;
const APPLET_TAG_REGEX = /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi;
const JAVASCRIPT_URI_REGEX = /(?:java\s*script\s*:|vbscript\s*:|data\s*:\s*text\/html)/gi;
const INLINE_EVENT_HANDLER_REGEX = /\bon\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi;

/**
 * Sanitize a string against Cross-Site Scripting (XSS)
 * Strips script tags, iframes, javascript: pseudo-protocols, and inline event handlers (e.g., onload, onerror)
 */
export function sanitizeXss(value: string): string {
  if (typeof value !== 'string') return value;

  let sanitized = value;

  // 1. Remove dangerous executable HTML tags
  sanitized = sanitized.replace(SCRIPT_TAG_REGEX, '');
  sanitized = sanitized.replace(IFRAME_TAG_REGEX, '');
  sanitized = sanitized.replace(OBJECT_TAG_REGEX, '');
  sanitized = sanitized.replace(EMBED_TAG_REGEX, '');
  sanitized = sanitized.replace(APPLET_TAG_REGEX, '');

  // 2. Remove javascript: pseudo-protocols and data:text/html URIs
  sanitized = sanitized.replace(JAVASCRIPT_URI_REGEX, '');

  // 3. Remove inline event handlers (e.g. <img src=x onerror=alert(1)> -> <img src=x >)
  sanitized = sanitized.replace(INLINE_EVENT_HANDLER_REGEX, '');

  return sanitized;
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
    return data.map((item) =>
      sanitizePayload(item, options, currentDepth + 1, currentKey),
    ) as unknown as T;
  }

  // Handle Objects
  const sanitizedObj: Record<string, any> = {};

  for (const [key, value] of Object.entries(data)) {
    // 1. NoSQL Injection & Prototype Pollution check on Object Key
    if (enableNoSql && isForbiddenKey(key)) {
      // Omit forbidden keys
      continue;
    }

    // 2. Sanitize value recursively
    sanitizedObj[key] = sanitizePayload(
      value,
      options,
      currentDepth + 1,
      key,
    );
  }

  return sanitizedObj as T;
}
