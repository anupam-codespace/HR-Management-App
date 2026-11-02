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
  InitiatePositionChangeDto,
  ReviewPositionChangeDto,
  ApplyPositionChangeDto,
} from '../dto/position-change.dto';

@Injectable()
export class EmployeePositionChangeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
    private readonly sequenceService: TrainingSequenceService,
  ) {}

  async findAll(
    companyId: string,
    filters: {
      status?: string;
      changeType?: string;
      departmentId?: string;
      employeeId?: string;
      search?: string;
    },
  ) {
    const where: any = { companyId };
    if (filters.status) where.status = filters.status;
    if (filters.changeType) where.changeType = filters.changeType;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.departmentId) {
      where.OR = [
        { currentDepartmentId: filters.departmentId },
        { proposedDepartmentId: filters.departmentId },
      ];
    }
    if (filters.search) {
      where.OR = [
        { changeNumber: { contains: filters.search, mode: 'insensitive' } },
        { reason: { contains: filters.search, mode: 'insensitive' } },
        {
          employee: {
            OR: [
              { firstName: { contains: filters.search, mode: 'insensitive' } },
              { lastName: { contains: filters.search, mode: 'insensitive' } },
              { employeeCode: { contains: filters.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    return this.prisma.employeePositionChange.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            joiningDate: true,
          },
        },
        currentDesignation: true,
        proposedDesignation: true,
        currentDepartment: true,
        proposedDepartment: true,
        currentBranch: true,
        proposedBranch: true,
        trainingPlan: {
          select: { id: true, planNumber: true, title: true },
        },
        evaluation: {
          select: {
            id: true,
            recommendedOutcome: true,
            trainingEffectivenessRating: true,
            managerEvaluationNotes: true,
          },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const change = await this.prisma.employeePositionChange.findFirst({
      where: { id, companyId },
      include: {
        employee: {
          include: {
            designation: true,
            department: true,
            employmentHistory: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
        currentDesignation: true,
        proposedDesignation: true,
        currentDepartment: true,
        proposedDepartment: true,
        currentBranch: true,
        proposedBranch: true,
        trainingPlan: true,
        evaluation: true,
        appliedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        approvals: {
          include: {
            approver: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!change) {
      throw new NotFoundException(`Position change with ID ${id} not found`);
    }

    return change;
  }

  async initiate(companyId: string, user: any, dto: InitiatePositionChangeDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
      include: {
        designation: true,
        department: true,
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Verify proposed designation exists if provided
    if (dto.proposedDesignationId) {
      const targetDesig = await this.prisma.designation.findFirst({
        where: { id: dto.proposedDesignationId, companyId },
      });
      if (!targetDesig) {
        throw new BadRequestException(
          'Proposed designation does not exist. An authorized user must configure it first.',
        );
      }
    }

    const changeNumber = await this.sequenceService.getNextCode(
      companyId,
      'POSITION_CHANGE',
      'PC',
    );

    const positionChange = await this.prisma.employeePositionChange.create({
      data: {
        companyId,
        changeNumber,
        employeeId: dto.employeeId,
        trainingPlanId: dto.trainingPlanId,
        evaluationId: dto.evaluationId,
        changeType: dto.changeType,
        reason: dto.reason.trim(),
        currentDepartmentId: employee.departmentId,
        proposedDepartmentId: dto.proposedDepartmentId || employee.departmentId,
        currentDesignationId: employee.designationId,
        proposedDesignationId: dto.proposedDesignationId,
        currentJobGrade: dto.proposedJobGrade ? 'Standard' : undefined,
        proposedJobGrade: dto.proposedJobGrade,
        currentBranchId: employee.department?.branchId,
        proposedBranchId: dto.proposedBranchId,
        proposedEffectiveDate: new Date(dto.proposedEffectiveDate),
        compensationReviewStatus: dto.compensationReviewStatus || 'NOT_REQUIRED',
        proposedSalaryIncrease: dto.proposedSalaryIncrease,
        decisionNotes: dto.decisionNotes?.trim(),
        status: 'PENDING_APPROVAL',
      },
    });

    // If linked to evaluation, mark evaluation actionStatus
    if (dto.evaluationId) {
      await this.prisma.trainingEvaluation.update({
        where: { id: dto.evaluationId },
        data: { actionStatus: 'POSITION_CHANGE_INITIATED' },
      });
    }

    // Initialize approval record
    await this.prisma.positionChangeApproval.create({
      data: {
        companyId,
        positionChangeId: positionChange.id,
        approverId: user.sub || user.id,
        stage: 'HR_HEAD',
        status: 'PENDING',
        comments: 'Position change initiated for review',
      },
    });

    // Notify Approvers
    const hrApprovers = await this.prisma.employee.findMany({
      where: { companyId, role: { in: ['SUPER_ADMIN', 'OWNER', 'HR_HEAD'] } },
      select: { id: true },
    });

    for (const app of hrApprovers) {
      await this.notificationService.sendInternalNotification(
        companyId,
        app.id,
        'Personnel Change Approval Required',
        `A ${dto.changeType.toLowerCase()} change request (${changeNumber}) for ${employee.firstName} ${employee.lastName} is awaiting your approval.`,
        'SYSTEM',
      );
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'CREATE',
      'EmployeePositionChange',
      positionChange.id,
      null,
      positionChange,
    );

    return this.findOne(companyId, positionChange.id);
  }

  async review(
    companyId: string,
    id: string,
    user: any,
    dto: ReviewPositionChangeDto,
  ) {
    const change = await this.findOne(companyId, id);

    // 1. Enforce role authorization
    if (user?.role === 'EMPLOYEE') {
      throw new ForbiddenException('Only managers and HR administrators are authorized to review position changes');
    }

    // 2. Prevent self-approval (unless super admin / owner)
    const actorId = user?.sub || user?.id;
    if (actorId === change.employeeId && user?.role !== 'SUPER_ADMIN' && user?.role !== 'OWNER') {
      throw new ForbiddenException('Employees are not permitted to review or approve their own position change requests');
    }

    if (change.status !== 'PENDING_APPROVAL' && change.status !== 'DEFERRED') {
      throw new BadRequestException('Only PENDING or DEFERRED changes can be reviewed');
    }

    let newStatus = 'APPROVED';
    if (dto.decision === 'REJECT') newStatus = 'REJECTED';
    if (dto.decision === 'CHANGES_REQUESTED') newStatus = 'REVISION_REQUESTED';
    if (dto.decision === 'DEFER') newStatus = 'DEFERRED';

    const updated = await this.prisma.employeePositionChange.update({
      where: { id },
      data: {
        status: newStatus,
        ...(dto.decision === 'REJECT' && { rejectionReason: dto.comments }),
      },
    });

    await this.prisma.positionChangeApproval.create({
      data: {
        companyId,
        positionChangeId: id,
        approverId: user.sub || user.id,
        stage: dto.stage || 'HR_HEAD',
        status: dto.decision,
        comments: dto.comments,
        actionDate: new Date(),
      },
    });

    // Notify Employee & Requester
    await this.notificationService.sendInternalNotification(
      companyId,
      change.employeeId,
      `Position Change ${newStatus}`,
      `Your personnel change request (${change.changeNumber}) has been ${newStatus.toLowerCase()}.${dto.comments ? ` Notes: ${dto.comments}` : ''}`,
      'SYSTEM',
    );

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      dto.decision === 'APPROVE' ? 'APPROVE' : 'REJECT',
      'EmployeePositionChange',
      id,
      { status: change.status },
      { status: newStatus, comments: dto.comments },
    );

    return updated;
  }

  /**
   * Applies approved position change to the official Employee record
   * on or after the approved effective date, preserving historical EmploymentHistory!
   */
  async applyApprovedChange(
    companyId: string,
    id: string,
    user: any,
    dto?: ApplyPositionChangeDto,
  ) {
    const change = await this.findOne(companyId, id);

    // Enforce that only executive HR or Admins can officially apply personnel position changes
    const allowedRoles = ['SUPER_ADMIN', 'OWNER', 'HR_HEAD', 'ADMIN'];
    if (!allowedRoles.includes(user?.role)) {
      throw new ForbiddenException(
        'Only HR Administrators and Executive roles are authorized to apply official position changes to employee records',
      );
    }

    if (change.status !== 'APPROVED') {
      throw new BadRequestException('Only APPROVED position changes can be applied');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: change.employeeId },
      include: {
        company: true,
        designation: true,
        department: true,
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const effectiveDate = dto?.effectiveDateOverride
      ? new Date(dto.effectiveDateOverride)
      : change.proposedEffectiveDate;

    // Use transaction for atomic application + history preservation
    await this.prisma.$transaction(async (tx) => {
      // 1. Preserve historical employment record
      const previousJobTitle =
        employee.designation?.name ||
        employee.role ||
        'Employee';

      await tx.employmentHistory.create({
        data: {
          employeeId: employee.id,
          companyName: employee.company.name,
          jobTitle: previousJobTitle,
          startDate: employee.joiningDate || new Date(),
          endDate: effectiveDate,
          reasonForLeaving: `Position Change: ${change.changeType} (${change.changeNumber}) - ${change.reason}`,
        },
      });

      // 2. Update employee's official position, designation, department
      const updateData: any = {};
      if (change.proposedDesignationId) {
        updateData.designationId = change.proposedDesignationId;
      }
      if (change.proposedDepartmentId) {
        updateData.departmentId = change.proposedDepartmentId;
      }

      await tx.employee.update({
        where: { id: employee.id },
        data: updateData,
      });

      // 3. Update Position Change record to APPLIED
      await tx.employeePositionChange.update({
        where: { id },
        data: {
          status: 'APPLIED',
          appliedAt: new Date(),
          appliedById: user.sub || user.id,
          decisionNotes: dto?.notes || change.decisionNotes,
        },
      });
    });

    // Notify employee of official promotion/transfer
    await this.notificationService.sendInternalNotification(
      companyId,
      employee.id,
      'Official Personnel Change Effective',
      `Congratulations! Your official position change (${change.changeType}) has been processed and is now effective.`,
      'SYSTEM',
    );

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'EmployeePositionChange',
      id,
      { status: 'APPROVED' },
      { status: 'APPLIED', effectiveDate },
    );

    return this.findOne(companyId, id);
  }
}
