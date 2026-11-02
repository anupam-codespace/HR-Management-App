import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsIn,
} from 'class-validator';

export class CreateTrainingExpenseDto {
  @IsString()
  @IsNotEmpty()
  planId: string;

  @IsString()
  @IsOptional()
  employeeId?: string;

  @IsString()
  @IsIn([
    'REGISTRATION',
    'TRAINER_FEE',
    'TRAVEL',
    'ACCOMMODATION',
    'MATERIALS',
    'CERTIFICATION',
    'VENUE',
    'MISC',
  ])
  expenseCategory: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  receiptUrl?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
