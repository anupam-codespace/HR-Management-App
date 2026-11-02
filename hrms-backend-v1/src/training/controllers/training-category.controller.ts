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
import { TrainingCategoryService } from '../services/training-category.service';
import {
  CreateTrainingCategoryDto,
  UpdateTrainingCategoryDto,
} from '../dto/category.dto';

@Controller('training/categories')
@UseGuards(AuthGuard)
export class TrainingCategoryController {
  constructor(private readonly service: TrainingCategoryService) {}

  @Get()
  async findAll(@Request() req, @Query('onlyActive') onlyActive?: string) {
    return this.service.findAll(req.user.companyId, onlyActive === 'true');
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateTrainingCategoryDto) {
    return this.service.create(req.user.companyId, req.user, dto);
  }

  @Post('seed-defaults')
  async seedDefaults(@Request() req) {
    return this.service.seedDefaultCategories(req.user.companyId, req.user);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateTrainingCategoryDto,
  ) {
    return this.service.update(req.user.companyId, id, req.user, dto);
  }
}
