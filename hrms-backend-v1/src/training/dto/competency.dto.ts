import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateCompetencyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsOptional()
  category?: string; // Technical, Compliance, Clinical, Safety, Leadership, Operational, etc.

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  proficiencyScale?: string; // STANDARD

  @IsString()
  @IsOptional()
  assessmentMethod?: string; // PRACTICAL_DEMO, WRITTEN_EXAM, SUPERVISOR_EVAL, CERTIFICATE_VERIFICATION

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCompetencyDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  proficiencyScale?: string;

  @IsString()
  @IsOptional()
  assessmentMethod?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class SetJobPositionCompetencyDto {
  @IsString()
  @IsNotEmpty()
  designationId: string;

  @IsString()
  @IsNotEmpty()
  competencyId: string;

  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  requiredLevel: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;
}

export class AssessEmployeeCompetencyDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  competencyId: string;

  @IsString()
  @IsIn(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
  currentLevel: string;

  @IsString()
  @IsOptional()
  evidenceUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED'])
  verificationStatus?: string;

  @IsDateString()
  @IsOptional()
  nextReviewDate?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
