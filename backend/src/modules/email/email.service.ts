import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const host = this.configService.get<string>('EMAIL_HOST');
    const port = this.configService.get<number>('EMAIL_PORT') || 587;
    const user = this.configService.get<string>('EMAIL_USER');
    const pass = this.configService.get<string>('EMAIL_PASS');

    if (host && user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // true for 465, false for other ports
          auth: {
            user,
            pass,
          },
        });
        this.logger.log('📧 Nodemailer Transporter initialized successfully');
      } catch (err: any) {
        this.logger.error(
          '❌ Failed to initialize Nodemailer transporter:',
          err,
        );
      }
    } else {
      this.logger.warn(
        '⚠️ SMTP credentials not fully configured. EmailService will output to system logs.',
      );
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    const from =
      this.configService.get<string>('EMAIL_FROM') ||
      '"Trường Thành Bookstore" <no-reply@truongthanh.vn>';

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
        });
        this.logger.log(
          `📧 Email sent successfully to ${to} (Subject: ${subject})`,
        );
        return true;
      } catch (err) {
        this.logger.error(`❌ Failed to send email to ${to}:`, err);
      }
    }

    // Fallback in development or when SMTP is not configured
    this.logger.log(`
========================================================================
📧 [EMAIL SIMULATION LOG]
To: ${to}
From: ${from}
Subject: ${subject}
Content:
------------------------------------------------------------------------
${html
  .replace(/<[^>]*>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .slice(0, 500)}...
========================================================================
    `);
    return true;
  }

  async sendOtpEmail(to: string, otp: string): Promise<boolean> {
    const subject = 'Mã xác minh OTP - Đặt lại mật khẩu';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
        <h2 style="color: #dc2626; text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 10px;">XÁC THỰC MẬT KHẨU</h2>
        <p>Xin chào,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản tại <strong>Trường Thành Bookstore</strong>.</p>
        <p>Vui lòng sử dụng mã OTP dưới đây để hoàn tất quy trình (Mã này có hiệu lực trong <strong>10 phút</strong>):</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #dc2626; padding: 10px 20px; background-color: #fef2f2; border: 1px dashed #fca5a5; border-radius: 8px; display: inline-block;">${otp}</span>
        </div>
        <p style="color: #64748b; font-size: 12px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 30px;">
          Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ bộ phận hỗ trợ của chúng tôi.<br>
          © 2026 Trường Thành Bookstore. All rights reserved.
        </p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  async sendOrderConfirmationEmail(to: string, order: any): Promise<boolean> {
    const subject = `Xác nhận đơn hàng #${order.orderCode} - Trường Thành Bookstore`;

    const itemsHtml = order.items
      .map(
        (item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${item.price.toLocaleString('vi-VN')}đ</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">${(item.price * item.quantity).toLocaleString('vi-VN')}đ</td>
      </tr>
    `,
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; background-color: #ffffff;">
        <h2 style="color: #dc2626; text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px;">ĐẶT HÀNG THÀNH CÔNG</h2>
        <p>Cảm ơn bạn đã mua sắm tại <strong>Trường Thành Bookstore</strong>!</p>
        <p>Đơn hàng của bạn đã được tiếp nhận và đang chờ xử lý. Dưới đây là thông tin chi tiết đơn hàng:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 5px 0; font-weight: bold; width: 120px;">Mã đơn hàng:</td>
            <td style="padding: 5px 0; font-family: monospace; color: #dc2626; font-weight: bold;">#${order.orderCode}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Người nhận:</td>
            <td style="padding: 5px 0;">${order.customerName}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Số điện thoại:</td>
            <td style="padding: 5px 0;">${order.phone}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-weight: bold;">Địa chỉ nhận:</td>
            <td style="padding: 5px 0;">${order.shippingAddress}</td>
          </tr>
        </table>

        <h3 style="color: #1e293b; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 30px;">Danh sách sản phẩm</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e1; font-size: 13px;">Tên sản phẩm</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e1; font-size: 13px; width: 50px;">SL</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e1; font-size: 13px; width: 80px;">Đơn giá</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e1; font-size: 13px; width: 100px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <table style="width: 100%; margin-top: 20px; font-size: 14px;">
          <tr>
            <td style="text-align: right; padding: 5px 0;">Cộng tiền hàng:</td>
            <td style="text-align: right; padding: 5px 0; font-weight: bold; width: 120px;">${order.subtotal.toLocaleString('vi-VN')}đ</td>
          </tr>
          <tr>
            <td style="text-align: right; padding: 5px 0;">Phí vận chuyển:</td>
            <td style="text-align: right; padding: 5px 0; font-weight: bold;">${order.shippingFee === 0 ? 'Miễn phí' : order.shippingFee.toLocaleString('vi-VN') + 'đ'}</td>
          </tr>
          ${
            order.discount > 0
              ? `
          <tr>
            <td style="text-align: right; padding: 5px 0; color: #dc2626;">Giảm giá:</td>
            <td style="text-align: right; padding: 5px 0; font-weight: bold; color: #dc2626;">-${order.discount.toLocaleString('vi-VN')}đ</td>
          </tr>
          `
              : ''
          }
          <tr style="font-size: 16px; font-weight: bold; border-top: 2px solid #cbd5e1;">
            <td style="text-align: right; padding: 10px 0; color: #dc2626;">TỔNG CỘNG:</td>
            <td style="text-align: right; padding: 10px 0; color: #dc2626; font-size: 18px;">${order.total.toLocaleString('vi-VN')}đ</td>
          </tr>
        </table>

        <p style="margin-top: 30px; text-align: center; color: #64748b; font-size: 13px;">
          Cảm ơn quý khách đã tin tưởng Trường Thành Bookstore!<br>
          Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline: <strong>0982938316</strong>.
        </p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }

  async sendOrderStatusEmail(
    to: string,
    order: any,
    statusText: string,
  ): Promise<boolean> {
    const subject = `Cập nhật trạng thái đơn hàng #${order.orderCode} - Trường Thành Bookstore`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; background-color: #ffffff;">
        <h2 style="color: #dc2626; text-align: center; border-bottom: 2px solid #dc2626; padding-bottom: 10px; margin-bottom: 20px;">CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG</h2>
        <p>Xin chào <strong>${order.customerName}</strong>,</p>
        <p>Đơn hàng của bạn tại <strong>Trường Thành Bookstore</strong> đã thay đổi trạng thái:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; font-size: 16px; font-weight: bold; color: #1e293b;">
          Đơn hàng #${order.orderCode} ${statusText}.
        </div>

        <p>Bạn có thể tra cứu hành trình chi tiết của đơn hàng trực tiếp bằng cách đăng nhập vào tài khoản trên website Trường Thành Bookstore.</p>
        
        <p style="margin-top: 30px; text-align: center; color: #64748b; font-size: 13px;">
          Hotline hỗ trợ: <strong>0982938316</strong><br>
          © 2026 Trường Thành Bookstore. All rights reserved.
        </p>
      </div>
    `;
    return this.sendMail(to, subject, html);
  }
}
