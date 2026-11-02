import { Injectable, BadRequestException } from '@nestjs/common';
import { Announcement } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  BroadcastNotificationDto,
  NotificationTargetAudience,
} from './dto/broadcast-notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  // 1. Fetch unread notifications for a specific user
  async getMyUnreadNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20, // Only fetch the 20 most recent
    });
  }

  // 2. Fetch all notifications for a specific user (read + unread)
  async getAllMyNotifications(userId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // 3. Mark a notification as read
  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  // 4. Mark ALL as read
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // 5. Delete a specific notification
  async deleteNotification(notificationId: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
  }

  // ========================================================
  // INTERNAL HELPER: Call this from LeaveService, AttendanceService, etc.
  // ========================================================
  async sendInternalNotification(
    companyId: string,
    userId: string,
    title: string,
    message: string,
    type: 'LEAVE' | 'ATTENDANCE' | 'SYSTEM' = 'SYSTEM',
  ) {
    return this.prisma.notification.create({
      data: { companyId, userId, title, message, type },
    });
  }

  // ========================================================
  // BROADCAST NOTIFICATION ENGINE (Admin / HR)
  // Supports: All Employees, Specific Departments, Chosen People
  // ========================================================
  async broadcastNotification(
    companyId: string,
    senderId: string,
    dto: BroadcastNotificationDto,
  ) {
    if (!dto.title?.trim() || !dto.message?.trim()) {
      throw new BadRequestException('Notification title and message are required');
    }

    // 1. Resolve target employees
    let candidateEmployees: any[] = [];

    if (dto.targetAudience === NotificationTargetAudience.ALL) {
      candidateEmployees = await this.prisma.employee.findMany({
        where: { companyId, employmentStatus: 'ACTIVE' },
        include: { notificationSettings: true },
      });
    } else if (dto.targetAudience === NotificationTargetAudience.DEPARTMENT) {
      if (!dto.departmentIds || dto.departmentIds.length === 0) {
        throw new BadRequestException('Please select at least one department');
      }
      candidateEmployees = await this.prisma.employee.findMany({
        where: {
          companyId,
          departmentId: { in: dto.departmentIds },
        },
        include: { notificationSettings: true },
      });
    } else if (dto.targetAudience === NotificationTargetAudience.SPECIFIC_EMPLOYEES) {
      if (!dto.employeeIds || dto.employeeIds.length === 0) {
        throw new BadRequestException('Please select at least one employee');
      }
      candidateEmployees = await this.prisma.employee.findMany({
        where: {
          companyId,
          id: { in: dto.employeeIds },
        },
        include: { notificationSettings: true },
      });
    } else {
      throw new BadRequestException('Invalid target audience type');
    }

    if (candidateEmployees.length === 0) {
      return {
        success: true,
        sentCount: 0,
        message: 'No active employees found matching the target audience.',
      };
    }

    // 2. Filter employees according to NotificationSettings preferences
    const isUrgent = dto.priority === 'URGENT';
    const finalRecipients = candidateEmployees.filter((emp) => {
      // If urgent, deliver regardless of preference
      if (isUrgent) return true;
      // If announcement type, check companyAnnouncements setting
      if (dto.type === 'ANNOUNCEMENT' && emp.notificationSettings?.companyAnnouncements === false) {
        return false;
      }
      return true;
    });

    const finalTitle = isUrgent && !dto.title.toUpperCase().startsWith('[URGENT]')
      ? `[URGENT] ${dto.title}`
      : dto.title;

    // 3. Bulk insert notifications for each recipient
    if (finalRecipients.length > 0) {
      const notificationsData = finalRecipients.map((emp) => ({
        companyId,
        userId: emp.id,
        title: finalTitle,
        message: dto.message,
        type: dto.type || 'ANNOUNCEMENT',
        isRead: false,
      }));

      await this.prisma.notification.createMany({
        data: notificationsData,
      });
    }

    // 4. Optionally create an Announcement record (for dashboard widgets)
    let announcementRecord: Announcement | null = null;
    if (dto.createAnnouncement !== false && (dto.targetAudience === NotificationTargetAudience.ALL || dto.type === 'ANNOUNCEMENT')) {
      announcementRecord = await this.prisma.announcement.create({
        data: {
          companyId,
          title: finalTitle,
          content: dto.message,
        },
      });
    }

    return {
      success: true,
      sentCount: finalRecipients.length,
      targetAudience: dto.targetAudience,
      announcementCreated: !!announcementRecord,
      message: `Notification successfully sent to ${finalRecipients.length} employee(s).`,
    };
  }
}
