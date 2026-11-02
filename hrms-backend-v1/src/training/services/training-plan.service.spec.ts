import { Test, TestingModule } from '@nestjs/testing';
import { TrainingPlanService } from '../services/training-plan.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notification/notification.service';
import { TrainingSequenceService } from '../services/training-sequence.service';
import { BadRequestException } from '@nestjs/common';

describe('TrainingPlanService', () => {
  let service: TrainingPlanService;
  let prisma: any;
  let auditService: any;
  let notificationService: any;
  let sequenceService: any;

  const mockCompanyId = 'company-test-123';
  const mockUser = {
    sub: 'emp-admin-1',
    companyId: mockCompanyId,
    role: 'HR_HEAD',
  };

  beforeEach(async () => {
    prisma = {
      trainingPlan: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      trainingEnrollment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      trainingApproval: {
        create: jest.fn(),
      },
      employee: {
        findMany: jest.fn().mockResolvedValue([{ id: 'admin-1' }]),
      },
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    notificationService = {
      sendInternalNotification: jest.fn().mockResolvedValue(true),
    };

    sequenceService = {
      getNextCode: jest.fn().mockResolvedValue('TRN-2026-0001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TrainingPlanService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationService, useValue: notificationService },
        { provide: TrainingSequenceService, useValue: sequenceService },
      ],
    }).compile();

    service = module.get<TrainingPlanService>(TrainingPlanService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a training plan with sequential code and enroll specified employees', async () => {
      const mockCreatedPlan = {
        id: 'plan-1',
        companyId: mockCompanyId,
        planNumber: 'TRN-2026-0001',
        title: 'Advanced Cleanroom Protocols',
        trainingType: 'GROUP',
        status: 'DRAFT',
      };

      prisma.trainingPlan.create.mockResolvedValue(mockCreatedPlan);
      prisma.trainingPlan.findFirst.mockResolvedValue({
        ...mockCreatedPlan,
        enrollments: [],
        sessions: [],
        approvals: [],
      });

      const result = await service.create(mockCompanyId, mockUser, {
        title: 'Advanced Cleanroom Protocols',
        trainingType: 'GROUP',
        reason: 'COMPLIANCE_REQUIREMENT',
        priority: 'HIGH',
        employeeIds: ['emp-1', 'emp-2'],
      });

      expect(sequenceService.getNextCode).toHaveBeenCalledWith(
        mockCompanyId,
        'TRAINING_PLAN',
        'TRN',
      );
      expect(prisma.trainingPlan.create).toHaveBeenCalled();
      expect(prisma.trainingEnrollment.create).toHaveBeenCalledTimes(2);
      expect(auditService.logAction).toHaveBeenCalled();
      expect(result.planNumber).toBe('TRN-2026-0001');
    });
  });

  describe('submitForApproval and review', () => {
    it('should submit DRAFT plan and transition to PENDING_APPROVAL', async () => {
      const existingPlan = {
        id: 'plan-1',
        companyId: mockCompanyId,
        planNumber: 'TRN-2026-0001',
        title: 'Cybersecurity Hygiene',
        status: 'DRAFT',
      };
      prisma.trainingPlan.findFirst.mockResolvedValue(existingPlan);
      prisma.trainingPlan.update.mockResolvedValue({
        ...existingPlan,
        status: 'PENDING_APPROVAL',
      });

      const res = await service.submitForApproval(mockCompanyId, 'plan-1', mockUser);

      expect(res.status).toBe('PENDING_APPROVAL');
      expect(prisma.trainingApproval.create).toHaveBeenCalled();
      expect(notificationService.sendInternalNotification).toHaveBeenCalled();
    });

    it('should throw error when submitting non-DRAFT plan', async () => {
      prisma.trainingPlan.findFirst.mockResolvedValue({
        id: 'plan-1',
        status: 'APPROVED',
      });

      await expect(
        service.submitForApproval(mockCompanyId, 'plan-1', mockUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should approve plan and notify requester', async () => {
      const pendingPlan = {
        id: 'plan-1',
        companyId: mockCompanyId,
        title: 'Leadership Essentials',
        planNumber: 'TRN-2026-0002',
        requestingEmployeeId: 'emp-req-1',
        status: 'PENDING_APPROVAL',
      };
      prisma.trainingPlan.findFirst.mockResolvedValue(pendingPlan);
      prisma.trainingPlan.update.mockResolvedValue({
        ...pendingPlan,
        status: 'APPROVED',
      });

      const res = await service.review(mockCompanyId, 'plan-1', mockUser, {
        decision: 'APPROVE',
        comments: 'Budget authorized.',
      });

      expect(res.status).toBe('APPROVED');
      expect(prisma.trainingApproval.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'APPROVE',
          comments: 'Budget authorized.',
        }),
      });
      expect(notificationService.sendInternalNotification).toHaveBeenCalledWith(
        mockCompanyId,
        'emp-req-1',
        expect.stringContaining('APPROVED'),
        expect.any(String),
        'SYSTEM',
      );
    });
  });

  describe('updateStatus', () => {
    it('should mark enrolled employees as COMPLETED when plan is completed', async () => {
      const plan = {
        id: 'plan-1',
        companyId: mockCompanyId,
        title: 'Emergency Life Support',
        status: 'IN_PROGRESS',
      };
      prisma.trainingPlan.findFirst.mockResolvedValue(plan);
      prisma.trainingPlan.update.mockResolvedValue({
        ...plan,
        status: 'COMPLETED',
      });
      prisma.trainingEnrollment.findMany.mockResolvedValue([
        { employeeId: 'emp-1' },
      ]);

      const res = await service.updateStatus(
        mockCompanyId,
        'plan-1',
        mockUser,
        'COMPLETED',
      );

      expect(res.status).toBe('COMPLETED');
      expect(prisma.trainingEnrollment.updateMany).toHaveBeenCalledWith({
        where: { planId: 'plan-1', status: { in: ['ENROLLED', 'IN_PROGRESS'] } },
        data: expect.objectContaining({ status: 'COMPLETED', completionPercentage: 100 }),
      });
      expect(notificationService.sendInternalNotification).toHaveBeenCalled();
    });
  });
});
