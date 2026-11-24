import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import {
  SocialAccount,
  SocialAccountDocument,
  SocialAccountStatus,
  SocialPlatform,
} from './schemas/social-account.schema';
import {
  SocialPost,
  SocialPostDocument,
  PostStatus,
} from './schemas/social-post.schema';
import {
  ConnectSocialAccountDto,
  CreateSocialPostDto,
  UpdateSocialPostDto,
  UpdatePostStatusDto,
  RecordManualPostDto,
  GenerateContentFromProductDto,
} from './dto/social.dto';
import { ProductsService } from '../../products/products.service';

@Injectable()
export class SocialService {
  constructor(
    @InjectModel(SocialAccount.name)
    private accountModel: Model<SocialAccountDocument>,
    @InjectModel(SocialPost.name)
    private postModel: Model<SocialPostDocument>,
    private productsService: ProductsService,
  ) {}

  private encryptToken(token?: string): string | undefined {
    if (!token) return undefined;
    const key = crypto
      .createHash('sha256')
      .update(
        process.env.ENCRYPTION_SECRET || 'truongthanh_bookstore_secret_2026',
      )
      .digest();
    const iv = crypto
      .createHash('md5')
      .update('truongthanh_social_iv_seed')
      .digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  // --- ACCOUNTS MANAGEMENT (SOC-01) ---
  async connectAccount(dto: ConnectSocialAccountDto): Promise<SocialAccount> {
    let account = await this.accountModel
      .findOne({ platform: dto.platform, accountId: dto.accountId })
      .exec();

    if (account) {
      account.accountName = dto.accountName;
      account.accountType = dto.accountType || account.accountType;
      account.capabilities = dto.capabilities || account.capabilities;
      account.status = SocialAccountStatus.CONNECTED;
      account.lastSyncedAt = new Date();
      if (dto.accessToken) {
        account.encryptedAccessToken = this.encryptToken(dto.accessToken);
      }
      return account.save();
    }

    account = new this.accountModel({
      platform: dto.platform,
      accountId: dto.accountId,
      accountName: dto.accountName,
      accountType: dto.accountType,
      capabilities: dto.capabilities || ['read_insights', 'publish_posts'],
      status: SocialAccountStatus.CONNECTED,
      encryptedAccessToken: this.encryptToken(dto.accessToken),
      lastSyncedAt: new Date(),
      isArchived: false,
    });

    return account.save();
  }

  async getAccounts(): Promise<SocialAccount[]> {
    return this.accountModel
      .find({ isArchived: false })
      .sort({ createdAt: -1 })
      .exec();
  }

  async disconnectAccount(id: string): Promise<SocialAccount> {
    const account = await this.accountModel.findById(id).exec();
    if (!account) {
      throw new NotFoundException('Không tìm thấy tài khoản mạng xã hội');
    }
    account.status = SocialAccountStatus.DISCONNECTED;
    account.encryptedAccessToken = undefined;
    return account.save();
  }

  // --- POSTS MANAGEMENT & WORKFLOW (SOC-02, SOC-03) ---
  private readonly allowedTransitions: Record<PostStatus, PostStatus[]> = {
    [PostStatus.DRAFT]: [PostStatus.PENDING_APPROVAL, PostStatus.ARCHIVED],
    [PostStatus.PENDING_APPROVAL]: [
      PostStatus.APPROVED,
      PostStatus.REJECTED,
      PostStatus.DRAFT,
      PostStatus.ARCHIVED,
    ],
    [PostStatus.APPROVED]: [
      PostStatus.SCHEDULED,
      PostStatus.PUBLISHED,
      PostStatus.MANUAL_RECORDED,
      PostStatus.DRAFT,
      PostStatus.ARCHIVED,
    ],
    [PostStatus.REJECTED]: [PostStatus.DRAFT, PostStatus.ARCHIVED],
    [PostStatus.SCHEDULED]: [
      PostStatus.PUBLISHED,
      PostStatus.MANUAL_RECORDED,
      PostStatus.FAILED,
      PostStatus.DRAFT,
      PostStatus.ARCHIVED,
    ],
    [PostStatus.PUBLISHED]: [PostStatus.ARCHIVED],
    [PostStatus.MANUAL_RECORDED]: [PostStatus.ARCHIVED],
    [PostStatus.FAILED]: [
      PostStatus.DRAFT,
      PostStatus.SCHEDULED,
      PostStatus.ARCHIVED,
    ],
    [PostStatus.ARCHIVED]: [],
  };

  async createPost(
    dto: CreateSocialPostDto,
    userId?: string,
  ): Promise<SocialPost> {
    const post = new this.postModel({
      ...dto,
      status: PostStatus.DRAFT,
      revision: 1,
      productId:
        dto.productId && Types.ObjectId.isValid(dto.productId)
          ? new Types.ObjectId(dto.productId)
          : undefined,
      campaignId:
        dto.campaignId && Types.ObjectId.isValid(dto.campaignId)
          ? new Types.ObjectId(dto.campaignId)
          : undefined,
      createdBy:
        userId && Types.ObjectId.isValid(userId)
          ? new Types.ObjectId(userId)
          : undefined,
      isArchived: false,
    });

    return post.save();
  }

  async findAllPosts(query?: {
    platform?: string;
    status?: string;
    search?: string;
  }): Promise<SocialPost[]> {
    const filter: any = { isArchived: false };
    if (query?.platform) filter.platform = query.platform;
    if (query?.status) filter.status = query.status;
    if (query?.search) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: regex }, { content: regex }];
    }
    return this.postModel
      .find(filter)
      .populate('productId', 'name sku price discountPrice images')
      .populate('campaignId', 'code name')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findPostById(id: string): Promise<SocialPostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate('productId')
      .populate('campaignId')
      .exec();
    if (!post || post.isArchived) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }
    return post;
  }

  async updatePost(
    id: string,
    dto: UpdateSocialPostDto,
    _userId?: string,
  ): Promise<SocialPost> {
    const post = await this.findPostById(id);

    if (dto.revision !== undefined && dto.revision !== post.revision) {
      throw new ConflictException(
        'Bài viết đã được chỉnh sửa ở phiên khác, vui lòng tải lại',
      );
    }

    // Rule D03: If content is edited on an APPROVED post, reset back to DRAFT for re-approval
    if (
      post.status === PostStatus.APPROVED &&
      dto.content &&
      dto.content !== post.content
    ) {
      post.status = PostStatus.DRAFT;
    }

    Object.assign(post, dto);
    post.revision = (post.revision || 1) + 1;
    return post.save();
  }

  async updatePostStatus(
    id: string,
    dto: UpdatePostStatusDto,
    userId?: string,
  ): Promise<SocialPost> {
    const post = await this.findPostById(id);
    const allowed = this.allowedTransitions[post.status] || [];

    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái bài viết từ ${post.status} sang ${dto.status}`,
      );
    }

    post.status = dto.status;
    post.revision = (post.revision || 1) + 1;

    if (
      dto.status === PostStatus.APPROVED &&
      userId &&
      Types.ObjectId.isValid(userId)
    ) {
      post.approvedBy = new Types.ObjectId(userId);
    }
    if (dto.status === PostStatus.REJECTED) {
      post.rejectionReason = dto.rejectionReason;
    }
    if (dto.status === PostStatus.ARCHIVED) {
      post.isArchived = true;
    }

    return post.save();
  }

  async recordManualPost(
    id: string,
    dto: RecordManualPostDto,
  ): Promise<SocialPost> {
    const post = await this.findPostById(id);

    post.status = PostStatus.MANUAL_RECORDED;
    post.externalPermalink = dto.externalPermalink;
    post.externalPostId = dto.externalPostId || `manual_${Date.now()}`;
    post.publishedAt = new Date();
    post.revision = (post.revision || 1) + 1;

    return post.save();
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.findPostById(id);
    post.isArchived = true;
    post.status = PostStatus.ARCHIVED;
    await post.save();
  }

  // --- CONTENT ASSISTANT / GENERATOR (SOC-02, SOC-05) ---
  async generateContentFromProduct(
    dto: GenerateContentFromProductDto,
  ): Promise<{
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
  }> {
    const product = await this.productsService.findById(dto.productId);
    if (!product) {
      throw new NotFoundException('Không tìm thấy sản phẩm');
    }

    const campaignParam = dto.campaignCode
      ? `&utm_campaign=${dto.campaignCode}`
      : '';
    const productIdStr = String(product._id);
    const targetUrl = `https://truongthanh.vn/products/${product.slug || productIdStr}?utm_source=${dto.platform.toLowerCase()}&utm_medium=social_post${campaignParam}`;

    const activePrice =
      product.discountPrice && product.discountPrice > 0
        ? product.discountPrice
        : product.price;
    const priceVnd = (activePrice || 0).toLocaleString('vi-VN') + ' ₫';
    const originalPriceVnd =
      product.discountPrice && product.discountPrice > 0
        ? (product.price || 0).toLocaleString('vi-VN') + ' ₫'
        : '';
    const discountInfo = originalPriceVnd
      ? ` (Giá gốc: ${originalPriceVnd})`
      : '';

    const hashtags = [
      '#NhaSachTruongThanh',
      '#VanPhongPhamChinhHang',
      '#DungCuHocTap',
      '#KhuyenMai2026',
    ];

    if (dto.platform === SocialPlatform.TIKTOK) {
      // SOC-05: TikTok Short Video Script Generation
      const hook = `🔥 Đừng mua ${product.name} nếu bạn chưa biết 3 điều này!`;
      const bodyPoints = [
        `1. Thiết kế thông minh, chất lượng chính hãng từ Trường Thành Stationery.`,
        `2. Giá siêu mềm chỉ ${priceVnd}${discountInfo}, bền bỉ đồng hành suốt năm học.`,
        `3. Giao hàng hỏa tốc toàn quốc, kiểm tra hàng trước khi thanh toán!`,
      ];
      const cta = `👉 Nhấp vào liên kết bio hoặc ghé website truongthanh.vn săn ngay hôm nay nhé!`;

      const scriptContent =
        `🎬 [KỊCH BẢN VIDEO TIKTOK - 30 GIÂY]\n\n` +
        `🎯 [00:00 - 00:05] HOOK: ${hook}\n\n` +
        `📦 [00:05 - 00:20] NỘI DUNG CHÍNH:\n${bodyPoints.join('\n')}\n\n` +
        `🚀 [00:20 - 00:30] CALL TO ACTION: ${cta}`;

      return {
        title: `[TikTok Script] ${product.name}`,
        content: scriptContent,
        hashtags: [...hashtags, '#TikTokMadeMeBuyIt', '#HocSinhSinhVien'],
        targetUrl,
        mediaUrls: product.images || [],
        videoScriptDetails: {
          hook,
          bodyPoints,
          cta,
          estimatedDurationSeconds: 30,
        },
      };
    }

    // Default Facebook Post Template (SOC-02)
    const fbContent =
      `✨ KHÁM PHÁ NGAY: ${product.name.toUpperCase()} ✨\n\n` +
      `Bạn đang tìm kiếm dụng cụ học tập và văn phòng phẩm chất lượng cao? Đừng bỏ lỡ siêu phẩm này tại Nhà sách Trường Thành!\n\n` +
      `💡 ĐIỂM NỔI BẬT:\n` +
      `• Mã sản phẩm: ${product.sku || 'Đang cập nhật'}\n` +
      `• Giá ưu đãi: ${priceVnd}${discountInfo}\n` +
      `• Cam kết chính hãng 100%, đổi trả miễn phí trong 7 ngày nếu lỗi nhà sản xuất.\n\n` +
      `🛒 ĐẶT HÀNG NHANH TẠI ĐÂY:\n${targetUrl}\n\n` +
      `📍 Ghé thăm cửa hàng hoặc đặt online giao tận tay trên toàn quốc!\n\n` +
      hashtags.join(' ');

    return {
      title: `[Facebook] ${product.name}`,
      content: fbContent,
      hashtags,
      targetUrl,
      mediaUrls: product.images || [],
    };
  }
}
