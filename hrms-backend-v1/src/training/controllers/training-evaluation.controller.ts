import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { TrainingEvaluationService } from '../services/training-evaluation.service';
import {
  CreateTrainingEvaluationDto,
  UpdateTrainingEvaluationDto,
} from '../dto/evaluation.dto';

@Controller('training/evaluations')
@UseGuards(AuthGuard)
export class TrainingEvaluationController {
  constructor(private readonly service: TrainingEvaluationService) {}

  @Get()
  async findAll(@Request() req) {
    return this.service.findAll(req.user.companyId);
  }

  @Get('plan/:planId')
  async findByPlan(@Request() req, @Param('planId') planId: string) {
    return this.service.findByPlan(req.user.companyId, planId);
  }

  @Get('employee/:employeeId')
  async findByEmployee(@Request() req, @Param('employeeId') employeeId: string) {
    return this.service.findByEmployee(req.user.companyId, employeeId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateTrainingEvaluationDto) {
    return this.service.create(req.user.companyId, req.user, dto);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTrainingEvaluationDto,
  ) {
    return this.service.update(req.user.companyId, id, req.user, dto);
  }
}
