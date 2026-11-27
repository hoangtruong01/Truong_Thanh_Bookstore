import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
  Optional,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';

@ApiTags('Marketing Recommendations (OPT-01)')
@Controller('marketing/recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get('product/:id')
  @ApiOperation({
    summary: 'Lấy danh sách gợi ý cho sản phẩm (Thường mua cùng & Tương tự)',
  })
  @ApiQuery({ name: 'limit', required: false, example: 4 })
  async getForProduct(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 4, 1), 12) : 4;
    const [frequentlyBoughtTogether, related] = await Promise.all([
      this.recommendationsService.getFrequentlyBoughtTogether(id, parsedLimit),
      this.recommendationsService.getRelatedProducts(id, parsedLimit),
    ]);

    return {
      frequentlyBoughtTogether,
      related,
    };
  }

  @Get('personalized')
  @ApiOperation({
    summary: 'Gợi ý cá nhân hóa cho khách hàng (Dựa trên lịch sử/danh mục yêu thích)',
  })
  @ApiQuery({ name: 'limit', required: false, example: 8 })
  async getPersonalized(
    @Request() req: any,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Math.min(Math.max(parseInt(limit, 10) || 8, 1), 20) : 8;
    const userId = req.user?.userId || req.user?.sub;
    const items = await this.recommendationsService.getPersonalized(userId, parsedLimit);

    return { items };
  }
}
