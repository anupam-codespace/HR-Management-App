import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notification/notification.service';
import {
  CreateAssessmentDto,
  GradeAssessmentDto,
  CreateCertificateDto,
  VerifyCertificateDto,
} from '../dto/assessment.dto';

@Injectable()
export class TrainingAssessmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificationService: NotificationService,
  ) {}

  // 1. Assessments
  async findAllAssessments(companyId: string, query?: { result?: string }) {
    const where: any = { companyId };
    if (query?.result) where.result = query.result;

    return this.prisma.trainingAssessment.findMany({
      where,
      include: {
        plan: {
          select: { id: true, title: true, planNumber: true },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true },
        },
        assessor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAssessmentsByPlan(companyId: string, planId: string) {
    return this.prisma.trainingAssessment.findMany({
      where: { companyId, planId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        assessor: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAssessment(companyId: string, user: any, dto: CreateAssessmentDto) {
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
      throw new NotFoundException('Employee is not enrolled in this training plan');
    }

    const assessorId = user.sub || user.id;

    const assessment = await this.prisma.trainingAssessment.create({
      data: {
        companyId,
        planId: dto.planId,
        enrollmentId: enrollment.id,
        employeeId: dto.employeeId,
        assessmentType: dto.assessmentType || 'PRACTICAL',
        title: dto.title.trim(),
        passingScore: dto.passingScore !== undefined ? dto.passingScore : 70.0,
        maxScore: dto.maxScore !== undefined ? dto.maxScore : 100.0,
        scoreAchieved: dto.scoreAchieved,
        result: dto.result || 'PENDING',
        attemptNumber: dto.attemptNumber || 1,
        assessorId,
        assessorName: dto.assessorName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        assessedAt: dto.assessedAt ? new Date(dto.assessedAt) : new Date(),
        feedback: dto.feedback?.trim(),
        evidenceUrl: dto.evidenceUrl,
      },
    });

    this.auditService.logAction(
      companyId,
      assessorId,
      'CREATE',
      'TrainingAssessment',
      assessment.id,
      null,
      assessment,
    );

    return assessment;
  }

  async gradeAssessment(
    companyId: string,
    id: string,
    user: any,
    dto: GradeAssessmentDto,
  ) {
    const existing = await this.prisma.trainingAssessment.findFirst({
      where: { id, companyId },
      include: { plan: true },
    });
    if (!existing) {
      throw new NotFoundException('Assessment not found');
    }

    const assessorId = user.sub || user.id;

    const updated = await this.prisma.trainingAssessment.update({
      where: { id },
      data: {
        scoreAchieved: dto.scoreAchieved,
        result: dto.result,
        feedback: dto.feedback !== undefined ? dto.feedback : existing.feedback,
        evidenceUrl: dto.evidenceUrl !== undefined ? dto.evidenceUrl : existing.evidenceUrl,
        assessorId,
        assessedAt: new Date(),
      },
    });

    // Auto-update Employee Competencies if assessment is PASSED
    if (dto.result === 'PASSED') {
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
                  assessedById: assessorId,
                  assessmentDate: new Date(),
                  verificationStatus: 'VERIFIED',
                  evidenceUrl: dto.evidenceUrl || existing.evidenceUrl,
                  notes: `Auto-verified upon passing assessment "${existing.title}" in training plan "${planWithProgram.title}".`,
                },
                update: {
                  currentLevel: pc.targetLevel,
                  assessedById: assessorId,
                  assessmentDate: new Date(),
                  verificationStatus: 'VERIFIED',
                  evidenceUrl: dto.evidenceUrl || existing.evidenceUrl || undefined,
                  notes: `Auto-verified upon passing assessment "${existing.title}" in training plan "${planWithProgram.title}".`,
                },
              });
            }
          }
        }
      } catch (err) {
        // Log error without breaking assessment response
        console.error('Error auto-updating employee competencies from passed assessment:', err);
      }
    }

    // Notify employee of assessment result
    await this.notificationService.sendInternalNotification(
      companyId,
      existing.employeeId,
      `Assessment Graded: ${dto.result}`,
      `Your assessment "${existing.title}" scored ${dto.scoreAchieved}/${existing.maxScore} (${dto.result}).`,
      'SYSTEM',
    );

    this.auditService.logAction(
      companyId,
      assessorId,
      'UPDATE',
      'TrainingAssessment',
      id,
      existing,
      updated,
    );

    return updated;
  }

  // 2. Certificates & Qualifications
  async findCertificates(companyId: string, employeeId?: string) {
    const where: any = { companyId };
    if (employeeId) where.employeeId = employeeId;

    return this.prisma.trainingCertificate.findMany({
      where,
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true, department: true },
        },
        plan: {
          select: { id: true, title: true, planNumber: true },
        },
        verifiedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { issueDate: 'desc' },
    });
  }

  async createCertificate(companyId: string, user: any, dto: CreateCertificateDto) {
    const created = await this.prisma.trainingCertificate.create({
      data: {
        companyId,
        employeeId: dto.employeeId,
        planId: dto.planId,
        enrollmentId: dto.enrollmentId,
        title: dto.title.trim(),
        certificateNumber: dto.certificateNumber?.trim(),
        issuingOrganization: dto.issuingOrganization.trim(),
        issueDate: new Date(dto.issueDate),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
        verificationStatus: dto.verificationStatus || 'VERIFIED',
        credentialUrl: dto.credentialUrl?.trim(),
        documentUrl: dto.documentUrl?.trim(),
        notes: dto.notes?.trim(),
        verifiedById: user.sub || user.id,
        verifiedAt: new Date(),
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'CREATE',
      'TrainingCertificate',
      created.id,
      null,
      created,
    );

    return created;
  }

  async verifyCertificate(
    companyId: string,
    id: string,
    user: any,
    dto: VerifyCertificateDto,
  ) {
    const existing = await this.prisma.trainingCertificate.findFirst({
      where: { id, companyId },
    });
    if (!existing) {
      throw new NotFoundException('Certificate not found');
    }

    const updated = await this.prisma.trainingCertificate.update({
      where: { id },
      data: {
        verificationStatus: dto.verificationStatus,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
        verifiedById: user.sub || user.id,
        verifiedAt: new Date(),
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingCertificate',
      id,
      existing,
      updated,
    );

    return updated;
  }

  // Get qualifications expiring in the next N days
  async getExpiringCertificates(companyId: string, days = 60) {
    const now = new Date();
    const threshold = new Date();
    threshold.setDate(threshold.getDate() + days);

    return this.prisma.trainingCertificate.findMany({
      where: {
        companyId,
        expiryDate: {
          gte: now,
          lte: threshold,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeCode: true,
            email: true,
            department: true,
          },
        },
        plan: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }
}
