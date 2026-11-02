import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('training/my-learning')
@UseGuards(AuthGuard)
export class MyLearningController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getMyLearning(@Request() req) {
    const employeeId = req.user.sub || req.user.id;
    const companyId = req.user.companyId;

    const [
      enrollments,
      competencies,
      certificates,
      assessments,
      evaluations,
      positionChanges,
    ] = await Promise.all([
      this.prisma.trainingEnrollment.findMany({
        where: { companyId, employeeId },
        include: {
          plan: {
            include: {
              category: true,
              program: true,
              sessions: {
                orderBy: { startTime: 'asc' },
              },
            },
          },
          attendances: {
            include: {
              session: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      }),

      this.prisma.employeeCompetency.findMany({
        where: { companyId, employeeId },
        include: {
          competency: true,
          assessedBy: {
            select: { firstName: true, lastName: true },
          },
        },
        orderBy: { assessmentDate: 'desc' },
      }),

      this.prisma.trainingCertificate.findMany({
        where: { companyId, employeeId },
        include: {
          plan: { select: { title: true } },
        },
        orderBy: { issueDate: 'desc' },
      }),

      this.prisma.trainingAssessment.findMany({
        where: { companyId, employeeId },
        include: {
          plan: { select: { title: true, planNumber: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.trainingEvaluation.findMany({
        where: { companyId, employeeId },
        include: {
          plan: { select: { title: true, planNumber: true } },
          evaluator: { select: { firstName: true, lastName: true } },
          positionChange: true,
        },
        orderBy: { evaluationDate: 'desc' },
      }),

      this.prisma.employeePositionChange.findMany({
        where: { companyId, employeeId },
        include: {
          currentDesignation: true,
          proposedDesignation: true,
          currentDepartment: true,
          proposedDepartment: true,
          trainingPlan: { select: { title: true } },
        },
        orderBy: { proposedEffectiveDate: 'desc' },
      }),
    ]);

    const completedCount = enrollments.filter((e) => e.status === 'COMPLETED').length;
    const totalHoursSpent = enrollments.reduce((sum, e) => sum + (e.actualHoursSpent || 0), 0);

    return {
      summary: {
        totalEnrolled: enrollments.length,
        completedCount,
        inProgressCount: enrollments.filter((e) => e.status === 'IN_PROGRESS' || e.status === 'ENROLLED').length,
        totalHoursSpent: Math.round(totalHoursSpent * 10) / 10,
        certificatesEarned: certificates.length,
        competenciesCount: competencies.length,
      },
      enrollments,
      competencies,
      certificates,
      assessments,
      evaluations,
      positionChanges,
    };
  }
}
