import api from '../utils/api';

export interface AdsPerformanceItem {
  _id: string;
  platform: 'META' | 'TIKTOK' | 'GOOGLE' | 'OTHER';
  adAccountId: string;
  campaignId: string;
  campaignName: string;
  internalCampaignCode?: string;
  date: string;
  spend: number;
  currency: string;
  impressions: number;
  clicks: number;
  providerConversions?: number;
  providerConversionValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdsSummary {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalProviderConversions: number;
  totalProviderConversionValue: number;
  ctrPercentage: number;
  cpcVnd: number;
}

export interface BlendedRoasResult {
  campaignCode?: string;
  adSpendVnd: number;
  attributedRevenueVnd: number;
  attributedOrdersCount: number;
  blendedRoas: number;
}

export const adsService = {
  getPerformance: (params?: {
    platform?: string;
    internalCampaignCode?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    api.get<{ items: AdsPerformanceItem[]; summary: AdsSummary }>(
      '/marketing/ads/performance',
      { params },
    ),

  recordPerformance: (data: {
    platform: string;
    adAccountId: string;
    campaignId: string;
    campaignName: string;
    internalCampaignCode?: string;
    date: string;
    spend: number;
    currency?: string;
    impressions: number;
    clicks: number;
    providerConversions?: number;
    providerConversionValue?: number;
  }) => api.post<AdsPerformanceItem>('/marketing/ads/performance', data),

  mapCampaign: (data: { campaignId: string; internalCampaignCode: string }) =>
    api.post<{ updatedCount: number }>('/marketing/ads/map-campaign', data),

  getBlendedRoas: (campaignCode?: string) =>
    api.get<BlendedRoasResult>('/marketing/ads/roas', {
      params: campaignCode ? { campaignCode } : {},
    }),
};
