import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsIn,
  IsDateString,
} from 'class-validator';

export class CreateTrainingEvaluationDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsDateString()
  @IsOptional()
  evaluationDate?: string;

  @IsArray()
  @IsOptional()
  competenciesAchieved?: string[];

  @IsNumber()
  @IsOptional()
  trainingEffectivenessRating?: number; // 1 to 5

  @IsString()
  @IsOptional()
  businessImpact?: string;

  @IsString()
  @IsOptional()
  remainingGaps?: string;

  @IsString()
  @IsOptional()
  trainerFeedbackSummary?: string;

  @IsString()
  @IsNotEmpty()
  managerEvaluationNotes: string;

  @IsString()
  @IsOptional()
  employeeFeedbackSummary?: string;

  @IsString()
  @IsIn([
    'CONTINUE_CURRENT_ROLE',
    'AUTHORIZE_ADDITIONAL_DUTIES',
    'RECOMMEND_PROMOTION',
    'INITIATE_TRANSFER',
    'RECOMMEND_ROLE_CHANGE',
    'UPDATE_APPROVED_GRADE_DESIGNATION',
    'RECOMMEND_COMPENSATION_REVIEW',
    'ASSIGN_REMEDIAL_TRAINING',
    'DEFER_DECISION',
    'CLOSE_WITHOUT_CHANGE',
  ])
  recommendedOutcome: string;

  @IsString()
  @IsOptional()
  supportingEvidenceUrl?: string;
}

export class UpdateTrainingEvaluationDto {
  @IsArray()
  @IsOptional()
  competenciesAchieved?: string[];

  @IsNumber()
  @IsOptional()
  trainingEffectivenessRating?: number;

  @IsString()
  @IsOptional()
  businessImpact?: string;

  @IsString()
  @IsOptional()
  remainingGaps?: string;

  @IsString()
  @IsOptional()
  trainerFeedbackSummary?: string;

  @IsString()
  @IsOptional()
  managerEvaluationNotes?: string;

  @IsString()
  @IsOptional()
  employeeFeedbackSummary?: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'CONTINUE_CURRENT_ROLE',
    'AUTHORIZE_ADDITIONAL_DUTIES',
    'RECOMMEND_PROMOTION',
    'INITIATE_TRANSFER',
    'RECOMMEND_ROLE_CHANGE',
    'UPDATE_APPROVED_GRADE_DESIGNATION',
    'RECOMMEND_COMPENSATION_REVIEW',
    'ASSIGN_REMEDIAL_TRAINING',
    'DEFER_DECISION',
    'CLOSE_WITHOUT_CHANGE',
  ])
  recommendedOutcome?: string;

  @IsString()
  @IsOptional()
  actionStatus?: string;

  @IsString()
  @IsOptional()
  supportingEvidenceUrl?: string;
}
