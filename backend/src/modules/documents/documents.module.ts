import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ERPDocument, ERPDocumentSchema } from './schemas/erp-document.schema';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ERPDocument.name, schema: ERPDocumentSchema },
    ]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
