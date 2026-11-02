import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TrainingDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(companyId: string, user: any) {
    const isEmployeeOnly = user.role === 'EMPLOYEE';
    const isManager = user.role === 'MANAGER';

    // Base filter
    const planWhere: any = { companyId };
    if (isEmployeeOnly) {
      planWhere.OR = [
        { requestingEmployeeId: user.sub || user.id },
        { enrollments: { some: { employeeId: user.sub || user.id } } },
      ];
    }

    // Counts
    const [
      totalPlans,
      draftPlans,
      pendingApprovalPlans,
      approvedPlans,
      scheduledPlans,
      inProgressPlans,
      completedPlans,
      totalPrograms,
      totalCompetencies,
      totalCertificates,
    ] = await Promise.all([
      this.prisma.trainingPlan.count({ where: planWhere }),
      this.prisma.trainingPlan.count({ where: { ...planWhere, status: 'DRAFT' } }),
      this.prisma.trainingPlan.count({ where: { ...planWhere, status: 'PENDING_APPROVAL' } }),
      this.prisma.trainingPlan.count({ where: { ...planWhere, status: 'APPROVED' } }),
      this.prisma.trainingPlan.count({ where: { ...planWhere, status: 'SCHEDULED' } }),
      this.prisma.trainingPlan.count({ where: { ...planWhere, status: 'IN_PROGRESS' } }),
      this.prisma.trainingPlan.count({ where: { ...planWhere, status: 'COMPLETED' } }),
      this.prisma.trainingProgram.count({ where: { companyId } }),
      this.prisma.competency.count({ where: { companyId } }),
      this.prisma.trainingCertificate.count({ where: { companyId } }),
    ]);

    // Enrollments & Completion rates
    const enrollmentsWhere: any = { companyId };
    if (isEmployeeOnly) {
      enrollmentsWhere.employeeId = user.sub || user.id;
    }

    const [totalEnrollments, completedEnrollments, inProgressEnrollments] = await Promise.all([
      this.prisma.trainingEnrollment.count({ where: enrollmentsWhere }),
      this.prisma.trainingEnrollment.count({
        where: { ...enrollmentsWhere, status: 'COMPLETED' },
      }),
      this.prisma.trainingEnrollment.count({
        where: { ...enrollmentsWhere, status: 'IN_PROGRESS' },
      }),
    ]);

    const completionRate =
      totalEnrollments > 0
        ? Math.round((completedEnrollments / totalEnrollments) * 100)
        : 0;

    // Budget & Expenditure
    const expenses = await this.prisma.trainingExpense.aggregate({
      where: { companyId },
      _sum: { amount: true },
    });
    const actualExpenditure = expenses._sum.amount || 0;

    const plansBudget = await this.prisma.trainingPlan.aggregate({
      where: { companyId },
      _sum: { totalBudget: true },
    });
    const totalPlannedBudget = plansBudget._sum.totalBudget || 0;
    const budgetUtilization =
      totalPlannedBudget > 0
        ? Math.round((actualExpenditure / totalPlannedBudget) * 100)
        : 0;

    // Pending assessments & evaluations
    const pendingAssessments = await this.prisma.trainingAssessment.count({
      where: { companyId, result: 'PENDING' },
    });

    const pendingEvaluations = await this.prisma.trainingEvaluation.count({
      where: { companyId, actionStatus: 'PENDING_REVIEW' },
    });

    // Upcoming expiring certificates (within next 60 days)
    const now = new Date();
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + 60);

    const expiringCertificatesCount = await this.prisma.trainingCertificate.count({
      where: {
        companyId,
        expiryDate: {
          gte: now,
          lte: expiryThreshold,
        },
      },
    });

    // Pending position changes
    const pendingPositionChanges = await this.prisma.employeePositionChange.count({
      where: { companyId, status: 'PENDING_APPROVAL' },
    });

    // Recent plans
    const recentPlans = await this.prisma.trainingPlan.findMany({
      where: planWhere,
      include: {
        category: true,
        program: true,
        _count: {
          select: { enrollments: true, sessions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    // Upcoming sessions
    const upcomingSessions = await this.prisma.trainingSession.findMany({
      where: {
        companyId,
        startTime: { gte: now },
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
      include: {
        plan: { select: { id: true, title: true, planNumber: true } },
        trainerEmployee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    });

    return {
      kpis: {
        totalPlans,
        draftPlans,
        pendingApprovalPlans,
        approvedPlans,
        scheduledPlans,
        inProgressPlans,
        completedPlans,
        totalPrograms,
        totalCompetencies,
        totalCertificates,
        totalEnrollments,
        completedEnrollments,
        inProgressEnrollments,
        completionRate,
        totalPlannedBudget,
        actualExpenditure,
        budgetUtilization,
        pendingAssessments,
        pendingEvaluations,
        expiringCertificatesCount,
        pendingPositionChanges,
      },
      recentPlans,
      upcomingSessions,
    };
  }

  // Reports and Analytics
  async getReports(
    companyId: string,
    filters: {
      type:
        | 'PARTICIPATION_BY_DEPARTMENT'
        | 'BUDGET_VS_ACTUAL'
        | 'COMPETENCY_ACHIEVEMENT'
        | 'CAREER_PROGRESSION'
        | 'EXPIRING_QUALIFICATIONS'
        | 'SKILL_GAPS';
      departmentId?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    if (filters.type === 'PARTICIPATION_BY_DEPARTMENT') {
      const departments = await this.prisma.department.findMany({
        where: { companyId },
        include: {
          employees: {
            include: {
              trainingEnrollments: {
                include: { plan: true },
              },
            },
          },
        },
      });

      return departments.map((d) => {
        let totalEnrolled = 0;
        let totalCompleted = 0;
        let totalHours = 0;

        for (const emp of d.employees) {
          totalEnrolled += emp.trainingEnrollments.length;
          totalCompleted += emp.trainingEnrollments.filter(
            (e) => e.status === 'COMPLETED',
          ).length;
          totalHours += emp.trainingEnrollments.reduce(
            (sum, e) => sum + (e.actualHoursSpent || 0),
            0,
          );
        }

        return {
          departmentId: d.id,
          departmentName: d.name,
          employeeCount: d.employees.length,
          totalEnrolled,
          totalCompleted,
          completionRate:
            totalEnrolled > 0
              ? Math.round((totalCompleted / totalEnrolled) * 100)
              : 0,
          totalHoursSpent: Math.round(totalHours * 10) / 10,
        };
      });
    }

    if (filters.type === 'BUDGET_VS_ACTUAL') {
      const plans = await this.prisma.trainingPlan.findMany({
        where: { companyId },
        include: {
          category: true,
          expenses: true,
          _count: { select: { enrollments: true } },
        },
      });

      return plans.map((p) => {
        const actual = p.expenses.reduce((sum, e) => sum + e.amount, 0);
        const enrolledCount = p._count.enrollments || 1;
        return {
          planId: p.id,
          planNumber: p.planNumber,
          title: p.title,
          category: p.category?.name || 'General',
          plannedBudget: p.totalBudget,
          actualExpenditure: actual,
          variance: p.totalBudget - actual,
          enrolledCount: p._count.enrollments,
          costPerEmployee: Math.round((actual / enrolledCount) * 100) / 100,
          status: p.status,
        };
      });
    }

    if (filters.type === 'CAREER_PROGRESSION') {
      const changes = await this.prisma.employeePositionChange.findMany({
        where: { companyId },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
            },
          },
          currentDesignation: true,
          proposedDesignation: true,
          currentDepartment: true,
          proposedDepartment: true,
          trainingPlan: {
            select: { id: true, planNumber: true, title: true },
          },
          evaluation: true,
        },
        orderBy: { proposedEffectiveDate: 'desc' },
      });

      return changes.map((c) => ({
        changeNumber: c.changeNumber,
        employee: `${c.employee.firstName} ${c.employee.lastName} (${c.employee.employeeCode})`,
        changeType: c.changeType,
        fromDesignation: c.currentDesignation?.name || 'Unassigned',
        toDesignation: c.proposedDesignation?.name || 'Unassigned',
        fromDepartment: c.currentDepartment?.name || 'Unassigned',
        toDepartment: c.proposedDepartment?.name || 'Unassigned',
        associatedTrainingPlan: c.trainingPlan?.title || 'Direct Career Review',
        effectiveDate: c.proposedEffectiveDate,
        status: c.status,
        appliedAt: c.appliedAt,
      }));
    }

    if (filters.type === 'EXPIRING_QUALIFICATIONS') {
      const certificates = await this.prisma.trainingCertificate.findMany({
        where: { companyId, expiryDate: { not: null } },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeCode: true,
              department: true,
            },
          },
          plan: { select: { title: true } },
        },
        orderBy: { expiryDate: 'asc' },
      });

      return certificates.map((c) => ({
        id: c.id,
        title: c.title,
        certificateNumber: c.certificateNumber || 'N/A',
        issuingOrganization: c.issuingOrganization,
        employee: `${c.employee.firstName} ${c.employee.lastName}`,
        department: c.employee.department?.name || 'Unassigned',
        issueDate: c.issueDate,
        expiryDate: c.expiryDate,
        verificationStatus: c.verificationStatus,
        isExpired: c.expiryDate ? new Date(c.expiryDate) < new Date() : false,
      }));
    }

    return [];
  }
}
