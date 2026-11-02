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
import { NotificationService } from './notification.service';
import { AuthGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { BroadcastNotificationDto } from './dto/broadcast-notification.dto';

@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('unread')
  async getUnread(@Request() req) {
    return this.notificationService.getMyUnreadNotifications(req.user.sub);
  }

  @Get()
  async getAll(@Request() req, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 50;
    return this.notificationService.getAllMyNotifications(req.user.sub, parsedLimit);
  }

  @Patch(':id/read')
  async markAsRead(@Request() req, @Param('id') id: string) {
    return this.notificationService.markAsRead(id, req.user.sub);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationService.markAllAsRead(req.user.sub);
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: string) {
    return this.notificationService.deleteNotification(id, req.user.sub);
  }

  // ==========================================
  // BROADCAST NOTIFICATION (Admin / HR)
  // Target: All, Specific Departments, or Chosen People
  // ==========================================
  @Post('broadcast')
  @UseGuards(PermissionsGuard)
  @RequirePermissions('announcement.manage')
  async broadcast(@Request() req, @Body() dto: BroadcastNotificationDto) {
    return this.notificationService.broadcastNotification(
      req.user.companyId,
      req.user.sub,
      dto,
    );
  }
}
