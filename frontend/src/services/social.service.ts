import api from '../utils/api';

export interface SocialAccount {
  _id: string;
  platform: 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'OTHER';
  accountId: string;
  accountName: string;
  accountType: 'PAGE' | 'AD_ACCOUNT' | 'CREATOR_PROFILE';
  status: 'NOT_CONNECTED' | 'CONNECTING' | 'CONNECTED' | 'NEEDS_REAUTH' | 'DISCONNECTED' | 'ERROR';
  capabilities: string[];
  avatarUrl?: string;
  lastSyncedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoScriptDetails {
  hook?: string;
  bodyPoints?: string[];
  cta?: string;
  estimatedDurationSeconds?: number;
}

export interface SocialPost {
  _id: string;
  title: string;
  platform: 'FACEBOOK' | 'TIKTOK' | 'INSTAGRAM' | 'OTHER';
  postType: string;
  content: string;
  hashtags: string[];
  mediaUrls: string[];
  targetUrl?: string;
  productId?: {
    _id: string;
    name: string;
    sku?: string;
    price: number;
    discountPrice?: number;
    images?: string[];
  };
  campaignId?: {
    _id: string;
    code: string;
    name: string;
  };
  status:
    | 'DRAFT'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'SCHEDULED'
    | 'PUBLISHED'
    | 'MANUAL_RECORDED'
    | 'FAILED'
    | 'ARCHIVED';
  videoScriptDetails?: VideoScriptDetails;
  scheduledAt?: string;
  publishedAt?: string;
  externalPostId?: string;
  externalPermalink?: string;
  rejectionReason?: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateContentResult {
  title: string;
  content: string;
  hashtags: string[];
  targetUrl: string;
  mediaUrls: string[];
  videoScriptDetails?: {
    hook: string;
    bodyPoints: string[];
    cta: string;
    estimatedDurationSeconds: number;
  };
}

export const socialService = {
  // Accounts
  getAccounts: () => api.get<SocialAccount[]>('/marketing/social/accounts'),
  connectAccount: (data: {
    platform: string;
    accountId: string;
    accountName: string;
    accountType?: string;
    capabilities?: string[];
    accessToken?: string;
  }) => api.post<SocialAccount>('/marketing/social/accounts/connect', data),
  disconnectAccount: (id: string) =>
    api.post<SocialAccount>(`/marketing/social/accounts/${id}/disconnect`),

  // Content Assistant
  generateContentFromProduct: (data: {
    productId: string;
    platform: 'FACEBOOK' | 'TIKTOK';
    tone?: string;
    campaignCode?: string;
  }) =>
    api.post<GenerateContentResult>(
      '/marketing/social/content/generate-from-product',
      data,
    ),

  // Posts
  getPosts: (params?: { platform?: string; status?: string; search?: string }) =>
    api.get<SocialPost[]>('/marketing/social/posts', { params }),
  getPostById: (id: string) =>
    api.get<SocialPost>(`/marketing/social/posts/${id}`),
  createPost: (data: Partial<SocialPost>) =>
    api.post<SocialPost>('/marketing/social/posts', data),
  updatePost: (id: string, data: Partial<SocialPost> & { revision?: number }) =>
    api.patch<SocialPost>(`/marketing/social/posts/${id}`, data),
  updatePostStatus: (id: string, status: string, rejectionReason?: string) =>
    api.patch<SocialPost>(`/marketing/social/posts/${id}/status`, {
      status,
      rejectionReason,
    }),
  recordManualPost: (
    id: string,
    data: { externalPermalink: string; externalPostId?: string },
  ) =>
    api.post<SocialPost>(`/marketing/social/posts/${id}/manual-record`, data),
  deletePost: (id: string) =>
    api.delete(`/marketing/social/posts/${id}`),
};
