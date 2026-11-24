import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SocialAccount,
  SocialAccountSchema,
} from './schemas/social-account.schema';
import { SocialPost, SocialPostSchema } from './schemas/social-post.schema';
import { SocialService } from './social.service';
import { SocialController } from './social.controller';
import { ProductsModule } from '../../products/products.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SocialAccount.name, schema: SocialAccountSchema },
      { name: SocialPost.name, schema: SocialPostSchema },
    ]),
    ProductsModule,
  ],
  controllers: [SocialController],
  providers: [SocialService],
  exports: [SocialService],
})
export class SocialModule {}
