import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notification/notification.service';
import {
  CreateTrainingEvaluationDto,
  UpdateTrainingEvaluationDto,
} from '../dto/evaluation.dto';

@Injectable()
export class TrainingEvaluationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  async findAll(companyId: string) {
    return this.prisma.trainingEvaluation.findMany({
      where: { companyId },
      include: {
        plan: {
          select: { id: true, title: true, planNumber: true, trainingType: true },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            designation: true,
            department: true,
          },
        },
        evaluator: {
          select: { id: true, firstName: true, lastName: true },
        },
        positionChange: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPlan(companyId: string, planId: string) {
    return this.prisma.trainingEvaluation.findMany({
      where: { companyId, planId },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            designation: true,
            department: true,
          },
        },
        evaluator: {
          select: { id: true, firstName: true, lastName: true },
        },
        positionChange: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmployee(companyId: string, employeeId: string) {
    return this.prisma.trainingEvaluation.findMany({
      where: { companyId, employeeId },
      include: {
        plan: {
          select: { id: true, title: true, planNumber: true, trainingType: true },
        },
        evaluator: {
          select: { id: true, firstName: true, lastName: true },
        },
        positionChange: true,
      },
      orderBy: { evaluationDate: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const evaluation = await this.prisma.trainingEvaluation.findFirst({
      where: { id, companyId },
      include: {
        plan: true,
        employee: {
          include: {
            designation: true,
            department: true,
          },
        },
        evaluator: {
          select: { id: true, firstName: true, lastName: true },
        },
        positionChange: {
          include: {
            currentDesignation: true,
            proposedDesignation: true,
            currentDepartment: true,
            proposedDepartment: true,
            approvals: {
              include: {
                approver: {
                  select: { id: true, firstName: true, lastName: true, role: true },
                },
              },
            },
          },
        },
      },
    });

    if (!evaluation) {
      throw new NotFoundException(`Training evaluation with ID ${id} not found`);
    }

    return evaluation;
  }

  async create(companyId: string, user: any, dto: CreateTrainingEvaluationDto) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id: dto.planId, companyId },
    });
    if (!plan) {
      throw new NotFoundException('Training plan not found');
    }

    const enrollment = await this.prisma.trainingEnrollment.findFirst({
      where: { planId: dto.planId, employeeId: dto.employeeId },
    });
    if (!enrollment) {
      throw new NotFoundException('Employee is not enrolled in this plan');
    }

    const evaluatorId = user.sub || user.id;

    const evaluation = await this.prisma.trainingEvaluation.create({
      data: {
        companyId,
        planId: dto.planId,
        enrollmentId: enrollment.id,
        employeeId: dto.employeeId,
        evaluatorId,
        evaluationDate: dto.evaluationDate ? new Date(dto.evaluationDate) : new Date(),
        competenciesAchieved: dto.competenciesAchieved || [],
        trainingEffectivenessRating: dto.trainingEffectivenessRating || 5,
        businessImpact: dto.businessImpact?.trim(),
        remainingGaps: dto.remainingGaps?.trim(),
        trainerFeedbackSummary: dto.trainerFeedbackSummary?.trim(),
        managerEvaluationNotes: dto.managerEvaluationNotes.trim(),
        employeeFeedbackSummary: dto.employeeFeedbackSummary?.trim(),
        recommendedOutcome: dto.recommendedOutcome,
        actionStatus: 'PENDING_REVIEW',
        supportingEvidenceUrl: dto.supportingEvidenceUrl,
      },
      include: {
        employee: { select: { firstName: true, lastName: true } },
      },
    });

    // Notify HR / Admins if outcome recommends a promotion, role change, or transfer
    if (
      [
        'RECOMMEND_PROMOTION',
        'INITIATE_TRANSFER',
        'RECOMMEND_ROLE_CHANGE',
        'UPDATE_APPROVED_GRADE_DESIGNATION',
        'RECOMMEND_COMPENSATION_REVIEW',
      ].includes(dto.recommendedOutcome)
    ) {
      const hrHeads = await this.prisma.employee.findMany({
        where: { companyId, role: { in: ['SUPER_ADMIN', 'OWNER', 'HR_HEAD'] } },
        select: { id: true },
      });

      for (const hr of hrHeads) {
        await this.notificationService.sendInternalNotification(
          companyId,
          hr.id,
          'Post-Training Career Recommendation',
          `Evaluation for ${evaluation.employee.firstName} ${evaluation.employee.lastName} on plan "${plan.title}" recommends: ${dto.recommendedOutcome.replace(/_/g, ' ')}. Action required.`,
          'SYSTEM',
        );
      }
    }

    this.auditService.logAction(
      companyId,
      evaluatorId,
      'CREATE',
      'TrainingEvaluation',
      evaluation.id,
      null,
      evaluation,
    );

    return evaluation;
  }

  async update(
    companyId: string,
    id: string,
    user: any,
    dto: UpdateTrainingEvaluationDto,
  ) {
    const existing = await this.findOne(companyId, id);

    const updated = await this.prisma.trainingEvaluation.update({
      where: { id },
      data: {
        ...(dto.competenciesAchieved !== undefined && {
          competenciesAchieved: dto.competenciesAchieved,
        }),
        ...(dto.trainingEffectivenessRating !== undefined && {
          trainingEffectivenessRating: dto.trainingEffectivenessRating,
        }),
        ...(dto.businessImpact !== undefined && {
          businessImpact: dto.businessImpact?.trim(),
        }),
        ...(dto.remainingGaps !== undefined && {
          remainingGaps: dto.remainingGaps?.trim(),
        }),
        ...(dto.trainerFeedbackSummary !== undefined && {
          trainerFeedbackSummary: dto.trainerFeedbackSummary?.trim(),
        }),
        ...(dto.managerEvaluationNotes !== undefined && {
          managerEvaluationNotes: dto.managerEvaluationNotes?.trim(),
        }),
        ...(dto.employeeFeedbackSummary !== undefined && {
          employeeFeedbackSummary: dto.employeeFeedbackSummary?.trim(),
        }),
        ...(dto.recommendedOutcome && {
          recommendedOutcome: dto.recommendedOutcome,
        }),
        ...(dto.actionStatus && { actionStatus: dto.actionStatus }),
        ...(dto.supportingEvidenceUrl !== undefined && {
          supportingEvidenceUrl: dto.supportingEvidenceUrl,
        }),
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingEvaluation',
      id,
      existing,
      updated,
    );

    return updated;
  }
}
