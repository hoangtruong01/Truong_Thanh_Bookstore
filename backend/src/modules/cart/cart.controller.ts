import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, SyncCartDto } from './dto/cart.dto';

@ApiTags('cart')
@Controller('cart')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy giỏ hàng của người dùng hiện tại' })
  getCart(@Request() req: any) {
    return this.cartService.getCart(req.user._id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  addToCart(@Request() req: any, @Body() dto: AddToCartDto) {
    return this.cartService.addToCart(req.user._id, dto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ hàng' })
  updateItem(
    @Request() req: any,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(req.user._id, productId, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  removeItem(@Request() req: any, @Param('productId') productId: string) {
    return this.cartService.removeItem(req.user._id, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Làm trống giỏ hàng' })
  clearCart(@Request() req: any) {
    return this.cartService.clearCart(req.user._id);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Đồng bộ giỏ hàng offline với giỏ hàng tài khoản' })
  syncCart(@Request() req: any, @Body() dto: SyncCartDto) {
    return this.cartService.syncCart(req.user._id, dto);
  }
}
