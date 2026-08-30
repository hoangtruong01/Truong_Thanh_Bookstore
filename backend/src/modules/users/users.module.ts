import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import { UsersService } from './users.service';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './users.controller';
import { CartModule } from '../cart/cart.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    ConfigModule,
    forwardRef(() => CartModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, CloudinaryService],
  exports: [UsersService, CloudinaryService, MongooseModule],
})
export class UsersModule {}
