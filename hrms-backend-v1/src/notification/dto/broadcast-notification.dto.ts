import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
} from 'class-validator';

export enum NotificationTargetAudience {
  ALL = 'ALL',
  DEPARTMENT = 'DEPARTMENT',
  SPECIFIC_EMPLOYEES = 'SPECIFIC_EMPLOYEES',
}

export enum NotificationType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  ALERT = 'ALERT',
  POLICY = 'POLICY',
  SYSTEM = 'SYSTEM',
  GENERAL = 'GENERAL',
}

export class BroadcastNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsString()
  type?: string = 'ANNOUNCEMENT';

  @IsEnum(NotificationTargetAudience)
  targetAudience: NotificationTargetAudience;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  departmentIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  employeeIds?: string[];

  @IsOptional()
  @IsString()
  priority?: 'NORMAL' | 'URGENT' = 'NORMAL';

  @IsOptional()
  @IsBoolean()
  createAnnouncement?: boolean = true;
}
