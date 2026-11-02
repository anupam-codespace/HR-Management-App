import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { TrainingSequenceService } from './training-sequence.service';
import { CreateTrainingProgramDto, UpdateTrainingProgramDto } from '../dto/program.dto';

@Injectable()
export class TrainingProgramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly sequenceService: TrainingSequenceService,
  ) {}

  async findAll(companyId: string, filters: { categoryId?: string; status?: string; search?: string }) {
    const where: any = { companyId };
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { programCode: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.trainingProgram.findMany({
      where,
      include: {
        category: true,
        competencies: {
          include: { competency: true },
        },
        _count: {
          select: {
            plans: true,
            sessions: true,
            materials: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const program = await this.prisma.trainingProgram.findFirst({
      where: { id, companyId },
      include: {
        category: true,
        competencies: {
          include: { competency: true },
        },
        materials: true,
        sessions: {
          orderBy: { startTime: 'desc' },
          take: 10,
        },
        plans: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!program) {
      throw new NotFoundException(`Training program with ID ${id} not found`);
    }
    return program;
  }

  async create(companyId: string, user: any, dto: CreateTrainingProgramDto) {
    const programCode = await this.sequenceService.getNextCode(
      companyId,
      'TRAINING_PROGRAM',
      'PRG',
    );

    const created = await this.prisma.trainingProgram.create({
      data: {
        companyId,
        programCode,
        title: dto.title.trim(),
        categoryId: dto.categoryId,
        description: dto.description?.trim(),
        objectives: dto.objectives?.trim(),
        prerequisites: dto.prerequisites?.trim(),
        deliveryMethod: dto.deliveryMethod || 'HYBRID',
        plannedHours: dto.plannedHours || 0,
        passingScore: dto.passingScore !== undefined ? dto.passingScore : 70.0,
        requiresAssessment: dto.requiresAssessment !== undefined ? dto.requiresAssessment : true,
        requiresCertificate: dto.requiresCertificate !== undefined ? dto.requiresCertificate : false,
        validityMonths: dto.validityMonths,
        targetAudience: dto.targetAudience?.trim(),
        materialsUrl: dto.materialsUrl,
        status: dto.status || 'PUBLISHED',
      },
      include: {
        category: true,
      },
    });

    // Link competencies if provided
    if (dto.competencies && dto.competencies.length > 0) {
      for (const comp of dto.competencies) {
        await this.prisma.trainingProgramCompetency.create({
          data: {
            programId: created.id,
            competencyId: comp.competencyId,
            targetLevel: comp.targetLevel || 'INTERMEDIATE',
          },
        });
      }
    }

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'CREATE',
      'TrainingProgram',
      created.id,
      null,
      created,
    );

    return this.findOne(companyId, created.id);
  }

  async update(companyId: string, id: string, user: any, dto: UpdateTrainingProgramDto) {
    const existing = await this.findOne(companyId, id);

    await this.prisma.trainingProgram.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title.trim() }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.objectives !== undefined && { objectives: dto.objectives?.trim() }),
        ...(dto.prerequisites !== undefined && { prerequisites: dto.prerequisites?.trim() }),
        ...(dto.deliveryMethod && { deliveryMethod: dto.deliveryMethod }),
        ...(dto.plannedHours !== undefined && { plannedHours: dto.plannedHours }),
        ...(dto.passingScore !== undefined && { passingScore: dto.passingScore }),
        ...(dto.requiresAssessment !== undefined && { requiresAssessment: dto.requiresAssessment }),
        ...(dto.requiresCertificate !== undefined && { requiresCertificate: dto.requiresCertificate }),
        ...(dto.validityMonths !== undefined && { validityMonths: dto.validityMonths }),
        ...(dto.targetAudience !== undefined && { targetAudience: dto.targetAudience?.trim() }),
        ...(dto.materialsUrl !== undefined && { materialsUrl: dto.materialsUrl }),
        ...(dto.status && { status: dto.status }),
      },
    });

    // Update competencies if provided
    if (dto.competencies) {
      await this.prisma.trainingProgramCompetency.deleteMany({
        where: { programId: id },
      });
      for (const comp of dto.competencies) {
        await this.prisma.trainingProgramCompetency.create({
          data: {
            programId: id,
            competencyId: comp.competencyId,
            targetLevel: comp.targetLevel || 'INTERMEDIATE',
          },
        });
      }
    }

    const updated = await this.findOne(companyId, id);

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingProgram',
      id,
      existing,
      updated,
    );

    return updated;
  }
}
