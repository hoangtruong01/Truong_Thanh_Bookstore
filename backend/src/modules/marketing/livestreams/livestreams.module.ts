import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  LivestreamSession,
  LivestreamSessionSchema,
} from './schemas/livestream-session.schema';
import { LivestreamsService } from './livestreams.service';
import { LivestreamsController } from './livestreams.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LivestreamSession.name, schema: LivestreamSessionSchema },
    ]),
  ],
  controllers: [LivestreamsController],
  providers: [LivestreamsService],
  exports: [LivestreamsService, MongooseModule],
})
export class LivestreamsModule {}
