import { Module } from '@nestjs/common';
import { CampaignsModule } from './campaigns/campaigns.module';
import { TrackingModule } from './tracking/tracking.module';
import { LivestreamsModule } from './livestreams/livestreams.module';
import { SocialModule } from './social/social.module';
import { AdsModule } from './ads/ads.module';

@Module({
  imports: [
    CampaignsModule,
    TrackingModule,
    LivestreamsModule,
    SocialModule,
    AdsModule,
  ],
  exports: [
    CampaignsModule,
    TrackingModule,
    LivestreamsModule,
    SocialModule,
    AdsModule,
  ],
})
export class MarketingModule {}
