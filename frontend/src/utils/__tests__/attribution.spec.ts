import { describe, it, expect, beforeEach } from 'vitest';
import { initAttributionCapture, getStoredAttribution } from '../attribution';

describe('Marketing Attribution (TRK-02)', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('captures UTM parameters from location query into session storage', () => {
    // Mock window.location
    delete (window as any).location;
    window.location = new URL('https://truongthanh.vn/products?utm_source=facebook&utm_medium=cpc&utm_campaign=KHAITRUONG_2026&utm_content=ad_creative_1') as any;

    initAttributionCapture();

    const stored = getStoredAttribution();
    expect(stored).toBeDefined();
    expect(stored?.source).toBe('facebook');
    expect(stored?.medium).toBe('cpc');
    expect(stored?.campaignCode).toBe('KHAITRUONG_2026');
    expect(stored?.creativeCode).toBe('ad_creative_1');
    expect(stored?.landingPage).toBe('/products');
  });

  it('returns undefined when no attribution is stored', () => {
    expect(getStoredAttribution()).toBeUndefined();
  });
});
