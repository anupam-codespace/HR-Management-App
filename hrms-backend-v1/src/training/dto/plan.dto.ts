import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsArray,
  IsIn,
} from 'class-validator';

export class CreateTrainingPlanDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  programId?: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'INDIVIDUAL',
    'GROUP',
    'DEPARTMENTAL',
    'COMPLIANCE',
    'ONBOARDING',
    'CAREER_PROMOTION',
    'SKILL_GAP',
  ])
  trainingType?: string;

  @IsString()
  @IsOptional()
  businessJustification?: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'SKILL_GAP',
    'PERFORMANCE_REVIEW',
    'PROMOTION_REQUIREMENT',
    'NEW_RESPONSIBILITY',
    'NEW_TECHNOLOGY',
    'COMPLIANCE_REQUIREMENT',
    'DEPARTMENTAL_NEED',
    'CAREER_DEVELOPMENT',
  ])
  reason?: string;

  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  priority?: string;

  @IsString()
  @IsOptional()
  requestingEmployeeId?: string;

  @IsString()
  @IsOptional()
  requestingDepartmentId?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ONLINE', 'CLASSROOM', 'ON_THE_JOB', 'HYBRID', 'EXTERNAL'])
  deliveryMethod?: string;

  @IsString()
  @IsOptional()
  @IsIn(['INTERNAL', 'EXTERNAL'])
  providerType?: string;

  @IsString()
  @IsOptional()
  providerName?: string;

  @IsString()
  @IsOptional()
  trainerName?: string;

  @IsString()
  @IsOptional()
  trainerEmployeeId?: string;

  @IsString()
  @IsOptional()
  venueOrLink?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  plannedHours?: number;

  @IsNumber()
  @IsOptional()
  totalBudget?: number;

  @IsNumber()
  @IsOptional()
  estimatedTravelCost?: number;

  @IsNumber()
  @IsOptional()
  estimatedRegistrationCost?: number;

  @IsNumber()
  @IsOptional()
  estimatedAccommodationCost?: number;

  @IsNumber()
  @IsOptional()
  estimatedMaterialCost?: number;

  @IsString()
  @IsOptional()
  targetDesignationId?: string;

  @IsString()
  @IsOptional()
  targetDepartmentId?: string;

  @IsDateString()
  @IsOptional()
  proposedEffectiveDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  // Selected employee IDs to enroll
  @IsArray()
  @IsOptional()
  employeeIds?: string[];
}

export class UpdateTrainingPlanDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  programId?: string;

  @IsString()
  @IsOptional()
  trainingType?: string;

  @IsString()
  @IsOptional()
  businessJustification?: string;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  priority?: string;

  @IsString()
  @IsOptional()
  requestingDepartmentId?: string;

  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  @IsString()
  @IsOptional()
  providerType?: string;

  @IsString()
  @IsOptional()
  providerName?: string;

  @IsString()
  @IsOptional()
  trainerName?: string;

  @IsString()
  @IsOptional()
  trainerEmployeeId?: string;

  @IsString()
  @IsOptional()
  venueOrLink?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  plannedHours?: number;

  @IsNumber()
  @IsOptional()
  totalBudget?: number;

  @IsNumber()
  @IsOptional()
  estimatedTravelCost?: number;

  @IsNumber()
  @IsOptional()
  estimatedRegistrationCost?: number;

  @IsNumber()
  @IsOptional()
  estimatedAccommodationCost?: number;

  @IsNumber()
  @IsOptional()
  estimatedMaterialCost?: number;

  @IsString()
  @IsOptional()
  targetDesignationId?: string;

  @IsString()
  @IsOptional()
  targetDepartmentId?: string;

  @IsDateString()
  @IsOptional()
  proposedEffectiveDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  employeeIds?: string[];
}

export class ReviewTrainingPlanDto {
  @IsString()
  @IsIn(['APPROVE', 'REJECT', 'CHANGES_REQUESTED'])
  decision: 'APPROVE' | 'REJECT' | 'CHANGES_REQUESTED';

  @IsString()
  @IsOptional()
  comments?: string;
}
