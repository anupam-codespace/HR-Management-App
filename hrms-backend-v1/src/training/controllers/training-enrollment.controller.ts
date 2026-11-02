import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { TrainingEnrollmentService } from '../services/training-enrollment.service';
import {
  EnrollEmployeesDto,
  UpdateEnrollmentDto,
  BatchSessionAttendanceDto,
} from '../dto/enrollment.dto';

@Controller('training')
@UseGuards(AuthGuard)
export class TrainingEnrollmentController {
  constructor(private readonly service: TrainingEnrollmentService) {}

  @Post('enrollments')
  async enroll(@Request() req, @Body() dto: EnrollEmployeesDto) {
    return this.service.enrollEmployees(req.user.companyId, req.user, dto);
  }

  @Patch('enrollments/:id')
  async updateEnrollment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.service.updateEnrollment(req.user.companyId, id, req.user, dto);
  }

  @Post('attendance/batch')
  async recordAttendance(
    @Request() req,
    @Body() dto: BatchSessionAttendanceDto,
  ) {
    return this.service.recordSessionAttendance(req.user.companyId, req.user, dto);
  }
}
