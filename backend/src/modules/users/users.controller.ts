import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('wishlist')
  @ApiOperation({ summary: 'Get current user wishlist' })
  async getWishlist(@Request() req: any) {
    return this.usersService.getWishlist(req.user._id);
  }

  @Post('wishlist/:productId')
  @ApiOperation({ summary: 'Toggle product in user wishlist' })
  async toggleWishlist(@Request() req: any, @Param('productId') productId: string) {
    const list = await this.usersService.toggleWishlist(req.user._id, productId);
    return { success: true, wishlist: list };
  }
}
