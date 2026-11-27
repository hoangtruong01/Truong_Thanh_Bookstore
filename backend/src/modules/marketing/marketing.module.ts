import { Module } from '@nestjs/common';
import { CampaignsModule } from './campaigns/campaigns.module';
import { TrackingModule } from './tracking/tracking.module';
import { LivestreamsModule } from './livestreams/livestreams.module';
import { SocialModule } from './social/social.module';
import { AdsModule } from './ads/ads.module';
import { AbTestingModule } from './ab-testing/ab-testing.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { RemarketingModule } from './remarketing/remarketing.module';

@Module({
  imports: [
    CampaignsModule,
    TrackingModule,
    LivestreamsModule,
    SocialModule,
    AdsModule,
    AbTestingModule,
    RecommendationsModule,
    RemarketingModule,
  ],
  exports: [
    CampaignsModule,
    TrackingModule,
    LivestreamsModule,
    SocialModule,
    AdsModule,
    AbTestingModule,
    RecommendationsModule,
    RemarketingModule,
  ],
})
export class MarketingModule {}
