import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProgramCompetencyInput {
  @IsString()
  @IsNotEmpty()
  competencyId: string;

  @IsString()
  @IsOptional()
  targetLevel?: string;
}

export class CreateTrainingProgramDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  objectives?: string;

  @IsString()
  @IsOptional()
  prerequisites?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ONLINE', 'CLASSROOM', 'ON_THE_JOB', 'HYBRID', 'EXTERNAL'])
  deliveryMethod?: string;

  @IsNumber()
  @IsOptional()
  plannedHours?: number;

  @IsNumber()
  @IsOptional()
  passingScore?: number;

  @IsBoolean()
  @IsOptional()
  requiresAssessment?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresCertificate?: boolean;

  @IsNumber()
  @IsOptional()
  validityMonths?: number;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  materialsUrl?: string;

  @IsString()
  @IsOptional()
  @IsIn(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProgramCompetencyInput)
  competencies?: ProgramCompetencyInput[];
}

export class UpdateTrainingProgramDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  objectives?: string;

  @IsString()
  @IsOptional()
  prerequisites?: string;

  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  @IsNumber()
  @IsOptional()
  plannedHours?: number;

  @IsNumber()
  @IsOptional()
  passingScore?: number;

  @IsBoolean()
  @IsOptional()
  requiresAssessment?: boolean;

  @IsBoolean()
  @IsOptional()
  requiresCertificate?: boolean;

  @IsNumber()
  @IsOptional()
  validityMonths?: number;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  materialsUrl?: string;

  @IsString()
  @IsOptional()
  status?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ProgramCompetencyInput)
  competencies?: ProgramCompetencyInput[];
}
