import { ServiceUnavailableException } from '@nestjs/common';

/**
 * BE-04: Resilient HTTP client wrapper using AbortController for third-party integrations
 * (Payment Gateways, Shipping Providers, Webhooks) to prevent thread/connection starvation.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: unknown) {
    const isAbort =
      (error instanceof Error && error.name === 'AbortError') ||
      (typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        error.name === 'AbortError');
    if (isAbort) {
      throw new ServiceUnavailableException(
        `Kết nối dịch vụ bên thứ ba bị quá hạn (${timeoutMs / 1000}s). Vui lòng thử lại sau.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
