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
import { TrainingSessionService } from '../services/training-session.service';
import {
  CreateTrainingSessionDto,
  UpdateTrainingSessionDto,
} from '../dto/session.dto';

@Controller('training/sessions')
@UseGuards(AuthGuard)
export class TrainingSessionController {
  constructor(private readonly service: TrainingSessionService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('planId') planId?: string,
  ) {
    return this.service.findAll(req.user.companyId, { status, planId });
  }

  @Get('plan/:planId')
  async findByPlan(@Request() req, @Param('planId') planId: string) {
    return this.service.findByPlan(req.user.companyId, planId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateTrainingSessionDto) {
    return this.service.create(req.user.companyId, req.user, dto);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTrainingSessionDto,
  ) {
    return this.service.update(req.user.companyId, id, req.user, dto);
  }
}
