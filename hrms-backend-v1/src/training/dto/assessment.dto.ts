import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateAssessmentDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  @IsIn([
    'PRACTICAL',
    'WRITTEN_EXAM',
    'QUIZ',
    'SUPERVISOR_EVAL',
    'TRAINER_EVAL',
    'COMPETENCY_DEMO',
    'EXTERNAL_VERIFICATION',
  ])
  assessmentType?: string;

  @IsNumber()
  @IsOptional()
  passingScore?: number;

  @IsNumber()
  @IsOptional()
  maxScore?: number;

  @IsNumber()
  @IsOptional()
  scoreAchieved?: number;

  @IsString()
  @IsOptional()
  @IsIn(['PENDING', 'PASSED', 'FAILED', 'WAIVED'])
  result?: string;

  @IsNumber()
  @IsOptional()
  attemptNumber?: number;

  @IsString()
  @IsOptional()
  assessorName?: string;

  @IsDateString()
  @IsOptional()
  assessedAt?: string;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsString()
  @IsOptional()
  evidenceUrl?: string;
}

export class GradeAssessmentDto {
  @IsNumber()
  @IsNotEmpty()
  scoreAchieved: number;

  @IsString()
  @IsIn(['PASSED', 'FAILED', 'WAIVED'])
  result: string;

  @IsString()
  @IsOptional()
  feedback?: string;

  @IsString()
  @IsOptional()
  evidenceUrl?: string;
}

export class CreateCertificateDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsOptional()
  planId?: string;

  @IsString()
  @IsOptional()
  enrollmentId?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  certificateNumber?: string;

  @IsString()
  @IsNotEmpty()
  issuingOrganization: string;

  @IsDateString()
  @IsNotEmpty()
  issueDate: string;

  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @IsString()
  @IsOptional()
  @IsIn(['PENDING', 'VERIFIED', 'REJECTED', 'REVOKED'])
  verificationStatus?: string;

  @IsString()
  @IsOptional()
  credentialUrl?: string;

  @IsString()
  @IsOptional()
  documentUrl?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class VerifyCertificateDto {
  @IsString()
  @IsIn(['VERIFIED', 'REJECTED', 'REVOKED'])
  verificationStatus: 'VERIFIED' | 'REJECTED' | 'REVOKED';

  @IsString()
  @IsOptional()
  notes?: string;
}
