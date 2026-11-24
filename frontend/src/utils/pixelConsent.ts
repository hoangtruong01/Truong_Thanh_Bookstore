/**
 * Pixel & Consent Management Utility (ADS-02, ADS-03)
 * Guarantees that non-essential analytics & marketing pixels (Meta Pixel, TikTok Pixel, GA4)
 * strictly respect user consent and do not execute or dispatch unauthorized data.
 */

const CONSENT_STORAGE_KEY = 'tt_marketing_pixel_consent';

export type ConsentStatus = 'granted' | 'denied' | 'pending';

export function getConsentStatus(): ConsentStatus {
  if (typeof window === 'undefined') return 'denied';
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') {
      return stored;
    }
  } catch {
    // Ignore private browsing storage quota exceptions
  }
  return 'pending';
}

export function grantConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    // Notify window gtag / fbq if configured
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'granted',
        analytics_storage: 'granted',
      });
    }
  } catch {
    // Ignore private browsing storage quota exceptions
  }
}

export function revokeConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    if ((window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'denied',
        analytics_storage: 'denied',
      });
    }
  } catch {
    // Ignore private browsing storage quota exceptions
  }
}

/**
 * Generate deduplication event_id matching browser pixel and server-side CAPI / Outbox
 */
export function generateEventId(prefix = 'evt'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${timestamp}_${randomStr}`;
}

export interface StandardPixelPayload {
  eventName: string;
  eventId: string;
  contentId?: string;
  contentName?: string;
  value?: number;
  currency?: string;
}

/**
 * Safe client-side pixel event dispatcher.
 * Silently drops event if consent is not granted or SDKs are absent.
 */
export function dispatchPixelEvent(payload: StandardPixelPayload): void {
  if (getConsentStatus() !== 'granted') {
    return;
  }

  // Meta Pixel (fbq)
  if (typeof (window as any).fbq === 'function') {
    (window as any).fbq('track', payload.eventName, {
      content_ids: payload.contentId ? [payload.contentId] : undefined,
      content_name: payload.contentName,
      value: payload.value,
      currency: payload.currency || 'VND',
    }, { eventID: payload.eventId });
  }

  // TikTok Pixel (ttq)
  if ((window as any).ttq && typeof (window as any).ttq.track === 'function') {
    (window as any).ttq.track(payload.eventName, {
      content_id: payload.contentId,
      content_name: payload.contentName,
      value: payload.value,
      currency: payload.currency || 'VND',
      event_id: payload.eventId,
    });
  }

  // GA4 (gtag)
  if (typeof (window as any).gtag === 'function') {
    (window as any).gtag('event', payload.eventName, {
      event_id: payload.eventId,
      value: payload.value,
      currency: payload.currency || 'VND',
    });
  }
}
