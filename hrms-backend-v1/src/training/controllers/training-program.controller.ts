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
import { TrainingProgramService } from '../services/training-program.service';
import {
  CreateTrainingProgramDto,
  UpdateTrainingProgramDto,
} from '../dto/program.dto';

@Controller('training/programs')
@UseGuards(AuthGuard)
export class TrainingProgramController {
  constructor(private readonly service: TrainingProgramService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(req.user.companyId, {
      categoryId,
      status,
      search,
    });
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateTrainingProgramDto) {
    return this.service.create(req.user.companyId, req.user, dto);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTrainingProgramDto,
  ) {
    return this.service.update(req.user.companyId, id, req.user, dto);
  }
}
