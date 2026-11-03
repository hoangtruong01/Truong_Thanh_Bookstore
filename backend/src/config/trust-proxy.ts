import { isIP } from 'net';
import type { NestExpressApplication } from '@nestjs/platform-express';

/**
 * Express 'trust proxy' resolution (BUG-011).
 *
 * Behind Render's load balancer the TCP peer is always the proxy, so without
 * 'trust proxy' every request shares the same req.ip and the throttler
 * (default tracker = req.ip) puts the whole system in one rate-limit bucket.
 *
 * Allowed values for TRUST_PROXY:
 * - unset / empty: 1 hop when cloud hosted, disabled locally
 * - 'false': disabled
 * - integer 0-10: number of trusted proxy hops (Render = 1)
 * - 'loopback' | 'linklocal' | 'uniquelocal' or a comma-separated IP/CIDR list
 *
 * 'true' is rejected: Express would then trust the leftmost X-Forwarded-For
 * entry, which the client controls, allowing rate-limit bypass and IP spoofing.
 */
export type TrustProxySetting = false | number | string;

const MAX_TRUSTED_HOPS = 10;
const NAMED_SUBNETS = new Set(['loopback', 'linklocal', 'uniquelocal']);

function isValidProxyAddress(token: string): boolean {
  if (NAMED_SUBNETS.has(token.toLowerCase())) {
    return true;
  }
  const [address, prefix, ...rest] = token.split('/');
  if (rest.length > 0) {
    return false;
  }
  const family = isIP(address);
  if (family === 0) {
    return false;
  }
  if (prefix === undefined) {
    return true;
  }
  if (!/^\d{1,3}$/.test(prefix)) {
    return false;
  }
  const maxPrefix = family === 4 ? 32 : 128;
  return Number(prefix) <= maxPrefix;
}

export function resolveTrustProxy(
  raw: string | undefined,
  isCloudHosted: boolean,
): TrustProxySetting {
  const value = (raw ?? '').trim();

  if (!value) {
    return isCloudHosted ? 1 : false;
  }

  const lowered = value.toLowerCase();
  if (lowered === 'true') {
    throw new Error(
      'TRUST_PROXY=true không an toàn: Express sẽ tin X-Forwarded-For do client tự gửi (bypass rate limit). Hãy dùng số hop cụ thể, ví dụ TRUST_PROXY=1 trên Render.',
    );
  }
  if (lowered === 'false') {
    return false;
  }

  if (/^\d+$/.test(value)) {
    const hops = Number(value);
    if (!Number.isInteger(hops) || hops > MAX_TRUSTED_HOPS) {
      throw new Error(
        `TRUST_PROXY phải là số nguyên từ 0 đến ${MAX_TRUSTED_HOPS} (số proxy tin cậy)`,
      );
    }
    return hops;
  }

  const tokens = value.split(',').map((token) => token.trim());
  if (tokens.some((token) => !token || !isValidProxyAddress(token))) {
    throw new Error(
      'TRUST_PROXY không hợp lệ: chỉ chấp nhận false, số nguyên 0-10, loopback/linklocal/uniquelocal hoặc danh sách IP/CIDR phân tách bằng dấu phẩy',
    );
  }
  return tokens.join(',');
}

export function applyTrustProxy(
  app: NestExpressApplication,
  raw: string | undefined,
  isCloudHosted: boolean,
): TrustProxySetting {
  const value = resolveTrustProxy(raw, isCloudHosted);
  app.set('trust proxy', value);
  return value;
}
