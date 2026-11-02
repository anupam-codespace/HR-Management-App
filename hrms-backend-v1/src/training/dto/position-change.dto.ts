import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';

export class InitiatePositionChangeDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsOptional()
  trainingPlanId?: string;

  @IsString()
  @IsOptional()
  evaluationId?: string;

  @IsString()
  @IsIn([
    'PROMOTION',
    'TRANSFER',
    'REDESIGNATION',
    'ADDITIONAL_RESPONSIBILITY',
    'GRADE_CHANGE',
  ])
  changeType: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsString()
  @IsOptional()
  proposedDepartmentId?: string;

  @IsString()
  @IsOptional()
  proposedDesignationId?: string;

  @IsString()
  @IsOptional()
  proposedJobGrade?: string;

  @IsString()
  @IsOptional()
  proposedBranchId?: string;

  @IsDateString()
  @IsNotEmpty()
  proposedEffectiveDate: string;

  @IsString()
  @IsOptional()
  @IsIn(['NOT_REQUIRED', 'PENDING_REVIEW', 'APPROVED', 'REVISED'])
  compensationReviewStatus?: string;

  @IsNumber()
  @IsOptional()
  proposedSalaryIncrease?: number;

  @IsString()
  @IsOptional()
  decisionNotes?: string;
}

export class ReviewPositionChangeDto {
  @IsString()
  @IsIn(['APPROVE', 'REJECT', 'CHANGES_REQUESTED', 'DEFER'])
  decision: 'APPROVE' | 'REJECT' | 'CHANGES_REQUESTED' | 'DEFER';

  @IsString()
  @IsOptional()
  stage?: string; // DEPARTMENT_HEAD, HR_HEAD, FINANCE, SUPER_ADMIN

  @IsString()
  @IsOptional()
  comments?: string;
}

export class ApplyPositionChangeDto {
  @IsDateString()
  @IsOptional()
  effectiveDateOverride?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
