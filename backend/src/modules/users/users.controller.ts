import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  CreateStaffUserDto,
  UpdateUserRoleDto,
  UpdateUserPermissionsDto,
  UpdateUserStatusDto,
  UserQueryDto,
} from './dto/user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';

@ApiTags('users')
@Controller('users')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ── Admin & Super Admin Management Routes ──

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách người dùng phân trang và lọc (Admin/SuperAdmin)' })
  async findAllUsers(@Query() query: UserQueryDto) {
    return this.usersService.findAllUsers(query);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Tạo tài khoản nhân viên hoặc quản trị viên (Admin/SuperAdmin)' })
  async createStaff(@Body() dto: CreateStaffUserDto, @Request() req: any) {
    return this.usersService.createStaffOrAdmin(dto, req.user.role);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy thông tin chi tiết một người dùng bằng ID (Admin/SuperAdmin)' })
  async findById(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật vai trò người dùng (SuperAdmin/Admin)' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    return this.usersService.updateRole(id, dto.role, req.user.role, req.user._id);
  }

  @Patch(':id/permissions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Cập nhật quyền cho tài khoản nhân viên (Admin/SuperAdmin)' })
  async updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateUserPermissionsDto,
    @Request() req: any,
  ) {
    return this.usersService.updatePermissions(id, dto.permissions, req.user.role);
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Khóa hoặc mở khóa tài khoản người dùng (Admin/SuperAdmin)' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @Request() req: any,
  ) {
    return this.usersService.updateStatus(id, dto.status, req.user.role, req.user._id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa tài khoản người dùng (Admin/SuperAdmin)' })
  async deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.deleteUser(id, req.user.role, req.user._id);
  }

  // ── Customer / Authenticated User Routes ──

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

  @Get('loyalty')
  @ApiOperation({ summary: 'Get current user loyalty tier and points' })
  async getLoyaltyInfo(@Request() req: any) {
    return this.usersService.getLoyaltyInfo(req.user._id);
  }
}
