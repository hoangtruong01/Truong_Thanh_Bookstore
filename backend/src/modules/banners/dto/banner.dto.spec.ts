import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateBannerDto } from './banner.dto';
import { BannerPosition, BannerFrequency } from '../schemas/banner.schema';

describe('Banner DTO Validation', () => {
  it('should pass with valid entry popup data', async () => {
    const raw = {
      title: 'Khuyến mãi đặc biệt',
      imageUrl: 'https://example.com/popup.jpg',
      linkUrl: '/products?category=123',
      position: BannerPosition.ENTRY_POPUP,
      frequency: BannerFrequency.ONCE_PER_DAY,
      ctaLabel: 'Xem ngay',
      closeable: true,
      isActive: true,
      startAt: new Date('2026-09-01'),
      endAt: new Date('2026-10-01'),
    };

    const dto = plainToInstance(CreateBannerDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail with invalid position', async () => {
    const raw = {
      title: 'Test',
      imageUrl: 'https://example.com/image.jpg',
      position: 'INVALID_POSITION',
    };

    const dto = plainToInstance(CreateBannerDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const posError = errors.find((e) => e.property === 'position');
    expect(posError).toBeDefined();
  });

  it('should reject unsafe linkUrl with javascript: scheme', async () => {
    const raw = {
      title: 'Malicious popup',
      imageUrl: 'https://example.com/image.jpg',
      position: BannerPosition.ENTRY_POPUP,
      linkUrl: 'javascript:alert(document.cookie)',
    };

    const dto = plainToInstance(CreateBannerDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const linkError = errors.find((e) => e.property === 'linkUrl');
    expect(linkError).toBeDefined();
  });

  it('should reject unsafe linkUrl with data: scheme', async () => {
    const raw = {
      title: 'Malicious popup',
      imageUrl: 'https://example.com/image.jpg',
      position: BannerPosition.ENTRY_POPUP,
      linkUrl: 'data:text/html,<script>alert(1)</script>',
    };

    const dto = plainToInstance(CreateBannerDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const linkError = errors.find((e) => e.property === 'linkUrl');
    expect(linkError).toBeDefined();
  });

  it('should accept valid external https URL', async () => {
    const raw = {
      title: 'Safe external link',
      imageUrl: 'https://example.com/image.jpg',
      position: BannerPosition.ENTRY_POPUP,
      linkUrl: 'https://truongthanh.vn/deal-hot',
    };

    const dto = plainToInstance(CreateBannerDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should accept valid internal relative URL', async () => {
    const raw = {
      title: 'Safe relative link',
      imageUrl: 'https://example.com/image.jpg',
      position: BannerPosition.ENTRY_POPUP,
      linkUrl: '/deal-hot',
    };

    const dto = plainToInstance(CreateBannerDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});
