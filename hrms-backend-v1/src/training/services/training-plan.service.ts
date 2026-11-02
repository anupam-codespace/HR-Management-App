import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notification/notification.service';
import { TrainingSequenceService } from './training-sequence.service';
import {
  CreateTrainingPlanDto,
  UpdateTrainingPlanDto,
  ReviewTrainingPlanDto,
} from '../dto/plan.dto';

@Injectable()
export class TrainingPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly sequenceService: TrainingSequenceService,
  ) {}

  async findAll(
    companyId: string,
    user: any,
    filters: {
      status?: string;
      categoryId?: string;
      departmentId?: string;
      search?: string;
      priority?: string;
      trainingType?: string;
    },
  ) {
    const where: any = { companyId };

    // Role-based filtering: standard employees only see plans they are enrolled in or requested
    if (user.role === 'EMPLOYEE') {
      where.OR = [
        { requestingEmployeeId: user.sub || user.id },
        { trainerEmployeeId: user.sub || user.id },
        { enrollments: { some: { employeeId: user.sub || user.id } } },
      ];
    } else if (user.role === 'MANAGER') {
      // Managers can see their department's plans or requested by their direct reports
      if (filters.departmentId) {
        where.requestingDepartmentId = filters.departmentId;
      }
    }

    if (filters.status) where.status = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.priority) where.priority = filters.priority;
    if (filters.trainingType) where.trainingType = filters.trainingType;
    if (filters.search) {
      const searchConditions = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { planNumber: { contains: filters.search, mode: 'insensitive' } },
        { providerName: { contains: filters.search, mode: 'insensitive' } },
        { trainerName: { contains: filters.search, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchConditions }];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    return this.prisma.trainingPlan.findMany({
      where,
      include: {
        category: true,
        program: true,
        requestingEmployee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        requestingDepartment: true,
        targetDesignation: true,
        targetDepartment: true,
        _count: {
          select: {
            enrollments: true,
            sessions: true,
            expenses: true,
            evaluations: true,
            assessments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const plan = await this.prisma.trainingPlan.findFirst({
      where: { id, companyId },
      include: {
        category: true,
        program: {
          include: {
            competencies: {
              include: { competency: true },
            },
            materials: true,
          },
        },
        requestingEmployee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeCode: true,
            department: true,
            designation: true,
          },
        },
        requestingDepartment: true,
        trainerEmployee: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        targetDesignation: true,
        targetDepartment: true,
        enrollments: {
          include: {
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
                email: true,
                department: true,
                designation: true,
              },
            },
            assessments: true,
            certificates: true,
            evaluations: true,
          },
        },
        sessions: {
          include: {
            trainerEmployee: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: {
              select: { attendances: true },
            },
          },
          orderBy: { startTime: 'asc' },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        expenses: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { date: 'desc' },
        },
        evaluations: {
          include: {
            employee: {
              select: { id: true, firstName: true, lastName: true, employeeCode: true },
            },
            evaluator: {
              select: { id: true, firstName: true, lastName: true },
            },
            positionChange: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException(`Training plan with ID ${id} not found`);
    }

    return plan;
  }

  async create(companyId: string, user: any, dto: CreateTrainingPlanDto) {
    const planNumber = await this.sequenceService.getNextCode(
      companyId,
      'TRAINING_PLAN',
      'TRN',
    );

    const requestingEmployeeId = dto.requestingEmployeeId || user.sub || user.id;

    // Calculate total budget if breakdown provided
    const totalBudget =
      dto.totalBudget ||
      (dto.estimatedRegistrationCost || 0) +
        (dto.estimatedTravelCost || 0) +
        (dto.estimatedAccommodationCost || 0) +
        (dto.estimatedMaterialCost || 0);

    const created = await this.prisma.trainingPlan.create({
      data: {
        companyId,
        planNumber,
        title: dto.title.trim(),
        categoryId: dto.categoryId,
        programId: dto.programId,
        trainingType: dto.trainingType || 'DEPARTMENTAL',
        businessJustification: dto.businessJustification?.trim(),
        reason: dto.reason || 'SKILL_GAP',
        priority: dto.priority || 'MEDIUM',
        requestingEmployeeId,
        requestingDepartmentId: dto.requestingDepartmentId,
        status: 'DRAFT',
        deliveryMethod: dto.deliveryMethod || 'HYBRID',
        providerType: dto.providerType || 'INTERNAL',
        providerName: dto.providerName?.trim(),
        trainerName: dto.trainerName?.trim(),
        trainerEmployeeId: dto.trainerEmployeeId,
        venueOrLink: dto.venueOrLink?.trim(),
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        plannedHours: dto.plannedHours || 0,
        totalBudget,
        estimatedTravelCost: dto.estimatedTravelCost || 0,
        estimatedRegistrationCost: dto.estimatedRegistrationCost || 0,
        estimatedAccommodationCost: dto.estimatedAccommodationCost || 0,
        estimatedMaterialCost: dto.estimatedMaterialCost || 0,
        targetDesignationId: dto.targetDesignationId,
        targetDepartmentId: dto.targetDepartmentId,
        proposedEffectiveDate: dto.proposedEffectiveDate
          ? new Date(dto.proposedEffectiveDate)
          : null,
        notes: dto.notes?.trim(),
      },
    });

    // Automatically enroll initial employees if provided
    if (dto.employeeIds && dto.employeeIds.length > 0) {
      const uniqueEmployeeIds = Array.from(new Set(dto.employeeIds));
      for (const empId of uniqueEmployeeIds) {
        await this.prisma.trainingEnrollment.create({
          data: {
            companyId,
            planId: created.id,
            employeeId: empId,
            status: 'ENROLLED',
          },
        });
      }
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'CREATE',
      'TrainingPlan',
      created.id,
      null,
      created,
    );

    return this.findOne(companyId, created.id);
  }

  async update(companyId: string, id: string, user: any, dto: UpdateTrainingPlanDto) {
    const existing = await this.findOne(companyId, id);

    // Only allow editing in DRAFT or CHANGES_REQUESTED status
    if (existing.status !== 'DRAFT' && existing.status !== 'PENDING_APPROVAL') {
      if (user.role === 'EMPLOYEE') {
        throw new ForbiddenException(
          'Cannot edit training plan once approved or in progress',
        );
      }
    }

    const totalBudget =
      dto.totalBudget !== undefined
        ? dto.totalBudget
        : (dto.estimatedRegistrationCost || existing.estimatedRegistrationCost || 0) +
          (dto.estimatedTravelCost || existing.estimatedTravelCost || 0) +
          (dto.estimatedAccommodationCost || existing.estimatedAccommodationCost || 0) +
          (dto.estimatedMaterialCost || existing.estimatedMaterialCost || 0);

    const updated = await this.prisma.trainingPlan.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.programId !== undefined && { programId: dto.programId }),
        ...(dto.trainingType && { trainingType: dto.trainingType }),
        ...(dto.businessJustification !== undefined && {
          businessJustification: dto.businessJustification?.trim(),
        }),
        ...(dto.reason && { reason: dto.reason }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.requestingDepartmentId !== undefined && {
          requestingDepartmentId: dto.requestingDepartmentId,
        }),
        ...(dto.deliveryMethod && { deliveryMethod: dto.deliveryMethod }),
        ...(dto.providerType && { providerType: dto.providerType }),
        ...(dto.providerName !== undefined && { providerName: dto.providerName?.trim() }),
        ...(dto.trainerName !== undefined && { trainerName: dto.trainerName?.trim() }),
        ...(dto.trainerEmployeeId !== undefined && {
          trainerEmployeeId: dto.trainerEmployeeId,
        }),
        ...(dto.venueOrLink !== undefined && { venueOrLink: dto.venueOrLink?.trim() }),
        ...(dto.startDate !== undefined && {
          startDate: dto.startDate ? new Date(dto.startDate) : null,
        }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? new Date(dto.endDate) : null,
        }),
        ...(dto.plannedHours !== undefined && { plannedHours: dto.plannedHours }),
        totalBudget,
        ...(dto.estimatedTravelCost !== undefined && {
          estimatedTravelCost: dto.estimatedTravelCost,
        }),
        ...(dto.estimatedRegistrationCost !== undefined && {
          estimatedRegistrationCost: dto.estimatedRegistrationCost,
        }),
        ...(dto.estimatedAccommodationCost !== undefined && {
          estimatedAccommodationCost: dto.estimatedAccommodationCost,
        }),
        ...(dto.estimatedMaterialCost !== undefined && {
          estimatedMaterialCost: dto.estimatedMaterialCost,
        }),
        ...(dto.targetDesignationId !== undefined && {
          targetDesignationId: dto.targetDesignationId,
        }),
        ...(dto.targetDepartmentId !== undefined && {
          targetDepartmentId: dto.targetDepartmentId,
        }),
        ...(dto.proposedEffectiveDate !== undefined && {
          proposedEffectiveDate: dto.proposedEffectiveDate
            ? new Date(dto.proposedEffectiveDate)
            : null,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes?.trim() }),
      },
    });

    // Update employees if provided
    if (dto.employeeIds) {
      const uniqueEmployeeIds = Array.from(new Set(dto.employeeIds));
      // Add missing ones
      for (const empId of uniqueEmployeeIds) {
        const existingEnrollment = await this.prisma.trainingEnrollment.findFirst({
          where: { planId: id, employeeId: empId },
        });
        if (!existingEnrollment) {
          await this.prisma.trainingEnrollment.create({
            data: {
              companyId,
              planId: id,
              employeeId: empId,
              status: 'ENROLLED',
            },
          });
        }
      }
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingPlan',
      id,
      existing,
      updated,
    );

    return this.findOne(companyId, id);
  }

  // Workflow: Submit for Approval
  async submitForApproval(companyId: string, id: string, user: any) {
    const plan = await this.findOne(companyId, id);
    if (plan.status !== 'DRAFT') {
      throw new BadRequestException('Only DRAFT training plans can be submitted');
    }

    const updated = await this.prisma.trainingPlan.update({
      where: { id },
      data: { status: 'PENDING_APPROVAL' },
    });

    await this.prisma.trainingApproval.create({
      data: {
        companyId,
        planId: id,
        approverId: user.sub || user.id,
        approvalType: 'PLAN_SUBMISSION',
        status: 'PENDING',
        comments: 'Plan submitted for review',
      },
    });

    // Notify HR / Admins
    const hrAdmins = await this.prisma.employee.findMany({
      where: {
        companyId,
        role: { in: ['SUPER_ADMIN', 'OWNER', 'HR_HEAD'] },
      },
      select: { id: true },
    });

    for (const admin of hrAdmins) {
      await this.notificationService.sendInternalNotification(
        companyId,
        admin.id,
        'Training Plan Submitted',
        `Training plan "${plan.title}" (${plan.planNumber}) is pending your approval.`,
        'SYSTEM',
      );
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingPlan',
      id,
      { status: 'DRAFT' },
      { status: 'PENDING_APPROVAL' },
    );

    return updated;
  }

  // Workflow: Review (Approve / Reject / Request changes)
  async review(companyId: string, id: string, user: any, dto: ReviewTrainingPlanDto) {
    const authorizedReviewers = ['SUPER_ADMIN', 'OWNER', 'HR_HEAD', 'ADMIN', 'MANAGER'];
    if (!authorizedReviewers.includes(user?.role)) {
      throw new ForbiddenException(
        'Only managers and HR administrators are authorized to approve or reject training initiatives',
      );
    }

    const plan = await this.findOne(companyId, id);
    if (plan.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException(
        'Only PENDING_APPROVAL plans can be approved or rejected',
      );
    }

    let newStatus = 'APPROVED';
    if (dto.decision === 'REJECT') newStatus = 'REJECTED';
    if (dto.decision === 'CHANGES_REQUESTED') newStatus = 'DRAFT';

    const updated = await this.prisma.trainingPlan.update({
      where: { id },
      data: {
        status: newStatus,
        ...(dto.decision === 'REJECT' && { rejectionReason: dto.comments }),
      },
    });

    await this.prisma.trainingApproval.create({
      data: {
        companyId,
        planId: id,
        approverId: user.sub || user.id,
        approvalType: 'PLAN_SUBMISSION',
        status: dto.decision,
        comments: dto.comments,
        actionDate: new Date(),
      },
    });

    // Notify requester
    if (plan.requestingEmployeeId) {
      await this.notificationService.sendInternalNotification(
        companyId,
        plan.requestingEmployeeId,
        `Training Plan ${newStatus}`,
        `Your training plan "${plan.title}" (${plan.planNumber}) has been ${newStatus.toLowerCase()}.${dto.comments ? ` Notes: ${dto.comments}` : ''}`,
        'SYSTEM',
      );
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      dto.decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
      'TrainingPlan',
      id,
      { status: plan.status },
      { status: newStatus, comments: dto.comments },
    );

    return updated;
  }

  // Workflow: Update execution status (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)
  async updateStatus(
    companyId: string,
    id: string,
    user: any,
    status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  ) {
    const authorizedManagers = ['SUPER_ADMIN', 'OWNER', 'HR_HEAD', 'ADMIN', 'MANAGER'];
    if (!authorizedManagers.includes(user?.role)) {
      throw new ForbiddenException(
        'Only managers and HR administrators can update training execution status',
      );
    }

    const plan = await this.findOne(companyId, id);

    const updated = await this.prisma.trainingPlan.update({
      where: { id },
      data: { status },
    });

    // If marked COMPLETED, update enrolled employees status to COMPLETED if not already completed
    if (status === 'COMPLETED') {
      await this.prisma.trainingEnrollment.updateMany({
        where: { planId: id, status: { in: ['ENROLLED', 'IN_PROGRESS'] } },
        data: {
          status: 'COMPLETED',
          completionDate: new Date(),
          completionPercentage: 100,
        },
      });

      // Notify enrolled employees
      const enrollments = await this.prisma.trainingEnrollment.findMany({
        where: { planId: id },
        select: { employeeId: true },
      });

      for (const enr of enrollments) {
        await this.notificationService.sendInternalNotification(
          companyId,
          enr.employeeId,
          'Training Completed',
          `Training program "${plan.title}" has been marked completed. Post-training evaluation is now available.`,
          'SYSTEM',
        );
      }
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingPlan',
      id,
      { status: plan.status },
      { status },
    );

    return updated;
  }
}
