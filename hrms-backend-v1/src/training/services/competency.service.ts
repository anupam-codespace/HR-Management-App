import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import {
  CreateCompetencyDto,
  UpdateCompetencyDto,
  SetJobPositionCompetencyDto,
  AssessEmployeeCompetencyDto,
} from '../dto/competency.dto';

const PROFICIENCY_RANK: Record<string, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
  EXPERT: 4,
};

@Injectable()
export class CompetencyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // 1. Competency Catalog
  async findAllCompetencies(companyId: string, category?: string) {
    const where: any = { companyId };
    if (category) where.category = category;

    return this.prisma.competency.findMany({
      where,
      include: {
        _count: {
          select: {
            jobPositionRequirements: true,
            employeeCompetencies: true,
            programCompetencies: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneCompetency(companyId: string, id: string) {
    const competency = await this.prisma.competency.findFirst({
      where: { id, companyId },
      include: {
        jobPositionRequirements: {
          include: { designation: true },
        },
        programCompetencies: {
          include: { program: true },
        },
      },
    });
    if (!competency) {
      throw new NotFoundException(`Competency with ID ${id} not found`);
    }
    return competency;
  }

  async createCompetency(companyId: string, user: any, dto: CreateCompetencyDto) {
    const existing = await this.prisma.competency.findFirst({
      where: { companyId, code: dto.code.trim().toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(`Competency code ${dto.code} already exists`);
    }

    const created = await this.prisma.competency.create({
      data: {
        companyId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        category: dto.category?.trim() || 'Technical',
        description: dto.description?.trim(),
        proficiencyScale: dto.proficiencyScale || 'STANDARD',
        assessmentMethod: dto.assessmentMethod || 'PRACTICAL_DEMO',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'CREATE',
      'Competency',
      created.id,
      null,
      created,
    );

    return created;
  }

  async updateCompetency(companyId: string, id: string, user: any, dto: UpdateCompetencyDto) {
    const existing = await this.findOneCompetency(companyId, id);

    if (dto.code && dto.code.trim().toUpperCase() !== existing.code) {
      const codeCheck = await this.prisma.competency.findFirst({
        where: {
          companyId,
          code: dto.code.trim().toUpperCase(),
          NOT: { id },
        },
      });
      if (codeCheck) {
        throw new ConflictException(`Competency code ${dto.code} already exists`);
      }
    }

    const updated = await this.prisma.competency.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name.trim() }),
        ...(dto.code && { code: dto.code.trim().toUpperCase() }),
        ...(dto.category && { category: dto.category.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() }),
        ...(dto.proficiencyScale && { proficiencyScale: dto.proficiencyScale }),
        ...(dto.assessmentMethod && { assessmentMethod: dto.assessmentMethod }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'Competency',
      updated.id,
      existing,
      updated,
    );

    return updated;
  }

  // 2. Designation / Job Position Competency Matrix
  async getDesignationCompetencies(companyId: string, designationId: string) {
    return this.prisma.jobPositionCompetency.findMany({
      where: { companyId, designationId },
      include: {
        competency: true,
        designation: true,
      },
      orderBy: { isMandatory: 'desc' },
    });
  }

  async setJobPositionCompetency(companyId: string, user: any, dto: SetJobPositionCompetencyDto) {
    // Validate designation exists
    const designation = await this.prisma.designation.findFirst({
      where: { id: dto.designationId, companyId },
    });
    if (!designation) {
      throw new NotFoundException(`Designation not found in company`);
    }

    // Validate competency exists
    const competency = await this.prisma.competency.findFirst({
      where: { id: dto.competencyId, companyId },
    });
    if (!competency) {
      throw new NotFoundException(`Competency not found in company`);
    }

    const record = await this.prisma.jobPositionCompetency.upsert({
      where: {
        designationId_competencyId: {
          designationId: dto.designationId,
          competencyId: dto.competencyId,
        },
      },
      create: {
        companyId,
        designationId: dto.designationId,
        competencyId: dto.competencyId,
        requiredLevel: dto.requiredLevel,
        isMandatory: dto.isMandatory !== undefined ? dto.isMandatory : true,
      },
      update: {
        requiredLevel: dto.requiredLevel,
        isMandatory: dto.isMandatory !== undefined ? dto.isMandatory : true,
      },
      include: {
        competency: true,
        designation: true,
      },
    });

    this.auditService.logAction(
      companyId,
      user.sub || user.id,
      'UPDATE',
      'JobPositionCompetency',
      record.id,
      null,
      record,
    );

    return record;
  }

  async removeJobPositionCompetency(companyId: string, designationId: string, competencyId: string) {
    return this.prisma.jobPositionCompetency.deleteMany({
      where: { companyId, designationId, competencyId },
    });
  }

  // 3. Employee Competency Assessments
  async getEmployeeCompetencies(companyId: string, employeeId: string) {
    return this.prisma.employeeCompetency.findMany({
      where: { companyId, employeeId },
      include: {
        competency: true,
        assessedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async assessEmployeeCompetency(companyId: string, user: any, dto: AssessEmployeeCompetencyDto) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.employeeId, companyId },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found in company');
    }

    const competency = await this.prisma.competency.findFirst({
      where: { id: dto.competencyId, companyId },
    });
    if (!competency) {
      throw new NotFoundException('Competency not found in company');
    }

    const assessedById = user.sub || user.id;

    const record = await this.prisma.employeeCompetency.upsert({
      where: {
        employeeId_competencyId: {
          employeeId: dto.employeeId,
          competencyId: dto.competencyId,
        },
      },
      create: {
        companyId,
        employeeId: dto.employeeId,
        competencyId: dto.competencyId,
        currentLevel: dto.currentLevel,
        assessedById,
        assessmentDate: new Date(),
        nextReviewDate: dto.nextReviewDate ? new Date(dto.nextReviewDate) : null,
        evidenceUrl: dto.evidenceUrl,
        verificationStatus: dto.verificationStatus || 'VERIFIED',
        notes: dto.notes,
      },
      update: {
        currentLevel: dto.currentLevel,
        assessedById,
        assessmentDate: new Date(),
        nextReviewDate: dto.nextReviewDate ? new Date(dto.nextReviewDate) : null,
        evidenceUrl: dto.evidenceUrl !== undefined ? dto.evidenceUrl : undefined,
        verificationStatus: dto.verificationStatus || 'VERIFIED',
        notes: dto.notes !== undefined ? dto.notes : undefined,
      },
      include: {
        competency: true,
      },
    });

    this.auditService.logAction(
      companyId,
      assessedById,
      'UPDATE',
      'EmployeeCompetency',
      record.id,
      null,
      record,
    );

    return record;
  }

  // 4. Industry-Independent Skill Gap Analysis Engine
  async analyzeSkillGap(
    companyId: string,
    employeeId: string,
    targetDesignationId?: string,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
      include: {
        designation: true,
        department: true,
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    // Target designation defaults to targetDesignationId or employee's current designation
    const designationId = targetDesignationId || employee.designationId;
    if (!designationId) {
      return {
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          code: employee.employeeCode,
          designation: employee.designation?.name || 'Unassigned',
        },
        targetDesignation: null,
        gapScore: 0,
        summary: 'No designation requirements configured for comparison',
        gaps: [],
        matches: [],
        recommendedPrograms: [],
      };
    }

    const designation = await this.prisma.designation.findUnique({
      where: { id: designationId },
    });

    // Get requirements for this designation
    const requirements = await this.prisma.jobPositionCompetency.findMany({
      where: { companyId, designationId },
      include: { competency: true },
    });

    if (requirements.length === 0) {
      return {
        employee: {
          id: employee.id,
          name: `${employee.firstName} ${employee.lastName}`,
          code: employee.employeeCode,
          currentDesignation: employee.designation?.name || 'Unassigned',
        },
        targetDesignation: designation?.name || 'Unassigned',
        targetDesignationId: designation?.id,
        isTargetRole: targetDesignationId && targetDesignationId !== employee.designationId,
        readinessPercentage: null,
        hasRequirements: false,
        totalRequirements: 0,
        gapCount: 0,
        mandatoryGapsCount: 0,
        gaps: [],
        matches: [],
        recommendedPrograms: [],
        summary: `No competency requirements configured for ${designation?.name || 'this designation'} yet in the Role Matrix.`,
      };
    }

    // Get employee's current competencies
    const currentCompetencies = await this.prisma.employeeCompetency.findMany({
      where: { companyId, employeeId },
      include: { competency: true },
    });

    const currentMap = new Map<string, string>();
    for (const ec of currentCompetencies) {
      currentMap.set(ec.competencyId, ec.currentLevel);
    }

    const gaps: any[] = [];
    const matches: any[] = [];
    let totalRequiredWeight = 0;
    let totalAchievedWeight = 0;

    for (const req of requirements) {
      const requiredRank = PROFICIENCY_RANK[req.requiredLevel] || 2;
      const currentLevel = currentMap.get(req.competencyId);
      const currentRank = currentLevel ? PROFICIENCY_RANK[currentLevel] || 0 : 0;
      const weight = req.isMandatory ? 2 : 1;

      totalRequiredWeight += weight * requiredRank;
      totalAchievedWeight += weight * Math.min(currentRank, requiredRank);

      if (currentRank < requiredRank) {
        gaps.push({
          competencyId: req.competencyId,
          competencyName: req.competency.name,
          competencyCode: req.competency.code,
          category: req.competency.category,
          requiredLevel: req.requiredLevel,
          currentLevel: currentLevel || 'NONE',
          isMandatory: req.isMandatory,
          gapDepth: requiredRank - currentRank,
        });
      } else {
        matches.push({
          competencyId: req.competencyId,
          competencyName: req.competency.name,
          competencyCode: req.competency.code,
          category: req.competency.category,
          requiredLevel: req.requiredLevel,
          currentLevel,
          isMandatory: req.isMandatory,
        });
      }
    }

    const readinessPercentage =
      totalRequiredWeight > 0
        ? Math.round((totalAchievedWeight / totalRequiredWeight) * 100)
        : 0;

    // Recommend training programs matching gap competencies
    const gapCompetencyIds = gaps.map((g) => g.competencyId);
    let recommendedPrograms: any[] = [];
    if (gapCompetencyIds.length > 0) {
      const programCompetencies = await this.prisma.trainingProgramCompetency.findMany({
        where: {
          competencyId: { in: gapCompetencyIds },
          program: { companyId, status: 'PUBLISHED' },
        },
        include: {
          program: {
            include: { category: true },
          },
          competency: true,
        },
      });

      const progMap = new Map<string, any>();
      for (const pc of programCompetencies) {
        if (!progMap.has(pc.programId)) {
          progMap.set(pc.programId, {
            ...pc.program,
            addressesCompetencies: [pc.competency.name],
          });
        } else {
          progMap.get(pc.programId).addressesCompetencies.push(pc.competency.name);
        }
      }
      recommendedPrograms = Array.from(progMap.values());
    }

    return {
      employee: {
        id: employee.id,
        name: `${employee.firstName} ${employee.lastName}`,
        code: employee.employeeCode,
        currentDesignation: employee.designation?.name || 'Unassigned',
      },
      targetDesignation: designation?.name || 'Unassigned',
      targetDesignationId: designation?.id,
      isTargetRole: targetDesignationId && targetDesignationId !== employee.designationId,
      readinessPercentage,
      hasRequirements: true,
      totalRequirements: requirements.length,
      gapCount: gaps.length,
      mandatoryGapsCount: gaps.filter((g) => g.isMandatory).length,
      gaps,
      matches,
      recommendedPrograms,
    };
  }

  async seedDefaultCompetencies(companyId: string, user: any) {
    const defaults = [
      { name: 'Data Security & Privacy (GDPR/HIPAA)', code: 'COMP-SEC-01', category: 'Compliance', proficiencyScale: 'STANDARD', assessmentMethod: 'WRITTEN_EXAM' },
      { name: 'Standard Operating Procedures & Quality Audit', code: 'COMP-QA-01', category: 'Quality', proficiencyScale: 'STANDARD', assessmentMethod: 'SUPERVISOR_EVAL' },
      { name: 'Workplace Safety & Hazard Protocol', code: 'COMP-SAFE-01', category: 'Safety', proficiencyScale: 'STANDARD', assessmentMethod: 'PRACTICAL_DEMO' },
      { name: 'Problem Solving & Critical Thinking', code: 'COMP-LEAD-01', category: 'Leadership', proficiencyScale: 'STANDARD', assessmentMethod: 'SUPERVISOR_EVAL' },
      { name: 'System Architecture & Engineering Standards', code: 'COMP-ENG-01', category: 'Technical', proficiencyScale: 'STANDARD', assessmentMethod: 'PRACTICAL_DEMO' },
      { name: 'Customer Communication & Incident Management', code: 'COMP-OPS-01', category: 'Operational', proficiencyScale: 'STANDARD', assessmentMethod: 'SUPERVISOR_EVAL' },
    ];

    const results: any[] = [];
    for (const d of defaults) {
      const exists = await this.prisma.competency.findFirst({
        where: { companyId, code: d.code },
      });
      if (!exists) {
        const item = await this.prisma.competency.create({
          data: {
            companyId,
            ...d,
          },
        });
        results.push(item);
      }
    }

    // Automatically seed role matrix as well
    await this.seedDefaultMatrix(companyId);

    return results;
  }

  async seedDefaultMatrix(companyId: string) {
    const designations = await this.prisma.designation.findMany({
      where: { companyId },
    });
    if (designations.length === 0) return { message: 'No designations found to map' };

    const competencies = await this.prisma.competency.findMany({
      where: { companyId },
    });
    if (competencies.length === 0) return { message: 'No competencies found to map' };

    const compMap = new Map<string, string>();
    for (const c of competencies) {
      compMap.set(c.code, c.id);
    }

    const engId = compMap.get('COMP-ENG-01');
    const secId = compMap.get('COMP-SEC-01');
    const leadId = compMap.get('COMP-LEAD-01');
    const qaId = compMap.get('COMP-QA-01');
    const opsId = compMap.get('COMP-OPS-01');

    const created: any[] = [];

    for (const desig of designations) {
      const dName = desig.name.toLowerCase();
      const toAdd: { compId?: string; level: string; mandatory: boolean }[] = [];

      if (dName.includes('intern') || dName.includes('trainee')) {
        toAdd.push({ compId: secId, level: 'BEGINNER', mandatory: true });
        toAdd.push({ compId: engId, level: 'BEGINNER', mandatory: false });
      } else if (dName.includes('junior')) {
        toAdd.push({ compId: engId, level: 'INTERMEDIATE', mandatory: true });
        toAdd.push({ compId: secId, level: 'BEGINNER', mandatory: true });
        toAdd.push({ compId: leadId, level: 'BEGINNER', mandatory: false });
      } else if (dName.includes('senior')) {
        toAdd.push({ compId: engId, level: 'ADVANCED', mandatory: true });
        toAdd.push({ compId: secId, level: 'ADVANCED', mandatory: true });
        toAdd.push({ compId: leadId, level: 'INTERMEDIATE', mandatory: true });
        toAdd.push({ compId: qaId, level: 'INTERMEDIATE', mandatory: false });
      } else if (dName.includes('lead') || dName.includes('principal') || dName.includes('staff')) {
        toAdd.push({ compId: engId, level: 'EXPERT', mandatory: true });
        toAdd.push({ compId: leadId, level: 'ADVANCED', mandatory: true });
        toAdd.push({ compId: qaId, level: 'ADVANCED', mandatory: true });
        toAdd.push({ compId: opsId, level: 'INTERMEDIATE', mandatory: false });
      } else if (dName.includes('manager') || dName.includes('head')) {
        toAdd.push({ compId: leadId, level: 'EXPERT', mandatory: true });
        toAdd.push({ compId: opsId, level: 'ADVANCED', mandatory: true });
        toAdd.push({ compId: qaId, level: 'ADVANCED', mandatory: true });
      } else if (dName.includes('director') || dName.includes('vp')) {
        toAdd.push({ compId: leadId, level: 'EXPERT', mandatory: true });
        toAdd.push({ compId: opsId, level: 'EXPERT', mandatory: true });
        toAdd.push({ compId: qaId, level: 'EXPERT', mandatory: true });
      } else {
        // Standard developer / staff role
        toAdd.push({ compId: engId, level: 'INTERMEDIATE', mandatory: true });
        toAdd.push({ compId: secId, level: 'INTERMEDIATE', mandatory: true });
        toAdd.push({ compId: qaId, level: 'BEGINNER', mandatory: false });
      }

      for (const item of toAdd) {
        if (!item.compId) continue;
        const exists = await this.prisma.jobPositionCompetency.findUnique({
          where: {
            designationId_competencyId: {
              designationId: desig.id,
              competencyId: item.compId,
            },
          },
        });
        if (!exists) {
          const rec = await this.prisma.jobPositionCompetency.create({
            data: {
              companyId,
              designationId: desig.id,
              competencyId: item.compId,
              requiredLevel: item.level,
              isMandatory: item.mandatory,
            },
          });
          created.push(rec);
        }
      }
    }

    return {
      message: `Seeded default designation competency requirements across roles`,
      count: created.length,
    };
  }
}
