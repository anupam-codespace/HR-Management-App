import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notification/notification.service';
import { CreateTrainingSessionDto, UpdateTrainingSessionDto } from '../dto/session.dto';

@Injectable()
export class TrainingSessionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(companyId: string, query?: { status?: string; planId?: string }) {
    const where: any = { companyId };
    if (query?.status) where.status = query.status;
    if (query?.planId) where.planId = query.planId;

    return this.prisma.trainingSession.findMany({
      where,
      include: {
        plan: {
          select: { id: true, title: true, planNumber: true, trainingType: true },
        },
        trainerEmployee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findByPlan(companyId: string, planId: string) {
    return this.prisma.trainingSession.findMany({
      where: { companyId, planId },
      include: {
        trainerEmployee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        attendances: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true },
            },
          },
        },
        _count: {
          select: { attendances: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const session = await this.prisma.trainingSession.findFirst({
      where: { id, companyId },
      include: {
        plan: true,
        trainerEmployee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        attendances: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!session) {
      throw new NotFoundException(`Training session with ID ${id} not found`);
    }
    return session;
  }

  async create(companyId: string, user: any, dto: CreateTrainingSessionDto) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id: dto.planId, companyId },
    });
    if (!plan) {
      throw new NotFoundException('Training plan not found');
    }

    const sessionCount = await this.prisma.trainingSession.count({
      where: { planId: dto.planId },
    });

    const session = await this.prisma.trainingSession.create({
      data: {
        companyId,
        planId: dto.planId,
        programId: dto.programId || plan.programId,
        sessionNumber: dto.sessionNumber || sessionCount + 1,
        title: dto.title.trim(),
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        timeZone: dto.timeZone || 'UTC',
        trainerName: dto.trainerName?.trim() || plan.trainerName,
        trainerEmployeeId: dto.trainerEmployeeId || plan.trainerEmployeeId,
        venueOrLink: dto.venueOrLink?.trim() || plan.venueOrLink,
        deliveryMethod: dto.deliveryMethod || plan.deliveryMethod,
        capacity: dto.capacity || 50,
        status: 'SCHEDULED',
        notes: dto.notes?.trim(),
      },
    });

    // Auto-populate attendance roster for all enrolled employees
    const enrollments = await this.prisma.trainingEnrollment.findMany({
      where: { planId: dto.planId },
    });

    for (const enr of enrollments) {
      await this.prisma.trainingAttendance.create({
        data: {
          companyId,
          sessionId: session.id,
          enrollmentId: enr.id,
          employeeId: enr.employeeId,
          status: 'PRESENT', // default scheduled state
          attendedHours: 0,
        },
      });

      // Send upcoming session notification
      await this.notificationService.sendInternalNotification(
        companyId,
        enr.employeeId,
        'Training Session Scheduled',
        `Session "${session.title}" for plan "${plan.title}" is scheduled for ${session.startTime.toLocaleString()}.`,
        'SYSTEM',
      );
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'CREATE',
      'TrainingSession',
      session.id,
      null,
      session,
    );

    return this.findOne(companyId, session.id);
  }

  async update(companyId: string, id: string, user: any, dto: UpdateTrainingSessionDto) {
    const existing = await this.findOne(companyId, id);

    const updated = await this.prisma.trainingSession.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...(dto.timeZone && { timeZone: dto.timeZone }),
        ...(dto.trainerName !== undefined && { trainerName: dto.trainerName?.trim() }),
        ...(dto.trainerEmployeeId !== undefined && {
          trainerEmployeeId: dto.trainerEmployeeId,
        }),
        ...(dto.venueOrLink !== undefined && { venueOrLink: dto.venueOrLink?.trim() }),
        ...(dto.deliveryMethod && { deliveryMethod: dto.deliveryMethod }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() }),
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingSession',
      id,
      existing,
      updated,
    );

    return updated;
  }
}
