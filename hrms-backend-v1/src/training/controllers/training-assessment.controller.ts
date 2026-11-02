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
import { TrainingAssessmentService } from '../services/training-assessment.service';
import {
  CreateAssessmentDto,
  GradeAssessmentDto,
  CreateCertificateDto,
  VerifyCertificateDto,
} from '../dto/assessment.dto';

@Controller('training')
@UseGuards(AuthGuard)
export class TrainingAssessmentController {
  constructor(private readonly service: TrainingAssessmentService) {}

  // Assessments
  @Get('assessments')
  async findAllAssessments(@Request() req, @Query('result') result?: string) {
    return this.service.findAllAssessments(req.user.companyId, { result });
  }

  @Get('assessments/plan/:planId')
  async findAssessmentsByPlan(@Request() req, @Param('planId') planId: string) {
    return this.service.findAssessmentsByPlan(req.user.companyId, planId);
  }

  @Post('assessments')
  async createAssessment(@Request() req, @Body() dto: CreateAssessmentDto) {
    return this.service.createAssessment(req.user.companyId, req.user, dto);
  }

  @Patch('assessments/:id/grade')
  async gradeAssessment(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: GradeAssessmentDto,
  ) {
    return this.service.gradeAssessment(req.user.companyId, id, req.user, dto);
  }

  // Certificates
  @Get('certificates')
  async findCertificates(@Request() req, @Query('employeeId') employeeId?: string) {
    return this.service.findCertificates(req.user.companyId, employeeId);
  }

  @Get('certificates/expiring')
  async getExpiringCertificates(@Request() req, @Query('days') days?: string) {
    const daysNum = days ? parseInt(days, 10) : 60;
    return this.service.getExpiringCertificates(req.user.companyId, daysNum);
  }

  @Post('certificates')
  async createCertificate(@Request() req, @Body() dto: CreateCertificateDto) {
    return this.service.createCertificate(req.user.companyId, req.user, dto);
  }

  @Patch('certificates/:id/verify')
  async verifyCertificate(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: VerifyCertificateDto,
  ) {
    return this.service.verifyCertificate(req.user.companyId, id, req.user, dto);
  }
}
