import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import {
  LandingPage,
  LandingPageDocument,
} from './schemas/landing-page.schema';
import {
  CreateLandingPageDto,
  GenerateLandingPageDto,
  SubmitOrderDto,
} from './dto/landing-page.dto';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class LandingPageService {
  private readonly logger = new Logger(LandingPageService.name);

  constructor(
    @InjectModel(LandingPage.name)
    private landingPageModel: Model<LandingPageDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private ordersService: OrdersService,
    private configService: ConfigService,
  ) {}

  async findAll(): Promise<LandingPageDocument[]> {
    return this.landingPageModel.find().sort({ createdAt: -1 }).exec();
  }

  async findBySlug(slug: string): Promise<LandingPageDocument> {
    if (!slug) {
      throw new BadRequestException('Slug không được để trống');
    }
    const cleanSlug = slug.toLowerCase().trim();
    const page = await this.landingPageModel
      .findOne({ slug: cleanSlug, status: true })
      .exec();
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }
    return page;
  }

  async findOne(id: string): Promise<LandingPageDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID trang bán hàng không hợp lệ');
    }
    const page = await this.landingPageModel.findById(id).exec();
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }
    return page;
  }

  /**
   * Helper function to convert Vietnamese text to clean slug
   */
  public generateSlug(text: string): string {
    if (!text) return '';
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  /**
   * Sanitizes and cleans incoming DTO payload to prevent Mongoose schema validation failures
   */
  private cleanLandingPageDto(dto: CreateLandingPageDto): CreateLandingPageDto {
    const cleaned = { ...dto };

    // Clean title & slug
    cleaned.title = cleaned.title?.trim() || 'Landing Page Mới';
    if (!cleaned.slug || !cleaned.slug.trim()) {
      cleaned.slug = this.generateSlug(cleaned.title) || `page-${Date.now()}`;
    } else {
      cleaned.slug = cleaned.slug
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    }

    // Clean numeric values
    cleaned.price = Math.max(0, Number(cleaned.price) || 0);
    cleaned.originalPrice = Math.max(0, Number(cleaned.originalPrice) || 0);
    cleaned.countdownMinutes = Math.max(1, Number(cleaned.countdownMinutes) || 30);

    // Clean packages
    if (cleaned.packages && Array.isArray(cleaned.packages)) {
      cleaned.packages = cleaned.packages
        .filter((pkg) => pkg && (pkg.name?.trim() || pkg.price > 0))
        .map((pkg, idx) => ({
          ...pkg,
          name: pkg.name?.trim() || `Gói Combo ${idx + 1}`,
          price: Math.max(0, Number(pkg.price) || 0),
          originalPrice: Math.max(0, Number(pkg.originalPrice) || 0),
          badge: pkg.badge?.trim() || '',
          image: pkg.image || '',
          isBestSeller: Boolean(pkg.isBestSeller),
        }));
    } else {
      cleaned.packages = [];
    }

    // Synchronize root price with packages
    if (cleaned.packages.length > 0) {
      const best = cleaned.packages.find((p) => p.isBestSeller) || cleaned.packages[0];
      cleaned.price = best.price;
      cleaned.originalPrice = best.originalPrice;
    }

    // Clean benefits
    if (cleaned.benefits && Array.isArray(cleaned.benefits)) {
      cleaned.benefits = cleaned.benefits
        .filter((b) => b && b.title?.trim())
        .map((b) => ({
          ...b,
          title: b.title.trim(),
          description: b.description?.trim() || '',
          icon: b.icon?.trim() || 'SparklesIcon',
        }));
    } else {
      cleaned.benefits = [];
    }

    // Clean testimonials
    if (cleaned.testimonials && Array.isArray(cleaned.testimonials)) {
      cleaned.testimonials = cleaned.testimonials
        .filter((t) => t && t.authorName?.trim() && t.content?.trim())
        .map((t) => ({
          ...t,
          authorName: t.authorName.trim(),
          content: t.content.trim(),
          avatar: t.avatar || '',
          rating: Math.min(5, Math.max(1, Number(t.rating) || 5)),
        }));
    } else {
      cleaned.testimonials = [];
    }

    // Clean colors & css
    cleaned.primaryColor = cleaned.primaryColor?.trim() || '#dc2626';
    cleaned.backgroundColor = cleaned.backgroundColor?.trim() || '#ffffff';
    cleaned.textColor = cleaned.textColor?.trim() || '#1e293b';
    cleaned.customCss = cleaned.customCss || '';
    cleaned.status = cleaned.status !== undefined ? Boolean(cleaned.status) : true;

    return cleaned;
  }

  async create(dto: CreateLandingPageDto): Promise<LandingPageDocument> {
    const cleanedDto = this.cleanLandingPageDto(dto);
    const existing = await this.landingPageModel
      .findOne({ slug: cleanedDto.slug })
      .exec();
    if (existing) {
      throw new BadRequestException('Đường dẫn (slug) đã được sử dụng');
    }
    return this.landingPageModel.create(cleanedDto);
  }

  async update(
    id: string,
    dto: CreateLandingPageDto,
  ): Promise<LandingPageDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID trang bán hàng không hợp lệ');
    }
    const cleanedDto = this.cleanLandingPageDto(dto);
    const existing = await this.landingPageModel
      .findOne({ slug: cleanedDto.slug, _id: { $ne: id } })
      .exec();
    if (existing) {
      throw new BadRequestException(
        'Đường dẫn (slug) đã được sử dụng bởi trang khác',
      );
    }
    const page = await this.landingPageModel
      .findByIdAndUpdate(id, cleanedDto, { returnDocument: 'after' })
      .exec();
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }
    return page;
  }

  async remove(id: string): Promise<{ message: string }> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('ID trang bán hàng không hợp lệ');
    }
    const result = await this.landingPageModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }
    return { message: 'Xóa trang bán hàng thành công' };
  }

  async submitOrder(dto: SubmitOrderDto): Promise<OrderDocument> {
    if (!dto.landingPageId || !isValidObjectId(dto.landingPageId)) {
      throw new BadRequestException('ID trang bán hàng không hợp lệ');
    }
    if (!dto.fullName || !dto.phone || !dto.address) {
      throw new BadRequestException('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ');
    }

    const page = await this.landingPageModel.findById(dto.landingPageId).exec();
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }

    // Find selected package details flexibly
    const searchPkgName = (dto.packageName || '').trim().toLowerCase();
    const selectedPkg = page.packages?.find(
      (p) => p.name?.trim().toLowerCase() === searchPkgName,
    );
    const orderPrice = selectedPkg ? selectedPkg.price : (page.price || 0);

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `LP${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${randomSuffix}`;

    // Create a new order integrated directly with main order system
    const newOrder = new this.orderModel({
      orderCode,
      customer: null, // Guest checkout
      customerName: dto.fullName.trim(),
      customerEmail: `${dto.phone.replace(/\s+/g, '')}@truongthanh.vn`, // Standardized phone email
      phone: dto.phone.trim(),
      shippingAddress: dto.address.trim(),
      note: dto.note ? `${dto.packageName} - ${dto.note}` : (dto.packageName || 'Đơn hàng từ Landing Page'),
      items: [
        {
          product: null,
          name: `${page.title} (${dto.packageName || 'Mặc định'})`,
          price: orderPrice,
          quantity: 1,
          image: page.images?.[0] || '',
        },
      ],
      paymentMethod: PaymentMethod.COD,
      paymentStatus: PaymentStatus.UNPAID,
      orderStatus: OrderStatus.PENDING,
      subtotal: orderPrice,
      shippingFee: 0,
      discount: 0,
      total: orderPrice,
    });

    const savedOrder = await newOrder.save();

    // Sync to Google Sheet (async)
    this.ordersService
      .syncToGoogleSheet(savedOrder)
      .catch((err) => this.logger.error(`Error syncing order to Google Sheet: ${err.message}`));

    return savedOrder;
  }

  async generateLandingPage(dto: GenerateLandingPageDto): Promise<any> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not configured. Using fallback template.',
      );
      return this.generateFallbackTemplate(dto);
    }

    this.logger.log(
      `Calling Gemini AI for landing page generation: ${dto.title}`,
    );

    // Gemini API v1beta endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
Bạn là chuyên gia thiết kế và lập trình viên landing page bán hàng chuyên nghiệp, có tỷ lệ chuyển đổi (CR) cực kỳ cao.
Hãy tạo nội dung landing page cho sản phẩm sau:
Tiêu đề: "${dto.title}"
Giá bán khuyến mãi: ${dto.price} VNĐ
Giá gốc: ${dto.originalPrice || dto.price * 1.5} VNĐ
Yêu cầu bổ sung của khách hàng: "${dto.prompt || 'Hãy tối ưu giao diện bán hàng chuyên nghiệp'}"

Hãy trả về một đối tượng JSON chuẩn (không chứa bất kỳ giải thích, markdown \`\`\`json hay text thừa, chỉ trả về JSON duy nhất có thể phân tích cú pháp bằng JSON.parse()) có cấu trúc chính xác sau:
{
  "description": "Mô tả ngắn gọn thu hút về sản phẩm",
  "badgeText": "Tiêu đề nhãn khuyến mãi ưu đãi cực hot",
  "primaryColor": "Mã màu hex chủ đạo (ví dụ: #dc2626)",
  "backgroundColor": "Mã màu nền (ví dụ: #ffffff hoặc #f8fafc)",
  "textColor": "Mã màu chữ (ví dụ: #1e293b)",
  "benefits": [
    { "title": "Lợi ích 1", "description": "Mô tả chi tiết", "icon": "AcademicCapIcon" },
    { "title": "Lợi ích 2", "description": "Mô tả chi tiết", "icon": "ShieldCheckIcon" },
    { "title": "Lợi ích 3", "description": "Mô tả chi tiết", "icon": "TruckIcon" }
  ],
  "packages": [
    { "name": "Gói Tiết Kiệm", "price": ${dto.price}, "originalPrice": ${dto.originalPrice || dto.price * 1.5}, "badge": "Khuyên dùng", "isBestSeller": false },
    { "name": "Gói Combo", "price": ${dto.price * 2 - Math.floor(dto.price * 0.2)}, "originalPrice": ${(dto.originalPrice || dto.price * 1.5) * 3}, "badge": "Ưu đãi lớn nhất", "isBestSeller": true },
    { "name": "Gói Siêu Rẻ", "price": ${dto.price * 3}, "originalPrice": ${(dto.originalPrice || dto.price * 1.5) * 5}, "badge": "Siêu hời", "isBestSeller": false }
  ],
  "testimonials": [
    { "authorName": "Tên", "avatar": "URL ảnh", "content": "Đánh giá", "rating": 5 }
  ],
  "customCss": ""
}
`;

    // Build Gemini API request with multimodal support
    const parts: any[] = [];

    if (dto.images && dto.images.length > 0) {
      for (const base64Img of dto.images.slice(0, 3)) {
        const matches = base64Img.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: { mimeType: matches[1], data: matches[2] },
          });
        } else if (base64Img.length > 100) {
          // Fallback if raw base64 string without data URI prefix is provided
          parts.push({
            inlineData: { mimeType: 'image/jpeg', data: base64Img },
          });
        }
      }
    }

    parts.push({ text: promptText });

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gemini API Error (${response.status}): ${errorText}`);
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('Gemini API returned an empty response');
      }

      // Robust JSON extraction using regex matching for JSON objects
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : generatedText;
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.warn(
        `Gemini API error (${error.message}). Falling back to template...`,
      );
      return this.generateFallbackTemplate(dto);
    }
  }

  /**
   * Fallback template generator when AI API is unavailable
   */
  private generateFallbackTemplate(dto: GenerateLandingPageDto): any {
    let primaryColor = '#dc2626';
    const promptLower = (dto.prompt || '').toLowerCase();
    const titleLower = dto.title.toLowerCase();

    if (promptLower.includes('xanh') || promptLower.includes('blue'))
      primaryColor = '#0284c7';
    else if (promptLower.includes('lá') || promptLower.includes('green'))
      primaryColor = '#16a34a';
    else if (promptLower.includes('vàng') || promptLower.includes('cam'))
      primaryColor = '#ea580c';
    else if (promptLower.includes('tím') || promptLower.includes('purple'))
      primaryColor = '#7c3aed';

    const isEducation =
      titleLower.includes('sách') ||
      titleLower.includes('vở') ||
      titleLower.includes('bút') ||
      titleLower.includes('học') ||
      titleLower.includes('đọc');
    const benefits = isEducation
      ? [
          {
            title: 'Nội Dung Học Tập Sinh Động',
            description:
              'Hình ảnh màu sắc rõ nét giúp bé say mê tiếp thu kiến thức tự nhiên, không gây nhàm chán.',
            icon: 'AcademicCapIcon',
          },
          {
            title: 'Chất Liệu Giấy Chống Lóa Mắt',
            description:
              'Sử dụng chất liệu giấy chuyên dụng cao cấp chống mỏi mắt, bảo vệ tối đa thị lực của bé.',
            icon: 'ShieldCheckIcon',
          },
          {
            title: 'Quà Tặng Ebook Bổ Trợ Tư Duy',
            description:
              'Tặng kèm tài liệu điện tử độc quyền cùng các bài ôn tập nâng cao tư duy logic và ngôn ngữ.',
            icon: 'GiftIcon',
          },
        ]
      : [
          {
            title: 'Chất Liệu Cao Cấp & An Toàn',
            description:
              'Sản xuất từ vật liệu an toàn tuyệt đối cho bé, bền đẹp và thân thiện với môi trường.',
            icon: 'CheckBadgeIcon',
          },
          {
            title: 'Thiết Kế Thông Minh Đa Năng',
            description:
              'Hỗ trợ đắc lực cho trẻ trong quá trình học tập, rèn luyện sự tự lập ngăn nắp.',
            icon: 'LightBulbIcon',
          },
          {
            title: 'Cam Kết Đổi Trả 1 Đổi 1',
            description:
              'Hỗ trợ kiểm tra hàng thoải mái trước khi nhận, đổi trả trong vòng 7 ngày nếu lỗi từ nhà sản xuất.',
            icon: 'ArrowPathIcon',
          },
        ];

    const retailPrice = Number(dto.price) || 150000;
    const originalPrice = dto.originalPrice
      ? Number(dto.originalPrice)
      : Math.round(retailPrice * 1.5);

    return {
      description: `Trải nghiệm bộ sản phẩm ${dto.title} cao cấp mang lại bước đột phá trong hành trình tự lập và sáng tạo mỗi ngày của con.`,
      badgeText: 'MUA NGAY HÔM NAY - ƯU ĐÃI ĐỘC QUYỀN GIẢM GIÁ 50%',
      primaryColor,
      backgroundColor: '#f8fafc',
      textColor: '#1e293b',
      benefits,
      packages: [
        {
          name: 'Mua Lẻ 1 Sản Phẩm',
          price: retailPrice,
          originalPrice,
          badge: 'Gói Tiết Kiệm',
          isBestSeller: false,
        },
        {
          name: 'Combo 2 Sản Phẩm (Tặng Ebook)',
          price: Math.round(retailPrice * 2 * 0.85),
          originalPrice: originalPrice * 2,
          badge: 'Khuyên Dùng',
          isBestSeller: true,
        },
        {
          name: 'Combo 3 Sản Phẩm (Tặng Quà Đặc Biệt)',
          price: Math.round(retailPrice * 3 * 0.75),
          originalPrice: originalPrice * 3,
          badge: 'Ưu Đãi Lớn Nhất',
          isBestSeller: false,
        },
      ],
      testimonials: [
        {
          authorName: 'Chị Nguyễn Thị Mai',
          avatar:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
          content:
            'Mình đã đặt mua combo sản phẩm này cho con. Chất lượng hoàn thiện tốt vượt mong đợi!',
          rating: 5,
        },
        {
          authorName: 'Anh Trần Văn Hùng',
          avatar:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
          content:
            'Shop giao hàng nhanh, được kiểm tra thoải mái. Khuyên mọi người nên mua combo!',
          rating: 5,
        },
      ],
      customCss: '',
      isFallback: true,
      aiWarning:
        'Đang dùng giao diện mẫu do chưa cấu hình GEMINI_API_KEY. Lấy API Key miễn phí tại aistudio.google.com/apikey và thêm vào file .env.',
    };
  }
}
