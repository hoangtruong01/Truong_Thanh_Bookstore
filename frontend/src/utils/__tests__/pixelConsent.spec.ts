import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getConsentStatus,
  grantConsent,
  revokeConsent,
  generateEventId,
  dispatchPixelEvent,
} from '../pixelConsent';

describe('pixelConsent Utility (ADS-02, ADS-03)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should default to pending when no consent is set', () => {
    expect(getConsentStatus()).toBe('pending');
  });

  it('should update to granted when grantConsent is called', () => {
    grantConsent();
    expect(getConsentStatus()).toBe('granted');
  });

  it('should update to denied when revokeConsent is called', () => {
    grantConsent();
    revokeConsent();
    expect(getConsentStatus()).toBe('denied');
  });

  it('should generate deduplicated event_id with prefix', () => {
    const id1 = generateEventId('pur');
    const id2 = generateEventId('pur');

    expect(id1).toMatch(/^pur_[a-z0-9]+_[a-z0-9]+$/);
    expect(id2).toMatch(/^pur_[a-z0-9]+_[a-z0-9]+$/);
    expect(id1).not.toBe(id2);
  });

  it('should not dispatch pixel events if consent is denied or pending', () => {
    const mockFbq = vi.fn();
    (window as any).fbq = mockFbq;

    dispatchPixelEvent({
      eventName: 'Purchase',
      eventId: 'evt_123',
      value: 500000,
    });

    // Consent is pending -> must NOT dispatch
    expect(mockFbq).not.toHaveBeenCalled();

    // Now grant consent
    grantConsent();
    dispatchPixelEvent({
      eventName: 'Purchase',
      eventId: 'evt_123',
      value: 500000,
    });

    expect(mockFbq).toHaveBeenCalledWith(
      'track',
      'Purchase',
      expect.objectContaining({ value: 500000, currency: 'VND' }),
      { eventID: 'evt_123' },
    );
  });
});
