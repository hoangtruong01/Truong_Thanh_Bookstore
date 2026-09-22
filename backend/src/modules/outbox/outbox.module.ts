import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { OutboxEvent, OutboxEventSchema } from './schemas/outbox-event.schema';
import { OutboxService } from './outbox.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OutboxEvent.name, schema: OutboxEventSchema },
    ]),
    NotificationsModule,
    EmailModule,
    ConfigModule,
  ],
  providers: [OutboxService],
  exports: [OutboxService, MongooseModule],
})
export class OutboxModule {}
