import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateTrainingSessionDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsOptional()
  programId?: string;

  @IsNumber()
  @IsOptional()
  sessionNumber?: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsDateString()
  @IsNotEmpty()
  startTime: string;

  @IsDateString()
  @IsNotEmpty()
  endTime: string;

  @IsString()
  @IsOptional()
  timeZone?: string;

  @IsString()
  @IsOptional()
  trainerName?: string;

  @IsString()
  @IsOptional()
  trainerEmployeeId?: string;

  @IsString()
  @IsOptional()
  venueOrLink?: string;

  @IsString()
  @IsOptional()
  @IsIn(['ONLINE', 'CLASSROOM', 'ON_THE_JOB', 'HYBRID', 'EXTERNAL'])
  deliveryMethod?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateTrainingSessionDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsDateString()
  @IsOptional()
  startTime?: string;

  @IsDateString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  timeZone?: string;

  @IsString()
  @IsOptional()
  trainerName?: string;

  @IsString()
  @IsOptional()
  trainerEmployeeId?: string;

  @IsString()
  @IsOptional()
  venueOrLink?: string;

  @IsString()
  @IsOptional()
  deliveryMethod?: string;

  @IsNumber()
  @IsOptional()
  capacity?: number;

  @IsString()
  @IsOptional()
  @IsIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'])
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
