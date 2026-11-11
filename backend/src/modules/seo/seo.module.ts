import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema';
import {
  LandingPage,
  LandingPageSchema,
} from '../landing-pages/schemas/landing-page.schema';
import { SeoController } from './seo.controller';
import { SeoService } from './seo.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Category.name, schema: CategorySchema },
      { name: LandingPage.name, schema: LandingPageSchema },
    ]),
  ],
  controllers: [SeoController],
  providers: [SeoService],
})
export class SeoModule {}
