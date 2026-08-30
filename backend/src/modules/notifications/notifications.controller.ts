import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  BroadcastNotificationDto,
  NotificationQueryDto,
} from './dto/create-notification.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UserRole } from '../../common/enums';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my-notifications')
  @ApiOperation({ summary: 'Lấy danh sách thông báo của người dùng (kèm số lượng chưa đọc)' })
  async getMyNotifications(@Request() req: any, @Query() query: NotificationQueryDto) {
    const userId = req.user._id.toString();
    return this.notificationsService.findByUser(userId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Lấy số lượng thông báo chưa đọc của người dùng' })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user._id.toString();
    const count = await this.notificationsService.getUnreadCount(userId);
    return { unreadCount: count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu một thông báo là đã đọc' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user._id.toString();
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo của người dùng là đã đọc' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user._id.toString();
    return this.notificationsService.markAllAsRead(userId);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Quản trị viên phát thông báo toàn hệ thống (Broadcast)' })
  async broadcast(@Body() dto: BroadcastNotificationDto) {
    return this.notificationsService.create({
      title: dto.title,
      message: dto.message,
      type: dto.type || 'system',
      meta: dto.meta || {},
    });
  }
}
