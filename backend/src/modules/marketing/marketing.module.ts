import { Module } from '@nestjs/common';
import { CampaignsModule } from './campaigns/campaigns.module';
import { TrackingModule } from './tracking/tracking.module';
import { LivestreamsModule } from './livestreams/livestreams.module';

@Module({
  imports: [CampaignsModule, TrackingModule, LivestreamsModule],
  exports: [CampaignsModule, TrackingModule, LivestreamsModule],
})
export class MarketingModule {}
