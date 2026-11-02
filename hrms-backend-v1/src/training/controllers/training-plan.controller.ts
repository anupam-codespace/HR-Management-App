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
import { TrainingPlanService } from '../services/training-plan.service';
import {
  CreateTrainingPlanDto,
  UpdateTrainingPlanDto,
  ReviewTrainingPlanDto,
} from '../dto/plan.dto';

@Controller('training/plans')
@UseGuards(AuthGuard)
export class TrainingPlanController {
  constructor(private readonly service: TrainingPlanService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('categoryId') categoryId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('search') search?: string,
    @Query('priority') priority?: string,
    @Query('trainingType') trainingType?: string,
  ) {
    return this.service.findAll(req.user.companyId, req.user, {
      status,
      categoryId,
      departmentId,
      search,
      priority,
      trainingType,
    });
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateTrainingPlanDto) {
    return this.service.create(req.user.companyId, req.user, dto);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTrainingPlanDto,
  ) {
    return this.service.update(req.user.companyId, id, req.user, dto);
  }

  @Post(':id/submit')
  async submit(@Request() req, @Param('id') id: string) {
    return this.service.submitForApproval(req.user.companyId, id, req.user);
  }

  @Post(':id/review')
  async review(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReviewTrainingPlanDto,
  ) {
    return this.service.review(req.user.companyId, id, req.user, dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
  ) {
    return this.service.updateStatus(req.user.companyId, id, req.user, status);
  }
}
