import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../audit/audit.service';
import { CreateTrainingExpenseDto } from '../dto/expense.dto';

@Controller('training/expenses')
@UseGuards(AuthGuard)
export class TrainingExpenseController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  @Get('plan/:planId')
  async findByPlan(@Request() req, @Param('planId') planId: string) {
    return this.prisma.trainingExpense.findMany({
      where: { companyId: req.user.companyId, planId },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateTrainingExpenseDto) {
    const expense = await this.prisma.trainingExpense.create({
      data: {
        companyId: req.user.companyId,
        planId: dto.planId,
        employeeId: dto.employeeId,
        expenseCategory: dto.expenseCategory,
        amount: dto.amount,
        currency: dto.currency || 'INR',
        date: dto.date ? new Date(dto.date) : new Date(),
        receiptUrl: dto.receiptUrl,
        description: dto.description?.trim(),
      },
    });

    this.auditService.logAction(
      req.user.companyId,
      req.user.sub || req.user.id,
      'CREATE',
      'TrainingExpense',
      expense.id,
      null,
      expense,
    );

    return expense;
  }
}
