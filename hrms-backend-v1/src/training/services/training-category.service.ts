import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateTrainingCategoryDto, UpdateTrainingCategoryDto } from '../dto/category.dto';

@Injectable()
export class TrainingCategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(companyId: string, onlyActive = false) {
    const where: any = { companyId };
    if (onlyActive) where.isActive = true;

    return this.prisma.trainingCategory.findMany({
      where,
      include: {
        _count: {
          select: {
            programs: true,
            plans: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(companyId: string, id: string) {
    const category = await this.prisma.trainingCategory.findFirst({
      where: { id, companyId },
      include: {
        programs: true,
        plans: true,
      },
    });
    if (!category) {
      throw new NotFoundException(`Training category with ID ${id} not found`);
    }
    return category;
  }

  async create(companyId: string, user: any, dto: CreateTrainingCategoryDto) {
    const existing = await this.prisma.trainingCategory.findFirst({
      where: { companyId, code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Category code ${dto.code} already exists`);
    }

    const created = await this.prisma.trainingCategory.create({
      data: {
        companyId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        description: dto.description?.trim(),
        color: dto.color || '#6366F1',
        icon: dto.icon || 'BookOpen',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'CREATE',
      'TrainingCategory',
      created.id,
      null,
      created,
    );

    return created;
  }

  async update(companyId: string, id: string, user: any, dto: UpdateTrainingCategoryDto) {
    const existing = await this.findOne(companyId, id);

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const codeCheck = await this.prisma.trainingCategory.findFirst({
        where: {
          companyId,
          code: dto.code.trim().toUpperCase(),
          NOT: { id },
        },
      });
      if (codeCheck) {
        throw new ConflictException(`Category code ${dto.code} already exists`);
      }
    }

    const updated = await this.prisma.trainingCategory.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.color && { color: dto.color }),
        ...(dto.icon && { icon: dto.icon }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'TrainingCategory',
      updated.id,
      existing,
      updated,
    );

    return updated;
  }

  async seedDefaultCategories(companyId: string, user: any) {
    const defaultCategories = [
      { name: 'Compliance & Regulatory', code: 'CAT-COMP', color: '#EF4444', icon: 'ShieldAlert', description: 'Statutory compliance, safety guidelines, and industry legal requirements' },
      { name: 'Technical & Engineering', code: 'CAT-TECH', color: '#3B82F6', icon: 'Cpu', description: 'Software engineering, equipment operation, architecture, and technology stack' },
      { name: 'Quality & Process Excellence', code: 'CAT-QUAL', color: '#10B981', icon: 'CheckCircle', description: 'Quality assurance, ISO/standards adherence, and continuous improvement' },
      { name: 'Leadership & Management', code: 'CAT-LEAD', color: '#8B5CF6', icon: 'Award', description: 'Executive leadership, people management, and strategic decision making' },
      { name: 'Safety & Emergency Procedures', code: 'CAT-SAFE', color: '#F59E0B', icon: 'AlertTriangle', description: 'Workplace health, safety drills, emergency evacuation, and hazard mitigation' },
      { name: 'Customer & Operational Excellence', code: 'CAT-OPS', color: '#EC4899', icon: 'Users', description: 'Client communication, service delivery, logistics, and frontline operations' },
    ];

    const results: any[] = [];
    for (const cat of defaultCategories) {
      const exists = await this.prisma.trainingCategory.findFirst({
        where: { companyId, code: cat.code },
      });
      if (!exists) {
        const item = await this.prisma.trainingCategory.create({
          data: {
            companyId,
            ...cat,
          },
        });
        results.push(item);
      }
    }

    if (results.length > 0) {
      this.auditService.logAction(
        companyId,
        user.sub || user.id,
        'CREATE',
        'TrainingCategory',
        'BULK_SEED',
        null,
        { count: results.length },
      );
    }

    return results;
  }
}
