import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PromotionsService } from './promotions.service';
import { CreatePromotionDto, ApplyPromotionDto } from './dto/promotion.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt.guard';
import { StaffPermission } from '../../common/enums';

@ApiTags('promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private promotionsService: PromotionsService) {}

  @Post('apply')
  @UseGuards(OptionalJwtAuthGuard)
  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @ApiOperation({ summary: 'Apply a promotion code' })
  apply(@Body() dto: ApplyPromotionDto, @Request() req: any) {
    const userId = req.user ? req.user._id : undefined;
    return this.promotionsService.apply(dto, userId);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active promotions' })
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PROMOTIONS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all promotions' })
  findAll() {
    return this.promotionsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PROMOTIONS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get promotion by ID' })
  findById(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PROMOTIONS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a promotion' })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PROMOTIONS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a promotion' })
  update(@Param('id') id: string, @Body() dto: Partial<CreatePromotionDto>) {
    return this.promotionsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Permissions(StaffPermission.MANAGE_PROMOTIONS)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a promotion' })
  delete(@Param('id') id: string) {
    return this.promotionsService.delete(id);
  }
}
