import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import {
  ERPDocument,
  ERPDocumentDocument,
} from './schemas/erp-document.schema';
import {
  CreateERPDocumentDto,
  AddAttachmentDto,
  ReverseDocumentDto,
  ERPDocumentQueryDto,
} from './dto/erp-document.dto';
import { DocumentStatus } from '../../common/enums';
import { PaginatedResult, paginate } from '../../common/dto/pagination.dto';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/xml',
  'text/xml',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectModel(ERPDocument.name)
    private readonly documentModel: Model<ERPDocumentDocument>,
  ) {}

  /**
   * Tạo chứng từ mới (DRAFT).
   */
  async createDocument(
    dto: CreateERPDocumentDto,
    userId: Types.ObjectId,
  ): Promise<ERPDocumentDocument> {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const documentNumber = `DOC-${dateStr}-${randomSuffix}`;

    const doc = new this.documentModel({
      ...dto,
      documentNumber,
      status: DocumentStatus.DRAFT,
      postingDate: dto.postingDate || new Date(),
      createdBy: userId,
      auditLog: [
        {
          action: 'CREATED',
          actor: userId,
          timestamp: new Date(),
          note: 'Khởi tạo chứng từ điện tử',
        },
      ],
    });

    return doc.save();
  }

  async findAll(
    query?: ERPDocumentQueryDto,
  ): Promise<PaginatedResult<ERPDocumentDocument>> {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (query?.documentType) {
      filter.documentType = query.documentType;
    }

    if (query?.status) {
      filter.status = query.status;
    }

    if (query?.entityType) {
      filter.entityType = query.entityType;
    }

    if (query?.search) {
      const searchRegex = new RegExp(
        query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      filter.$or = [
        { documentNumber: searchRegex },
        { title: searchRegex },
        { entityName: searchRegex },
        { linkedDocumentNumber: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      this.documentModel
        .find(filter)
        .populate('createdBy', 'fullName email')
        .populate('approvedBy', 'fullName email')
        .sort({ postingDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.documentModel.countDocuments(filter).exec(),
    ]);

    return paginate(items, total, page, limit);
  }

  async findById(id: string | Types.ObjectId): Promise<ERPDocumentDocument> {
    const doc = await this.documentModel
      .findById(id)
      .populate('createdBy', 'fullName email')
      .populate('approvedBy', 'fullName email')
      .populate('auditLog.actor', 'fullName email')
      .exec();

    if (!doc) {
      throw new NotFoundException(
        `Không tìm thấy chứng từ với ID: ${String(id)}`,
      );
    }

    return doc;
  }

  /**
   * Ghi sổ chứng từ (POSTED) — Đóng băng chứng từ không được sửa trực tiếp.
   */
  async postDocument(
    id: string | Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ERPDocumentDocument> {
    const doc = await this.findById(id);

    if (doc.status !== DocumentStatus.DRAFT) {
      throw new BadRequestException(
        `Chỉ có thể ghi sổ chứng từ ở trạng thái DRAFT (hiện tại: ${doc.status}).`,
      );
    }

    doc.status = DocumentStatus.POSTED;
    doc.approvedBy = userId;
    doc.auditLog.push({
      action: 'POSTED',
      actor: userId,
      timestamp: new Date(),
      note: 'Ghi sổ chính thức chứng từ kế toán',
    });

    return doc.save();
  }

  /**
   * Đính kèm file (PDF, ảnh, XML, Excel) vào chứng từ.
   * Chặn sửa/đính kèm nếu chứng từ đã ghi sổ (POSTED).
   */
  async addAttachment(
    id: string | Types.ObjectId,
    dto: AddAttachmentDto,
    userId: Types.ObjectId,
  ): Promise<ERPDocumentDocument> {
    const doc = await this.findById(id);

    if (doc.status === DocumentStatus.POSTED) {
      throw new BadRequestException(
        'Chứng từ đã ghi sổ (POSTED) không được chỉnh sửa hoặc đính kèm thêm file trực tiếp.',
      );
    }

    if (
      doc.status === DocumentStatus.CANCELLED ||
      doc.status === DocumentStatus.REVERSED
    ) {
      throw new BadRequestException(
        `Không thể thêm đính kèm vào chứng từ ở trạng thái: ${doc.status}`,
      );
    }

    if (dto.fileSize > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(
        'Dung lượng file vượt quá giới hạn cho phép (tối đa 10MB).',
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(dto.mimeType.toLowerCase())) {
      throw new BadRequestException(
        'Định dạng file không được hỗ trợ. Chỉ chấp nhận PDF, JPEG, PNG, XML hoặc Excel.',
      );
    }

    const fileId = `att_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
    const attachment = {
      fileId,
      fileName: dto.fileName.trim(),
      fileUrl: dto.fileUrl.trim(),
      mimeType: dto.mimeType.toLowerCase(),
      fileSize: dto.fileSize,
      uploadedAt: new Date(),
    };

    doc.attachments.push(attachment);
    doc.auditLog.push({
      action: 'ATTACHMENT_ADDED',
      actor: userId,
      timestamp: new Date(),
      note: `Đính kèm tệp tin: ${dto.fileName}`,
    });

    return doc.save();
  }

  /**
   * Xóa file đính kèm.
   * Chặn xóa nếu chứng từ đã ghi sổ (POSTED).
   */
  async removeAttachment(
    id: string | Types.ObjectId,
    fileId: string,
    userId: Types.ObjectId,
  ): Promise<ERPDocumentDocument> {
    const doc = await this.findById(id);

    if (doc.status === DocumentStatus.POSTED) {
      throw new BadRequestException(
        'Chứng từ đã ghi sổ (POSTED) không được phép xóa tệp tin đính kèm.',
      );
    }

    const initialLength = doc.attachments.length;
    doc.attachments = doc.attachments.filter((a) => a.fileId !== fileId);

    if (doc.attachments.length === initialLength) {
      throw new NotFoundException(
        `Không tìm thấy file đính kèm với ID: ${fileId}`,
      );
    }

    doc.auditLog.push({
      action: 'ATTACHMENT_REMOVED',
      actor: userId,
      timestamp: new Date(),
      note: `Xóa tệp tin đính kèm ID: ${fileId}`,
    });

    return doc.save();
  }

  /**
   * Hoàn đảo chứng từ (REVERSED) — Sinh chứng từ điều chỉnh đối ứng liên kết chứng từ gốc.
   */
  async reverseDocument(
    id: string | Types.ObjectId,
    dto: ReverseDocumentDto,
    userId: Types.ObjectId,
  ): Promise<{
    original: ERPDocumentDocument;
    reversalDocument: ERPDocumentDocument;
  }> {
    const doc = await this.findById(id);

    if (doc.status !== DocumentStatus.POSTED) {
      throw new BadRequestException(
        `Chỉ có thể hoàn đảo chứng từ đã ghi sổ (POSTED). Trạng thái hiện tại: ${doc.status}`,
      );
    }

    // Đánh dấu chứng từ gốc REVERSED
    doc.status = DocumentStatus.REVERSED;
    doc.auditLog.push({
      action: 'REVERSED',
      actor: userId,
      timestamp: new Date(),
      note: `Hoàn đảo chứng từ: ${dto.reason}`,
    });
    await doc.save();

    // Tạo chứng từ đối ứng
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const reversalNumber = `REV-${dateStr}-${randomSuffix}`;

    const reversalDoc = new this.documentModel({
      documentNumber: reversalNumber,
      title: `[Hoàn đảo] ${doc.title}`,
      documentType: doc.documentType,
      status: DocumentStatus.POSTED,
      postingDate: new Date(),
      entityType: doc.entityType,
      entityId: doc.entityId,
      entityName: doc.entityName,
      linkedDocumentNumber: doc.documentNumber,
      amount: doc.amount !== undefined ? -doc.amount : 0,
      metadata: {
        ...doc.metadata,
        reversalReason: dto.reason,
        originalDocumentNumber: doc.documentNumber,
      },
      createdBy: userId,
      approvedBy: userId,
      auditLog: [
        {
          action: 'REVERSAL_CREATED',
          actor: userId,
          timestamp: new Date(),
          note: `Chứng từ đối ứng hoàn đảo cho ${doc.documentNumber}. Lý do: ${dto.reason}`,
        },
      ],
    });

    const savedReversal = await reversalDoc.save();

    return {
      original: doc,
      reversalDocument: savedReversal,
    };
  }

  /**
   * Hủy chứng từ (chỉ áp dụng cho chứng từ DRAFT).
   */
  async cancelDocument(
    id: string | Types.ObjectId,
    userId: Types.ObjectId,
  ): Promise<ERPDocumentDocument> {
    const doc = await this.findById(id);

    if (doc.status === DocumentStatus.POSTED) {
      throw new BadRequestException(
        'Chứng từ đã ghi sổ (POSTED) không thể hủy trực tiếp. Vui lòng sử dụng tính năng hoàn đảo (reverse).',
      );
    }

    doc.status = DocumentStatus.CANCELLED;
    doc.auditLog.push({
      action: 'CANCELLED',
      actor: userId,
      timestamp: new Date(),
      note: 'Hủy bỏ chứng từ nháp',
    });

    return doc.save();
  }
}
