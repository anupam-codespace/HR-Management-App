import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { TrainingDashboardService } from '../services/training-dashboard.service';

@Controller('training')
@UseGuards(AuthGuard)
export class TrainingDashboardController {
  constructor(private readonly service: TrainingDashboardService) {}

  @Get('dashboard')
  async getDashboard(@Request() req) {
    return this.service.getDashboardStats(req.user.companyId, req.user);
  }

  @Get('reports')
  async getReports(
    @Request() req,
    @Query('type') type: any,
    @Query('departmentId') departmentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getReports(req.user.companyId, {
      type: type || 'PARTICIPATION_BY_DEPARTMENT',
      departmentId,
      startDate,
      endDate,
    });
  }
}
