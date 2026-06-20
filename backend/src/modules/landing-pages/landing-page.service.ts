import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LandingPage, LandingPageDocument } from './schemas/landing-page.schema';
import { CreateLandingPageDto, GenerateLandingPageDto, SubmitOrderDto } from './dto/landing-page.dto';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { OrderStatus, PaymentMethod, PaymentStatus } from '../../common/enums';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class LandingPageService {
  private readonly logger = new Logger(LandingPageService.name);

  constructor(
    @InjectModel(LandingPage.name) private landingPageModel: Model<LandingPageDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private ordersService: OrdersService,
    private configService: ConfigService,
  ) {}

  async findAll(): Promise<LandingPageDocument[]> {
    return this.landingPageModel.find().sort({ createdAt: -1 }).exec();
  }

  async findBySlug(slug: string): Promise<LandingPageDocument> {
    const page = await this.landingPageModel.findOne({ slug, status: true }).exec();
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }
    return page;
  }

  async findOne(id: string): Promise<LandingPageDocument> {
    const page = await this.landingPageModel.findById(id).exec();
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }
    return page;
  }

  async create(dto: CreateLandingPageDto): Promise<LandingPageDocument> {
    const existing = await this.landingPageModel.findOne({ slug: dto.slug }).exec();
    if (existing) {
      throw new BadRequestException('Đường dẫn (slug) đã được sử dụng');
    }
    return this.landingPageModel.create(dto);
  }

  async update(id: string, dto: CreateLandingPageDto): Promise<LandingPageDocument> {
    const existing = await this.landingPageModel.findOne({ slug: dto.slug, _id: { $ne: id } }).exec();
    if (existing) {
      throw new BadRequestException('Đường dẫn (slug) đã được sử dụng bởi trang khác');
    }
    const page = await this.landingPageModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }
    return page;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.landingPageModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }
    return { message: 'Xóa trang bán hàng thành công' };
  }

  async submitOrder(dto: SubmitOrderDto): Promise<OrderDocument> {
    const page = await this.landingPageModel.findById(dto.landingPageId).exec();
    if (!page) {
      throw new NotFoundException('Không tìm thấy trang bán hàng');
    }

    // Find selected package details
    const selectedPkg = page.packages.find(p => p.name === dto.packageName);
    const orderPrice = selectedPkg ? selectedPkg.price : page.price;

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `LP${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${randomSuffix}`;

    // Create a new order integrated directly with main order system
    const newOrder = new this.orderModel({
      orderCode,
      customer: null, // Guest checkout
      customerName: dto.fullName,
      customerEmail: `${dto.phone}@truongthanh.vn`, // Dummy email
      phone: dto.phone,
      shippingAddress: dto.address,
      note: dto.note ? `${dto.packageName} - ${dto.note}` : dto.packageName,
      items: [
        {
          product: null,
          name: `${page.title} (${dto.packageName})`,
          price: orderPrice,
          quantity: 1,
          image: page.images?.[0] || '',
        }
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
    this.ordersService.syncToGoogleSheet(savedOrder).catch(err => this.logger.error(err));

    return savedOrder;
  }

  async generateLandingPage(dto: GenerateLandingPageDto): Promise<any> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new BadRequestException('Chưa cấu hình API Key cho Gemini (GEMINI_API_KEY)');
    }

    this.logger.log(`Calling Gemini API for landing page generation: ${dto.title}`);

    // Call Gemini API 1.5 Flash using raw HTTP fetch to avoid sdk dependencies
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
  "primaryColor": "Mã màu hex chủ đạo (ví dụ: #dc2626) phù hợp cho nút kêu gọi hành động",
  "backgroundColor": "Mã màu nền chủ đạo sáng sủa (ví dụ: #ffffff hoặc #f8fafc)",
  "textColor": "Mã màu chữ chủ đạo (ví dụ: #1e293b)",
  "benefits": [
    { "title": "Lợi ích/Đặc trưng 1 cực kỳ thu hút", "description": "Mô tả chi tiết hấp dẫn của đặc trưng 1", "icon": "Tên icon Heroicons dạng chuỗi (ví dụ: AcademicCapIcon, ShieldCheckIcon, TruckIcon)" },
    { "title": "Lợi ích/Đặc trưng 2 cực kỳ thu hút", "description": "Mô tả chi tiết hấp dẫn của đặc trưng 2", "icon": "Tên icon Heroicons dạng chuỗi" },
    { "title": "Lợi ích/Đặc trưng 3 cực kỳ thu hút", "description": "Mô tả chi tiết hấp dẫn của đặc trưng 3", "icon": "Tên icon Heroicons dạng chuỗi" }
  ],
  "packages": [
    { "name": "Gói Tiết Kiệm (Mua 1 sản phẩm)", "price": ${dto.price}, "originalPrice": ${dto.originalPrice || dto.price * 1.5}, "badge": "Khuyên dùng", "isBestSeller": false },
    { "name": "Gói Combo Mua 2 Tặng 1 (Bộ 3 cuốn)", "price": ${dto.price * 2 - Math.floor(dto.price * 0.2)}, "originalPrice": ${(dto.originalPrice || dto.price * 1.5) * 3}, "badge": "Ưu đãi lớn nhất", "isBestSeller": true },
    { "name": "Gói Siêu Rẻ (Mua 3 Tặng 2)", "price": ${dto.price * 3}, "originalPrice": ${(dto.originalPrice || dto.price * 1.5) * 5}, "badge": "Siêu hời", "isBestSeller": false }
  ],
  "testimonials": [
    { "authorName": "Nguyễn Thị Mai", "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", "content": "Sản phẩm chất lượng vượt trội so với mong đợi. Giao hàng cực kỳ nhanh chóng và đóng gói cẩn thận. Bé nhà mình rất thích!", "rating": 5 },
    { "authorName": "Trần Văn Hùng", "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", "content": "Giá cả hợp lý mà chất lượng chính hãng 100%. Tôi đã giới thiệu cho nhiều bạn bè đồng nghiệp mua cùng.", "rating": 5 }
  ],
  "customCss": "Ví dụ: .hero-title { font-family: 'Outfit', sans-serif; } (Nếu không cần có thể để trống hoặc thêm CSS hiệu ứng hover)"
}
`;

    // Process base64 images if present
    const contents: any[] = [];
    const parts: any[] = [];

    // Append images to prompt contents for multimodal support
    if (dto.images && dto.images.length > 0) {
      for (const base64Img of dto.images) {
        const matches = base64Img.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2]
            }
          });
        }
      }
    }

    parts.push({ text: promptText });
    contents.push({ parts });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Gemini API Error details: ${errorText}`);
        throw new Error(`Gemini API responded with status ${response.status}`);
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedText) {
        throw new Error('Gemini API returned an empty response');
      }

      // Parse JSON from text
      const cleanJson = generatedText.trim().replace(/^```json/, '').replace(/```$/, '').trim();
      return JSON.parse(cleanJson);
    } catch (error) {
      this.logger.warn(`Gemini API error (${error.message}). Falling back to local premium design generator...`);
      
      // Determine colors based on title/prompt
      let primaryColor = '#dc2626'; // Default red
      const promptLower = (dto.prompt || '').toLowerCase();
      const titleLower = dto.title.toLowerCase();
      
      if (promptLower.includes('xanh') || promptLower.includes('blue') || promptLower.includes('sky')) {
        primaryColor = '#0284c7';
      } else if (promptLower.includes('lá') || promptLower.includes('green') || promptLower.includes('xanh lá')) {
        primaryColor = '#16a34a';
      } else if (promptLower.includes('vàng') || promptLower.includes('orange') || promptLower.includes('cam')) {
        primaryColor = '#ea580c';
      } else if (promptLower.includes('tím') || promptLower.includes('purple')) {
        primaryColor = '#7c3aed';
      }

      // Build customized benefits based on product category
      const isEducation = titleLower.includes('sách') || titleLower.includes('vở') || titleLower.includes('bút') || titleLower.includes('học') || titleLower.includes('đọc');
      const benefits = isEducation ? [
        {
          title: 'Nội Dung Học Tập Sinh Động',
          description: 'Hình ảnh màu sắc rõ nét giúp bé say mê tiếp thu kiến thức tự nhiên, không gây nhàm chán.',
          icon: 'AcademicCapIcon'
        },
        {
          title: 'Chất Liệu Giấy Chống Lóa Mắt',
          description: 'Sử dụng chất liệu giấy chuyên dụng cao cấp chống mỏi mắt, bảo vệ tối đa thị lực của bé.',
          icon: 'ShieldCheckIcon'
        },
        {
          title: 'Quà Tặng Ebook Bổ Trợ Tư Duy',
          description: 'Tặng kèm tài liệu điện tử độc quyền cùng các bài ôn tập nâng cao tư duy logic và ngôn ngữ.',
          icon: 'GiftIcon'
        }
      ] : [
        {
          title: 'Chất Liệu Cao Cấp & An Toàn',
          description: 'Sản xuất từ vật liệu an toàn tuyệt đối cho bé, bền đẹp và thân thiện với môi trường.',
          icon: 'CheckBadgeIcon'
        },
        {
          title: 'Thiết Kế Thông Minh Đa Năng',
          description: 'Hỗ trợ đắc lực cho trẻ trong quá trình học tập, rèn luyện sự tự lập ngăn nắp.',
          icon: 'LightBulbIcon'
        },
        {
          title: 'Cam Kết Đổi Trả 1 Đổi 1',
          description: 'Hỗ trợ kiểm tra hàng thoải mái trước khi nhận, đổi trả trong vòng 7 ngày nếu lỗi từ nhà sản xuất.',
          icon: 'ArrowPathIcon'
        }
      ];

      // Formulate pricing
      const retailPrice = Number(dto.price);
      const originalPrice = dto.originalPrice ? Number(dto.originalPrice) : Math.round(retailPrice * 1.5);
      
      const packages = [
        {
          name: `Mua Lẻ 1 Sản Phẩm`,
          price: retailPrice,
          originalPrice: originalPrice,
          badge: 'Gói Tiết Kiệm',
          isBestSeller: false
        },
        {
          name: `Combo 2 Sản Phẩm (Tặng Ebook)`,
          price: Math.round(retailPrice * 2 * 0.85), // 15% discount
          originalPrice: originalPrice * 2,
          badge: 'Khuyên Dùng',
          isBestSeller: true
        },
        {
          name: `Combo 3 Sản Phẩm (Tặng Quà Đặc Biệt)`,
          price: Math.round(retailPrice * 3 * 0.75), // 25% discount
          originalPrice: originalPrice * 3,
          badge: 'Ưu Đãi Lớn Nhất',
          isBestSeller: false
        }
      ];

      return {
        description: `Trải nghiệm bộ sản phẩm ${dto.title} cao cấp mang lại bước đột phá trong hành trình tự lập và sáng tạo mỗi ngày của con. Thiết kế độc đáo, đẹp mắt và tối ưu hiệu năng sử dụng.`,
        badgeText: 'MUA NGAY HÔM NAY - ƯU ĐÃI ĐỘC QUYỀN GIẢM GIÁ 50%',
        primaryColor,
        backgroundColor: '#f8fafc',
        textColor: '#1e293b',
        benefits,
        packages,
        testimonials: [
          {
            authorName: 'Chị Nguyễn Thị Mai',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
            content: `Mình đã đặt mua combo sản phẩm này cho con. Giấy in rất đẹp, chất lượng hoàn thiện tốt vượt mong đợi. Con hào hứng học tập hẳn lên!`,
            rating: 5
          },
          {
            authorName: 'Anh Trần Văn Hùng',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
            content: `Shop giao hàng nhanh cực kỳ, được kiểm tra thoải mái mới thanh toán. Đóng gói rất cẩn thận và chắc chắn. Khuyên mọi người nên mua combo để có ưu đãi tốt.`,
            rating: 5
          }
        ],
        customCss: '',
        isFallback: true,
        aiWarning: 'Đang dùng cấu hình giao diện mẫu tối ưu do API Key của bạn chưa được kích hoạt dịch vụ Google Generative Language. Vui lòng vào Google Cloud Console kích hoạt để AI phân tích ảnh.'
      };
    }
  }
}
