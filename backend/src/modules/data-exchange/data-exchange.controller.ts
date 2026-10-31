import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StaffPermission } from '../../common/enums';
import { DataExchangeService } from './data-exchange.service';

@Controller('data-exchange')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class DataExchangeController {
  constructor(private readonly dataExchangeService: DataExchangeService) {}

  @Get('templates/:type')
  @Permissions(
    StaffPermission.MANAGE_PRODUCTS,
    StaffPermission.MANAGE_INVENTORY,
  )
  async downloadTemplate(
    @Param('type') type: 'products' | 'suppliers' | 'opening_stock',
    @Res() res: Response,
  ) {
    const buffer = await this.dataExchangeService.generateTemplate(type);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=template-${type}.xlsx`,
    );
    res.send(buffer);
  }

  @Post('preview/:type')
  @Permissions(
    StaffPermission.MANAGE_PRODUCTS,
    StaffPermission.MANAGE_INVENTORY,
  )
  @UseInterceptors(FileInterceptor('file'))
  async preview(
    @Param('type') type: 'products' | 'suppliers' | 'opening_stock',
    @UploadedFile() file: any,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Vui lòng chọn file Excel để tải lên');
    }
    return this.dataExchangeService.previewImport(type, file.buffer);
  }

  @Post('execute/:type')
  @Permissions(
    StaffPermission.MANAGE_PRODUCTS,
    StaffPermission.MANAGE_INVENTORY,
  )
  @UseInterceptors(FileInterceptor('file'))
  async execute(
    @Param('type') type: 'products' | 'suppliers' | 'opening_stock',
    @UploadedFile() file: any,
    @Query('skipErrors') skipErrors: string,
    @Request() req: any,
  ) {
    if (!file || !file.buffer) {
      throw new BadRequestException('Vui lòng chọn file Excel để tải lên');
    }
    const shouldSkip = skipErrors === 'true' || skipErrors === '1';
    return this.dataExchangeService.executeImport(
      type,
      file.buffer,
      req.user.id || req.user._id,
      { skipErrors: shouldSkip },
    );
  }
}
