import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ForbiddenException,
  Res,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StaffPermission, UserRole } from '../../common/enums';
import { DataExchangeService } from './data-exchange.service';
import { ImportOptionsDto, RowError } from './dto/data-exchange.dto';

const VALID_ENTITY_TYPES = ['products', 'suppliers', 'opening_stock'] as const;

const UPLOAD_LIMITS = {
  fileSize: 10 * 1024 * 1024, // 10MB (SEC-01)
};

const fileFilter = (
  _req: any,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) => {
  const isXlsx =
    file.originalname.toLowerCase().endsWith('.xlsx') ||
    file.mimetype ===
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  if (!isXlsx) {
    return callback(
      new BadRequestException(
        'Chỉ chấp nhận file định dạng Excel (.xlsx). Vui lòng kiểm tra lại.',
      ),
      false,
    );
  }
  callback(null, true);
};

@Controller('data-exchange')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class DataExchangeController {
  constructor(private readonly dataExchangeService: DataExchangeService) {}

  /**
   * XLS-T14 & SEC-02: Kiểm tra quyền cụ thể theo từng loại entity
   */
  private checkEntityPermission(
    user: any,
    type: 'products' | 'suppliers' | 'opening_stock',
  ): void {
    // SEC-014: validate :type theo whitelist trước khi dùng (kể cả cho ADMIN),
    // tránh giá trị tùy ý đi vào service / header Content-Disposition.
    if (!(VALID_ENTITY_TYPES as readonly string[]).includes(type)) {
      throw new BadRequestException(
        `Loại dữ liệu không hợp lệ. Chỉ hỗ trợ: ${VALID_ENTITY_TYPES.join(', ')}`,
      );
    }

    if (
      user.role === UserRole.SUPER_ADMIN ||
      user.role === 'SUPER_ADMIN' ||
      user.role === UserRole.ADMIN ||
      user.role === 'ADMIN'
    ) {
      return;
    }

    const perms: string[] = user.permissions || [];

    if (type === 'products') {
      if (!perms.includes(StaffPermission.MANAGE_PRODUCTS)) {
        throw new ForbiddenException(
          'Bạn không có quyền thao tác dữ liệu Sản phẩm (cần MANAGE_PRODUCTS)',
        );
      }
    } else if (type === 'suppliers') {
      if (
        !perms.includes(StaffPermission.MANAGE_INVENTORY) &&
        !perms.includes(StaffPermission.MANAGE_PRODUCTS)
      ) {
        throw new ForbiddenException(
          'Bạn không có quyền thao tác dữ liệu Nhà cung cấp (cần MANAGE_INVENTORY)',
        );
      }
    } else if (type === 'opening_stock') {
      if (!perms.includes(StaffPermission.MANAGE_INVENTORY)) {
        throw new ForbiddenException(
          'Bạn không có quyền thao tác dữ liệu Tồn kho đầu kỳ (cần MANAGE_INVENTORY)',
        );
      }
    }
  }

  @Get('templates/:type')
  @Permissions(
    StaffPermission.MANAGE_PRODUCTS,
    StaffPermission.MANAGE_INVENTORY,
  )
  async downloadTemplate(
    @Param('type') type: 'products' | 'suppliers' | 'opening_stock',
    @Request() req: any,
    @Res() res: Response,
  ) {
    this.checkEntityPermission(req.user, type);
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
  @UseInterceptors(
    FileInterceptor('file', {
      limits: UPLOAD_LIMITS,
      fileFilter,
    }),
  )
  async preview(
    @Param('type') type: 'products' | 'suppliers' | 'opening_stock',
    @UploadedFile() file: any,
    @Request() req: any,
  ) {
    this.checkEntityPermission(req.user, type);
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
  @UseInterceptors(
    FileInterceptor('file', {
      limits: UPLOAD_LIMITS,
      fileFilter,
    }),
  )
  async execute(
    @Param('type') type: 'products' | 'suppliers' | 'opening_stock',
    @UploadedFile() file: any,
    @Query('skipErrors') skipErrorsQuery: string,
    @Body() bodyOptions: ImportOptionsDto,
    @Request() req: any,
  ) {
    this.checkEntityPermission(req.user, type);
    if (!file || !file.buffer) {
      throw new BadRequestException('Vui lòng chọn file Excel để tải lên');
    }

    const shouldSkip =
      skipErrorsQuery === 'true' ||
      skipErrorsQuery === '1' ||
      bodyOptions?.skipErrors === true;

    const mergedOptions: ImportOptionsDto = {
      ...bodyOptions,
      skipErrors: shouldSkip,
    };

    return this.dataExchangeService.executeImport(
      type,
      file.buffer,
      req.user.id || req.user._id,
      mergedOptions,
    );
  }

  @Post('errors/export')
  @Permissions(
    StaffPermission.MANAGE_PRODUCTS,
    StaffPermission.MANAGE_INVENTORY,
  )
  async exportErrors(@Body('errors') errors: RowError[], @Res() res: Response) {
    if (!Array.isArray(errors) || errors.length === 0) {
      throw new BadRequestException('Danh sách lỗi trống hoặc không hợp lệ');
    }
    const buffer = await this.dataExchangeService.exportErrorReport(errors);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=danh-sach-loi-import.xlsx',
    );
    res.send(buffer);
  }
}
