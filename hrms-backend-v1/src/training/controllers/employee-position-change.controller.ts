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
import { EmployeePositionChangeService } from '../services/employee-position-change.service';
import {
  InitiatePositionChangeDto,
  ReviewPositionChangeDto,
  ApplyPositionChangeDto,
} from '../dto/position-change.dto';

@Controller('training/position-changes')
@UseGuards(AuthGuard)
export class EmployeePositionChangeController {
  constructor(private readonly service: EmployeePositionChangeService) {}

  @Get()
  async findAll(
    @Request() req,
    @Query('status') status?: string,
    @Query('changeType') changeType?: string,
    @Query('departmentId') departmentId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(req.user.companyId, {
      status,
      changeType,
      departmentId,
      employeeId,
      search,
    });
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.companyId, id);
  }

  @Post()
  async initiate(@Request() req, @Body() dto: InitiatePositionChangeDto) {
    return this.service.initiate(req.user.companyId, req.user, dto);
  }

  @Post(':id/review')
  async review(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ReviewPositionChangeDto,
  ) {
    return this.service.review(req.user.companyId, id, req.user, dto);
  }

  @Post(':id/apply')
  async applyChange(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ApplyPositionChangeDto,
  ) {
    return this.service.applyApprovedChange(req.user.companyId, id, req.user, dto);
  }
}
