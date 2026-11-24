import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { SocialService } from './social.service';
import {
  SocialAccount,
  SocialPlatform,
  SocialAccountStatus,
} from './schemas/social-account.schema';
import { SocialPost, PostStatus } from './schemas/social-post.schema';
import { ProductsService } from '../../products/products.service';

describe('SocialService', () => {
  let service: SocialService;
  let mockAccountModel: any;
  let mockPostModel: any;
  let mockProductsService: any;

  beforeEach(async () => {
    mockAccountModel = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'acc123' }),
      };
    };
    mockAccountModel.findOne = jest.fn();
    mockAccountModel.find = jest.fn();
    mockAccountModel.findById = jest.fn();

    mockPostModel = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'post123' }),
      };
    };
    mockPostModel.find = jest.fn();
    mockPostModel.findById = jest.fn();

    mockProductsService = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SocialService,
        {
          provide: getModelToken(SocialAccount.name),
          useValue: mockAccountModel,
        },
        { provide: getModelToken(SocialPost.name), useValue: mockPostModel },
        { provide: ProductsService, useValue: mockProductsService },
      ],
    }).compile();

    service = module.get<SocialService>(SocialService);
  });

  describe('Social Accounts Management (SOC-01)', () => {
    it('should connect a new social account and encrypt access token safely', async () => {
      mockAccountModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const res = await service.connectAccount({
        platform: SocialPlatform.FACEBOOK,
        accountId: 'fb_page_1001',
        accountName: 'Trường Thành Fanpage',
        accessToken: 'secret_raw_token_xyz',
      });

      expect(res).toBeDefined();
      expect(res.accountName).toBe('Trường Thành Fanpage');
      expect(res.status).toBe(SocialAccountStatus.CONNECTED);
      // Access token must be encrypted
      expect(res.encryptedAccessToken).toBeDefined();
      expect(res.encryptedAccessToken).not.toBe('secret_raw_token_xyz');
    });

    it('should safely disconnect an existing account', async () => {
      const mockAcc = {
        _id: 'acc123',
        status: SocialAccountStatus.CONNECTED,
        encryptedAccessToken: 'encrypted_xyz',
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      mockAccountModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockAcc),
      });

      const res = await service.disconnectAccount('acc123');
      expect(res.status).toBe(SocialAccountStatus.DISCONNECTED);
      expect(res.encryptedAccessToken).toBeUndefined();
    });
  });

  describe('Social Posts Workflow & Rule D03 (SOC-03)', () => {
    it('should create post in DRAFT status with revision 1', async () => {
      const res = await service.createPost(
        {
          title: 'Khuyến mãi Bút Viết 2026',
          platform: SocialPlatform.FACEBOOK,
          content: 'Nội dung bài viết giới thiệu bút viết cao cấp...',
        },
        'user123',
      );

      expect(res.status).toBe(PostStatus.DRAFT);
      expect(res.revision).toBe(1);
    });

    it('should reset APPROVED post back to DRAFT if content is modified (Rule D03)', async () => {
      const mockPost = {
        _id: 'post123',
        status: PostStatus.APPROVED,
        content: 'Nội dung ban đầu đã duyệt',
        revision: 2,
        isArchived: false,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      mockPostModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      const updated = await service.updatePost('post123', {
        content: 'Nội dung ĐÃ BỊ THAY ĐỔI sau khi duyệt',
      });

      // Must reset to DRAFT to protect brand invariants
      expect(updated.status).toBe(PostStatus.DRAFT);
      expect(updated.revision).toBe(3);
    });

    it('should reject invalid status transition', async () => {
      const mockPost = {
        _id: 'post123',
        status: PostStatus.DRAFT,
        save: jest.fn(),
      };
      mockPostModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      await expect(
        service.updatePostStatus('post123', { status: PostStatus.PUBLISHED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should record manual post with external permalink', async () => {
      const mockPost = {
        _id: 'post123',
        status: PostStatus.APPROVED,
        revision: 2,
        save: jest.fn().mockImplementation(function () {
          return Promise.resolve(this);
        }),
      };
      mockPostModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockPost),
      });

      const res = await service.recordManualPost('post123', {
        externalPermalink: 'https://facebook.com/truongthanh/posts/999888',
        externalPostId: 'fb_post_999888',
      });

      expect(res.status).toBe(PostStatus.MANUAL_RECORDED);
      expect(res.externalPermalink).toBe(
        'https://facebook.com/truongthanh/posts/999888',
      );
      expect(res.publishedAt).toBeDefined();
    });
  });

  describe('Content Assistant & TikTok Script Generator (SOC-02, SOC-05)', () => {
    it('should generate Facebook copy with UTM parameters', async () => {
      mockProductsService.findById.mockResolvedValue({
        _id: 'prod123',
        name: 'Sổ Tay Bìa Da Cao Cấp',
        sku: 'SO-DA-2026',
        price: 100000,
        discountPrice: 85000,
        slug: 'so-tay-bia-da-cao-cap',
        images: ['https://example.com/so.jpg'],
      });

      const res = await service.generateContentFromProduct({
        productId: 'prod123',
        platform: SocialPlatform.FACEBOOK,
        campaignCode: 'SUMMER_SALE',
      });

      expect(res.title).toContain('Sổ Tay Bìa Da Cao Cấp');
      expect(res.content).toContain('SO-DA-2026');
      expect(res.content).toContain('85.000 ₫');
      expect(res.targetUrl).toContain('utm_source=facebook');
      expect(res.targetUrl).toContain('utm_campaign=SUMMER_SALE');
    });

    it('should generate TikTok 30s video script with hook, body points, and CTA', async () => {
      mockProductsService.findById.mockResolvedValue({
        _id: 'prod456',
        name: 'Bút Gel Mực Đen 0.5mm',
        sku: 'BUT-GEL-05',
        price: 15000,
        slug: 'but-gel-muc-den-05mm',
        images: ['https://example.com/but.jpg'],
      });

      const res = await service.generateContentFromProduct({
        productId: 'prod456',
        platform: SocialPlatform.TIKTOK,
      });

      expect(res.videoScriptDetails).toBeDefined();
      expect(res.videoScriptDetails?.hook).toContain('Bút Gel Mực Đen 0.5mm');
      expect(res.videoScriptDetails?.bodyPoints.length).toBeGreaterThanOrEqual(
        3,
      );
      expect(res.videoScriptDetails?.cta).toBeDefined();
      expect(res.videoScriptDetails?.estimatedDurationSeconds).toBe(30);
      expect(res.hashtags).toContain('#TikTokMadeMeBuyIt');
    });
  });
});
