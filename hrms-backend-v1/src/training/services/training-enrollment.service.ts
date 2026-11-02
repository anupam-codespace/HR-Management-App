import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  EnrollEmployeesDto,
  UpdateEnrollmentDto,
  BatchSessionAttendanceDto,
} from '../dto/enrollment.dto';

@Injectable()
export class TrainingEnrollmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async enrollEmployees(companyId: string, user: any, dto: EnrollEmployeesDto) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id: dto.planId, companyId },
    });
    if (!plan) {
      throw new NotFoundException('Training plan not found');
    }

    const sessions = await this.prisma.trainingSession.findMany({
      where: { planId: dto.planId },
    });

    const enrolled: any[] = [];
    const uniqueIds = Array.from(new Set(dto.employeeIds));

    for (const employeeId of uniqueIds) {
      // Validate employee belongs to same company
      const employee = await this.prisma.employee.findFirst({
        where: { id: employeeId, companyId },
      });
      if (!employee) continue;

      const existing = await this.prisma.trainingEnrollment.findFirst({
        where: { planId: dto.planId, employeeId },
      });

      if (!existing) {
        const item = await this.prisma.trainingEnrollment.create({
          data: {
            companyId,
            planId: dto.planId,
            employeeId,
            status: 'ENROLLED',
          },
        });

        // Create attendance stubs for existing sessions
        for (const session of sessions) {
          await this.prisma.trainingAttendance.create({
            data: {
              companyId,
              sessionId: session.id,
              enrollmentId: item.id,
              employeeId,
              status: 'PRESENT',
              attendedHours: 0,
            },
          });
        }

        enrolled.push(item);
      }
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'CREATE',
      'TrainingEnrollment',
      dto.planId,
      null,
      { newlyEnrolled: enrolled.length },
    );

    return enrolled;
  }

  async updateEnrollment(
    companyId: string,
    id: string,
    user: any,
    dto: UpdateEnrollmentDto,
  ) {
    const existing = await this.prisma.trainingEnrollment.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      throw new NotFoundException('Enrollment not found');
    }

    const updated = await this.prisma.trainingEnrollment.update({
      where: { id },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.completionDate !== undefined && {
          completionDate: dto.completionDate ? new Date(dto.completionDate) : null,
        }),
        ...(dto.completionPercentage !== undefined && {
          completionPercentage: dto.completionPercentage,
        }),
        ...(dto.actualHoursSpent !== undefined && {
          actualHoursSpent: dto.actualHoursSpent,
        }),
        ...(dto.preTrainingRating !== undefined && {
          preTrainingRating: dto.preTrainingRating,
        }),
        ...(dto.postTrainingRating !== undefined && {
          postTrainingRating: dto.postTrainingRating,
        }),
        ...(dto.trainerFeedback !== undefined && {
          trainerFeedback: dto.trainerFeedback,
        }),
        ...(dto.employeeFeedback !== undefined && {
          employeeFeedback: dto.employeeFeedback,
        }),
        ...(dto.absenceReason !== undefined && {
          absenceReason: dto.absenceReason,
        }),
      },
    });

    // If marked COMPLETED, auto-update employee competencies if program has defined competencies
    if (dto.status === 'COMPLETED') {
      try {
        const planWithProgram = await this.prisma.trainingPlan.findUnique({
          where: { id: existing.planId },
          include: {
            program: {
              include: {
                competencies: true,
              },
            },
          },
        });

        const PROFICIENCY_RANK: Record<string, number> = {
          NONE: 0,
          BEGINNER: 1,
          INTERMEDIATE: 2,
          ADVANCED: 3,
          EXPERT: 4,
        };

        if (planWithProgram?.program?.competencies?.length) {
          const updaterId = user.sub || user.id;
          for (const pc of planWithProgram.program.competencies) {
            const currentRecord = await this.prisma.employeeCompetency.findUnique({
              where: {
                employeeId_competencyId: {
                  employeeId: existing.employeeId,
                  competencyId: pc.competencyId,
                },
              },
            });

            const currentRank = currentRecord ? PROFICIENCY_RANK[currentRecord.currentLevel] || 0 : 0;
            const targetRank = PROFICIENCY_RANK[pc.targetLevel] || 2;

            if (targetRank >= currentRank) {
              await this.prisma.employeeCompetency.upsert({
                where: {
                  employeeId_competencyId: {
                    employeeId: existing.employeeId,
                    competencyId: pc.competencyId,
                  },
                },
                create: {
                  companyId,
                  employeeId: existing.employeeId,
                  competencyId: pc.competencyId,
                  currentLevel: pc.targetLevel,
                  assessedById: updaterId,
                  assessmentDate: new Date(),
                  verificationStatus: 'VERIFIED',
                  notes: `Auto-verified upon completion of training plan "${planWithProgram.title}".`,
                },
                update: {
                  currentLevel: pc.targetLevel,
                  assessedById: updaterId,
                  assessmentDate: new Date(),
                  verificationStatus: 'VERIFIED',
                  notes: `Auto-verified upon completion of training plan "${planWithProgram.title}".`,
                },
              });
            }
          }
        }
      } catch (err) {
        console.error('Error auto-updating competencies on enrollment completion:', err);
      }
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingEnrollment',
      id,
      existing,
      updated,
    );

    return updated;
  }

  async recordSessionAttendance(
    companyId: string,
    user: any,
    dto: BatchSessionAttendanceDto,
  ) {
    const session = await this.prisma.trainingSession.findFirst({
      where: { id: dto.sessionId, companyId },
    });
    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const updatedRecords: any[] = [];

    for (const rec of dto.records) {
      // Find enrollment
      const enrollment = await this.prisma.trainingEnrollment.findFirst({
        where: { planId: session.planId, employeeId: rec.employeeId },
      });
      if (!enrollment) continue;

      const attendance = await this.prisma.trainingAttendance.upsert({
        where: {
          sessionId_employeeId: {
            sessionId: dto.sessionId,
            employeeId: rec.employeeId,
          },
        },
        create: {
          companyId,
          sessionId: dto.sessionId,
          enrollmentId: enrollment.id,
          employeeId: rec.employeeId,
          status: rec.status,
          attendedHours: rec.attendedHours || 0,
          checkInTime: rec.checkInTime ? new Date(rec.checkInTime) : null,
          checkOutTime: rec.checkOutTime ? new Date(rec.checkOutTime) : null,
          notes: rec.notes,
        },
        update: {
          status: rec.status,
          attendedHours: rec.attendedHours !== undefined ? rec.attendedHours : undefined,
          checkInTime: rec.checkInTime ? new Date(rec.checkInTime) : undefined,
          checkOutTime: rec.checkOutTime ? new Date(rec.checkOutTime) : undefined,
          notes: rec.notes !== undefined ? rec.notes : undefined,
        },
      });

      // Recalculate employee total attended hours for this plan
      const allAttendances = await this.prisma.trainingAttendance.findMany({
        where: { enrollmentId: enrollment.id },
      });

      const totalHours = allAttendances.reduce((sum, a) => sum + (a.attendedHours || 0), 0);
      const attendedSessions = allAttendances.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
      const totalSessions = allAttendances.length;
      const completionPercentage = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0;

      await this.prisma.trainingEnrollment.update({
        where: { id: enrollment.id },
        data: {
          actualHoursSpent: totalHours,
          completionPercentage,
        },
      });

      updatedRecords.push(attendance);
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingAttendance',
      dto.sessionId,
      null,
      { count: updatedRecords.length },
    );

    return updatedRecords;
  }
}
