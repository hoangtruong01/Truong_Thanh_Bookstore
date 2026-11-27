import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AbExperiment,
  AbExperimentSchema,
} from './schemas/ab-experiment.schema';
import { AbTestingService } from './ab-testing.service';
import { AbTestingController } from './ab-testing.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AbExperiment.name, schema: AbExperimentSchema },
    ]),
  ],
  controllers: [AbTestingController],
  providers: [AbTestingService],
  exports: [AbTestingService],
})
export class AbTestingModule {}
