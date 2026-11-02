import { Test, TestingModule } from '@nestjs/testing';
import { CompetencyService } from '../services/competency.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';

describe('CompetencyService', () => {
  let service: CompetencyService;
  let prisma: any;
  let auditService: any;

  const mockCompanyId = 'comp-test-123';
  const mockUser = { sub: 'admin-1', companyId: mockCompanyId, role: 'HR_HEAD' };

  beforeEach(async () => {
    prisma = {
      competency: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      jobPositionCompetency: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      employeeCompetency: {
        findMany: jest.fn(),
        upsert: jest.fn(),
      },
      employee: {
        findFirst: jest.fn(),
      },
      designation: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
      trainingProgramCompetency: {
        findMany: jest.fn(),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompetencyService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<CompetencyService>(CompetencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('analyzeSkillGap', () => {
    it('should correctly calculate skill gap percentage and identify missing requirements', async () => {
      const mockEmployee = {
        id: 'emp-101',
        firstName: 'John',
        lastName: 'Doe',
        employeeCode: 'EMP-001',
        designationId: 'desig-junior',
        designation: { id: 'desig-junior', name: 'Junior Nurse / Engineer' },
      };

      const mockTargetDesignation = {
        id: 'desig-senior',
        name: 'Senior Nurse / Tech Lead',
      };

      // Requirements for target role: Comp A (EXPERT, mandatory), Comp B (ADVANCED, non-mandatory)
      const mockRequirements = [
        {
          competencyId: 'comp-A',
          requiredLevel: 'EXPERT', // rank 4
          isMandatory: true, // weight 2 -> weight*rank = 8
          competency: { id: 'comp-A', name: 'Clinical Critical Care', code: 'COMP-A', category: 'Clinical' },
        },
        {
          competencyId: 'comp-B',
          requiredLevel: 'ADVANCED', // rank 3
          isMandatory: false, // weight 1 -> weight*rank = 3
          competency: { id: 'comp-B', name: 'Medication Administration', code: 'COMP-B', category: 'Clinical' },
        },
      ];

      // Employee has Comp A at INTERMEDIATE (rank 2), and Comp B is missing (rank 0)
      const mockCurrentCompetencies = [
        {
          competencyId: 'comp-A',
          currentLevel: 'INTERMEDIATE', // rank 2 -> achieved = weight 2 * 2 = 4
          competency: { id: 'comp-A', name: 'Clinical Critical Care' },
        },
      ];

      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.designation.findUnique.mockResolvedValue(mockTargetDesignation);
      prisma.jobPositionCompetency.findMany.mockResolvedValue(mockRequirements);
      prisma.employeeCompetency.findMany.mockResolvedValue(mockCurrentCompetencies);
      prisma.trainingProgramCompetency.findMany.mockResolvedValue([
        {
          programId: 'prog-1',
          competencyId: 'comp-A',
          program: { id: 'prog-1', title: 'Critical Care Mastery', companyId: mockCompanyId, status: 'PUBLISHED' },
          competency: { name: 'Clinical Critical Care' },
        },
      ]);

      const result = await service.analyzeSkillGap(
        mockCompanyId,
        'emp-101',
        'desig-senior',
      );

      expect(result.employee.name).toBe('John Doe');
      expect(result.targetDesignation).toBe('Senior Nurse / Tech Lead');
      expect(result.totalRequirements).toBe(2);
      expect(result.gapCount).toBe(2);
      expect(result.mandatoryGapsCount).toBe(1);
      // Total required = 2*4 + 1*3 = 11. Achieved = 2*2 + 0 = 4. 4/11 = ~36%
      expect(result.readinessPercentage).toBe(36);
      expect(result.recommendedPrograms.length).toBe(1);
    });
  });
});
