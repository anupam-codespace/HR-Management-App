import { Test, TestingModule } from '@nestjs/testing';
import { EmployeePositionChangeService } from '../services/employee-position-change.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { NotificationService } from '../../notification/notification.service';
import { TrainingSequenceService } from '../services/training-sequence.service';
import { BadRequestException } from '@nestjs/common';

describe('EmployeePositionChangeService', () => {
  let service: EmployeePositionChangeService;
  let prisma: any;
  let auditService: any;
  let notificationService: any;
  let sequenceService: any;

  const mockCompanyId = 'company-test-123';
  const mockUser = { sub: 'hr-head-1', companyId: mockCompanyId, role: 'HR_HEAD' };

  beforeEach(async () => {
    prisma = {
      employeePositionChange: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employee: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([{ id: 'hr-head-1' }]),
        update: jest.fn(),
      },
      designation: {
        findFirst: jest.fn(),
      },
      trainingEvaluation: {
        update: jest.fn(),
      },
      positionChangeApproval: {
        create: jest.fn(),
      },
      employmentHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (callback) => {
        return callback(prisma);
      }),
    };

    auditService = {
      logAction: jest.fn().mockResolvedValue(true),
    };

    notificationService = {
      sendInternalNotification: jest.fn().mockResolvedValue(true),
    };

    sequenceService = {
      getNextCode: jest.fn().mockResolvedValue('PC-2026-0001'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeePositionChangeService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationService, useValue: notificationService },
        { provide: TrainingSequenceService, useValue: sequenceService },
      ],
    }).compile();

    service = module.get<EmployeePositionChangeService>(
      EmployeePositionChangeService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiate', () => {
    it('should create a position change request and start approval chain', async () => {
      const mockEmployee = {
        id: 'emp-1',
        firstName: 'Sarah',
        lastName: 'Connor',
        companyId: mockCompanyId,
        designationId: 'desig-old',
        departmentId: 'dept-eng',
        department: { branchId: 'branch-1' },
      };

      prisma.employee.findFirst.mockResolvedValue(mockEmployee);
      prisma.designation.findFirst.mockResolvedValue({ id: 'desig-new', name: 'Lead Architect' });

      const mockCreated = {
        id: 'pc-1',
        changeNumber: 'PC-2026-0001',
        employeeId: 'emp-1',
        changeType: 'PROMOTION',
        status: 'PENDING_APPROVAL',
      };
      prisma.employeePositionChange.create.mockResolvedValue(mockCreated);
      prisma.employeePositionChange.findFirst.mockResolvedValue({
        ...mockCreated,
        employee: mockEmployee,
        approvals: [],
      });

      const result = await service.initiate(mockCompanyId, mockUser, {
        employeeId: 'emp-1',
        changeType: 'PROMOTION',
        reason: 'Completed Advanced System Architecture training successfully',
        proposedDesignationId: 'desig-new',
        proposedEffectiveDate: '2026-11-01',
      });

      expect(sequenceService.getNextCode).toHaveBeenCalledWith(
        mockCompanyId,
        'POSITION_CHANGE',
        'PC',
      );
      expect(prisma.positionChangeApproval.create).toHaveBeenCalled();
      expect(notificationService.sendInternalNotification).toHaveBeenCalled();
      expect(result.changeNumber).toBe('PC-2026-0001');
    });

    it('should throw error if proposed designation does not exist', async () => {
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1' });
      prisma.designation.findFirst.mockResolvedValue(null); // non-existent

      await expect(
        service.initiate(mockCompanyId, mockUser, {
          employeeId: 'emp-1',
          changeType: 'PROMOTION',
          reason: 'Promotion',
          proposedDesignationId: 'desig-invalid',
          proposedEffectiveDate: '2026-11-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('applyApprovedChange', () => {
    it('should apply approved change, update official employee designation and preserve employment history', async () => {
      const approvedChange = {
        id: 'pc-1',
        companyId: mockCompanyId,
        changeNumber: 'PC-2026-0001',
        employeeId: 'emp-1',
        changeType: 'PROMOTION',
        reason: 'Competency verified',
        status: 'APPROVED',
        proposedDesignationId: 'desig-new',
        proposedDepartmentId: 'dept-new',
        proposedEffectiveDate: new Date('2026-11-01'),
      };

      const employee = {
        id: 'emp-1',
        companyId: mockCompanyId,
        company: { name: 'GlobizHub HR' },
        designationId: 'desig-old',
        departmentId: 'dept-old',
        designation: { name: 'Associate Engineer' },
        joiningDate: new Date('2025-01-01'),
      };

      prisma.employeePositionChange.findFirst.mockResolvedValue(approvedChange);
      prisma.employee.findUnique.mockResolvedValue(employee);

      await service.applyApprovedChange(mockCompanyId, 'pc-1', mockUser);

      // Verify EmploymentHistory was created to preserve previous position
      expect(prisma.employmentHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeId: 'emp-1',
          companyName: 'GlobizHub HR',
          jobTitle: 'Associate Engineer',
        }),
      });

      // Verify official employee record was updated
      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-1' },
        data: {
          designationId: 'desig-new',
          departmentId: 'dept-new',
        },
      });

      // Verify status changed to APPLIED
      expect(prisma.employeePositionChange.update).toHaveBeenCalledWith({
        where: { id: 'pc-1' },
        data: expect.objectContaining({
          status: 'APPLIED',
        }),
      });

      expect(notificationService.sendInternalNotification).toHaveBeenCalled();
    });

    it('should reject applying a change that is still PENDING_APPROVAL', async () => {
      prisma.employeePositionChange.findFirst.mockResolvedValue({
        id: 'pc-pending',
        status: 'PENDING_APPROVAL',
      });

      await expect(
        service.applyApprovedChange(mockCompanyId, 'pc-pending', mockUser),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
