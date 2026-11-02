import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { ERPDocument } from './schemas/erp-document.schema';
import { DocumentType, DocumentStatus } from '../../common/enums';

describe('DocumentsService (DOC-02: Document Center & Electronic Documents)', () => {
  let service: DocumentsService;
  let mockDocumentModel: any;

  const mockUserId = new Types.ObjectId();
  const mockDocId = new Types.ObjectId();

  beforeEach(async () => {
    mockDocumentModel = jest.fn().mockImplementation(function (dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockImplementation(function (this: any) {
        return Promise.resolve(this);
      });
    });

    mockDocumentModel.findOne = jest.fn();
    mockDocumentModel.findById = jest.fn();
    mockDocumentModel.find = jest.fn();
    mockDocumentModel.countDocuments = jest.fn();
    mockDocumentModel.create = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        {
          provide: getModelToken(ERPDocument.name),
          useValue: mockDocumentModel,
        },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  describe('DOC-02-T01: Tạo chứng từ mới (DRAFT)', () => {
    it('should generate unique documentNumber and initial audit log', async () => {
      const result = await service.createDocument(
        {
          title: 'Hóa đơn mua sách NXB Trẻ',
          documentType: DocumentType.SUPPLIER_INVOICE,
          entityType: 'SUPPLIER',
          amount: 5000000,
        },
        mockUserId,
      );

      expect(result.status).toBe(DocumentStatus.DRAFT);
      expect(result.documentNumber).toMatch(/^DOC-\d{8}-\d{4}$/);
      expect(result.auditLog).toHaveLength(1);
      expect(result.auditLog[0].action).toBe('CREATED');
    });
  });

  describe('DOC-02-T02, T03 & T04: Đính kèm file & Validation', () => {
    it('should successfully add attachment for valid PDF and update audit log', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.DRAFT,
        attachments: [],
        auditLog: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      const updated = await service.addAttachment(
        mockDocId,
        {
          fileName: 'hoa-don-vat.pdf',
          fileUrl: 'https://cdn.example.com/hoa-don.pdf',
          mimeType: 'application/pdf',
          fileSize: 1024 * 500, // 500KB
        },
        mockUserId,
      );

      expect(updated.attachments).toHaveLength(1);
      expect(updated.attachments[0].fileName).toBe('hoa-don-vat.pdf');
      expect(updated.attachments[0].fileId).toMatch(/^att_/);
      expect(
        updated.auditLog.some((a: any) => a.action === 'ATTACHMENT_ADDED'),
      ).toBe(true);
    });

    it('should reject file exceeding 10MB limit', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.DRAFT,
        attachments: [],
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      await expect(
        service.addAttachment(
          mockDocId,
          {
            fileName: 'large-file.pdf',
            fileUrl: 'https://cdn.example.com/large.pdf',
            mimeType: 'application/pdf',
            fileSize: 15 * 1024 * 1024, // 15MB
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject unsupported file MIME type', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.DRAFT,
        attachments: [],
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      await expect(
        service.addAttachment(
          mockDocId,
          {
            fileName: 'malware.exe',
            fileUrl: 'https://cdn.example.com/malware.exe',
            mimeType: 'application/x-msdownload',
            fileSize: 1024,
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('DOC-02-T05 & T06: Ghi sổ (POSTED) & Chống chỉnh sửa trực tiếp', () => {
    it('should post DRAFT document and stamp approvedBy', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.DRAFT,
        auditLog: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      const posted = await service.postDocument(mockDocId, mockUserId);

      expect(posted.status).toBe(DocumentStatus.POSTED);
      expect(posted.approvedBy).toEqual(mockUserId);
      expect(posted.auditLog.some((a: any) => a.action === 'POSTED')).toBe(
        true,
      );
    });

    it('should reject adding attachments to POSTED document', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.POSTED,
        attachments: [],
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      await expect(
        service.addAttachment(
          mockDocId,
          {
            fileName: 'extra.pdf',
            fileUrl: 'https://cdn.../extra.pdf',
            mimeType: 'application/pdf',
            fileSize: 1000,
          },
          mockUserId,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject removing attachments from POSTED document', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.POSTED,
        attachments: [{ fileId: 'att_123' }],
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      await expect(
        service.removeAttachment(mockDocId, 'att_123', mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('DOC-02-T07 & T08: Hoàn đảo chứng từ (REVERSED)', () => {
    it('should reverse POSTED document and generate linked reversal document', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        documentNumber: 'DOC-20261102-1111',
        title: 'Hóa đơn mua sách',
        documentType: DocumentType.SUPPLIER_INVOICE,
        status: DocumentStatus.POSTED,
        amount: 2000000,
        metadata: { taxCode: '0101010101' },
        auditLog: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      const result = await service.reverseDocument(
        mockDocId,
        { reason: 'Hóa đơn bị sai mã số thuế' },
        mockUserId,
      );

      expect(result.original.status).toBe(DocumentStatus.REVERSED);
      expect(result.reversalDocument.status).toBe(DocumentStatus.POSTED);
      expect(result.reversalDocument.linkedDocumentNumber).toBe(
        'DOC-20261102-1111',
      );
      expect(result.reversalDocument.amount).toBe(-2000000);
      expect(result.reversalDocument.documentNumber).toMatch(
        /^REV-\d{8}-\d{4}$/,
      );
    });

    it('should reject reversing document that is not POSTED', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.DRAFT,
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      await expect(
        service.reverseDocument(mockDocId, { reason: 'Lỗi' }, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('DOC-02-T09 & T10: Hủy chứng từ', () => {
    it('should reject cancelling POSTED document directly', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.POSTED,
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      await expect(
        service.cancelDocument(mockDocId, mockUserId),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully cancel DRAFT document', async () => {
      const mockDoc: any = {
        _id: mockDocId,
        status: DocumentStatus.DRAFT,
        auditLog: [],
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      jest.spyOn(service, 'findById').mockResolvedValue(mockDoc);

      const cancelled = await service.cancelDocument(mockDocId, mockUserId);

      expect(cancelled.status).toBe(DocumentStatus.CANCELLED);
    });
  });
});
