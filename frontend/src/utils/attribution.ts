/**
 * UTM & Marketing Attribution Helper
 * Stores attribution parameters in sessionStorage and attaches them to orders.
 */

const STORAGE_KEY = 'tt_attribution';

export interface OrderAttribution {
  source?: string;
  medium?: string;
  campaignCode?: string;
  creativeCode?: string;
  landingPage?: string;
  referrer?: string;
}

export function initAttributionCapture(): void {
  if (typeof window === 'undefined') return;

  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get('utm_source');
    const utmMedium = params.get('utm_medium');
    const utmCampaign = params.get('utm_campaign');
    const utmContent = params.get('utm_content');

    if (utmSource || utmCampaign) {
      const attribution: OrderAttribution = {
        source: utmSource || undefined,
        medium: utmMedium || undefined,
        campaignCode: utmCampaign || undefined,
        creativeCode: utmContent || undefined,
        landingPage: window.location.pathname,
        referrer: document.referrer || undefined,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
    }
  } catch {
    // Graceful fallback for private modes
  }
}

export function getStoredAttribution(): OrderAttribution | undefined {
  if (typeof window === 'undefined') return undefined;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
