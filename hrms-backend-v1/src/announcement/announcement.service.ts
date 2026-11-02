import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnnouncementService {
  constructor(private prisma: PrismaService) {}

  async createAnnouncement(companyId: string, title: string, content: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        companyId,
        title,
        content,
      },
    });

    // Also populate notifications for employees so the bell lights up!
    try {
      const employees = await this.prisma.employee.findMany({
      where: { companyId, employmentStatus: 'ACTIVE' },
        include: { notificationSettings: true },
      });

      const eligible = employees.filter(
        (e) => e.notificationSettings?.companyAnnouncements !== false,
      );

      if (eligible.length > 0) {
        await this.prisma.notification.createMany({
          data: eligible.map((emp) => ({
            companyId,
            userId: emp.id,
            title: `Announcement: ${title}`,
            message: content.length > 150 ? content.substring(0, 147) + '...' : content,
            type: 'ANNOUNCEMENT',
            isRead: false,
          })),
        });
      }
    } catch (err) {
      console.error('Failed to fan out notification for announcement:', err);
    }

    return announcement;
  }

  async getAnnouncements(companyId: string) {
    return this.prisma.announcement.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteAnnouncement(companyId: string, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: { id, companyId },
    });

    if (!announcement) {
      throw new NotFoundException('Announcement not found in your workspace');
    }

    return this.prisma.announcement.delete({
      where: { id },
    });
  }
}
