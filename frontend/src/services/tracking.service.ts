import api from '../utils/api';

export interface MarketingEventPayload {
  eventType: string;
  sessionId?: string;
  anonymousId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  url?: string;
  referrer?: string;
  entityType?: string;
  entityId?: string;
  eventData?: Record<string, any>;
}

export const trackingService = {
  track: (data: MarketingEventPayload) => {
    try {
      return api.post('/marketing/events', data);
    } catch {
      // Fire-and-forget; never block consumer
      return Promise.resolve();
    }
  },

  getSummary: (params?: { campaign?: string; startDate?: string; endDate?: string }) =>
    api.get('/marketing/events/summary', { params }),
};
