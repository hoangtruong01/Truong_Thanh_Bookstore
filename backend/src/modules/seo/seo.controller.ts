import { Controller, Get, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { SeoService } from './seo.service';

/**
 * SEO-TASK-011: endpoint công khai, chỉ đọc (giống GET /products) — không cần guard vì
 * sitemap chỉ chứa URL trang công khai, không có dữ liệu riêng tư.
 * Dùng @Res() để trả XML thô, không đi qua envelope JSON của TransformInterceptor.
 */
@ApiTags('SEO')
@Controller('seo')
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('sitemap.xml')
  @ApiOperation({
    summary: 'Dynamic XML sitemap of public, indexable storefront URLs',
  })
  async sitemap(@Res() res: Response) {
    const xml = await this.seoService.buildSitemap();
    res
      .status(200)
      .type('application/xml; charset=utf-8')
      .set('Cache-Control', 'public, max-age=3600, s-maxage=3600')
      .send(xml);
  }
}
