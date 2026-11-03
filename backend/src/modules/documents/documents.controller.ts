import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Types } from 'mongoose';
import { DocumentsService } from './documents.service';
import {
  CreateERPDocumentDto,
  AddAttachmentDto,
  ReverseDocumentDto,
  ERPDocumentQueryDto,
} from './dto/erp-document.dto';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { StaffPermission } from '../../common/enums';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post()
  @Permissions(StaffPermission.MANAGE_DOCUMENTS, StaffPermission.MANAGE_FINANCE)
  @ApiOperation({ summary: 'Khởi tạo chứng từ điện tử mới (DRAFT)' })
  async create(
    @Body() dto: CreateERPDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.createDocument(
      dto,
      new Types.ObjectId(userId),
    );
  }

  @Get()
  @Permissions(
    StaffPermission.VIEW_DOCUMENTS,
    StaffPermission.MANAGE_DOCUMENTS,
    StaffPermission.MANAGE_FINANCE,
    StaffPermission.VIEW_REPORTS,
  )
  @ApiOperation({ summary: 'Lấy danh sách chứng từ có bộ lọc và phân trang' })
  async findAll(@Query() query: ERPDocumentQueryDto) {
    return this.documentsService.findAll(query);
  }

  @Get(':id')
  @Permissions(
    StaffPermission.VIEW_DOCUMENTS,
    StaffPermission.MANAGE_DOCUMENTS,
    StaffPermission.MANAGE_FINANCE,
    StaffPermission.VIEW_REPORTS,
  )
  @ApiOperation({ summary: 'Xem chi tiết chứng từ điện tử' })
  async findById(@Param('id') id: string) {
    return this.documentsService.findById(id);
  }

  @Patch(':id/post')
  @Permissions(StaffPermission.MANAGE_DOCUMENTS, StaffPermission.MANAGE_FINANCE)
  @ApiOperation({
    summary: 'Ghi sổ chính thức chứng từ (POSTED) — Đóng băng không sửa đổi',
  })
  async postDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.postDocument(id, new Types.ObjectId(userId));
  }

  @Post(':id/attachments')
  @Permissions(StaffPermission.MANAGE_DOCUMENTS, StaffPermission.MANAGE_FINANCE)
  @ApiOperation({ summary: 'Đính kèm file PDF, ảnh, XML, Excel vào chứng từ' })
  async addAttachment(
    @Param('id') id: string,
    @Body() dto: AddAttachmentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.addAttachment(
      id,
      dto,
      new Types.ObjectId(userId),
    );
  }

  @Delete(':id/attachments/:fileId')
  @Permissions(StaffPermission.MANAGE_DOCUMENTS, StaffPermission.MANAGE_FINANCE)
  @ApiOperation({ summary: 'Xóa file đính kèm khỏi chứng từ nháp' })
  async removeAttachment(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.removeAttachment(
      id,
      fileId,
      new Types.ObjectId(userId),
    );
  }

  @Post(':id/reverse')
  @Permissions(StaffPermission.MANAGE_DOCUMENTS, StaffPermission.MANAGE_FINANCE)
  @ApiOperation({
    summary: 'Hoàn đảo chứng từ đã ghi sổ (REVERSED) & sinh chứng từ đối ứng',
  })
  async reverseDocument(
    @Param('id') id: string,
    @Body() dto: ReverseDocumentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.reverseDocument(
      id,
      dto,
      new Types.ObjectId(userId),
    );
  }

  @Patch(':id/cancel')
  @Permissions(StaffPermission.MANAGE_DOCUMENTS, StaffPermission.MANAGE_FINANCE)
  @ApiOperation({ summary: 'Hủy bỏ chứng từ nháp (CANCELLED)' })
  async cancelDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.documentsService.cancelDocument(id, new Types.ObjectId(userId));
  }
}
