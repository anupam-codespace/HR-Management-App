import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsIn,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class EnrollEmployeesDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsArray()
  @IsNotEmpty()
  employeeIds: string[];
}

export class UpdateEnrollmentDto {
  @IsString()
  @IsOptional()
  @IsIn(['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED', 'FAILED'])
  status?: string;

  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @IsNumber()
  @IsOptional()
  completionPercentage?: number;

  @IsNumber()
  @IsOptional()
  actualHoursSpent?: number;

  @IsNumber()
  @IsOptional()
  preTrainingRating?: number;

  @IsNumber()
  @IsOptional()
  postTrainingRating?: number;

  @IsString()
  @IsOptional()
  trainerFeedback?: string;

  @IsString()
  @IsOptional()
  employeeFeedback?: string;

  @IsString()
  @IsOptional()
  absenceReason?: string;
}

export class MarkAttendanceItemDto {
  @IsString()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsIn(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'])
  status: string;

  @IsNumber()
  @IsOptional()
  attendedHours?: number;

  @IsDateString()
  @IsOptional()
  checkInTime?: string;

  @IsDateString()
  @IsOptional()
  checkOutTime?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class BatchSessionAttendanceDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MarkAttendanceItemDto)
  records: MarkAttendanceItemDto[];
}
