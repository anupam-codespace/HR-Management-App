import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';
import { CompetencyService } from '../services/competency.service';
import {
  CreateCompetencyDto,
  UpdateCompetencyDto,
  SetJobPositionCompetencyDto,
  AssessEmployeeCompetencyDto,
} from '../dto/competency.dto';

@Controller('training/competencies')
@UseGuards(AuthGuard)
export class CompetencyController {
  constructor(private readonly service: CompetencyService) {}

  @Get()
  async findAll(@Request() req, @Query('category') category?: string) {
    return this.service.findAllCompetencies(req.user.companyId, category);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOneCompetency(req.user.companyId, id);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateCompetencyDto) {
    return this.service.createCompetency(req.user.companyId, req.user, dto);
  }

  @Post('seed-defaults')
  async seedDefaults(@Request() req) {
    return this.service.seedDefaultCompetencies(req.user.companyId, req.user);
  }

  @Post('seed-matrix')
  async seedMatrix(@Request() req) {
    return this.service.seedDefaultMatrix(req.user.companyId);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateCompetencyDto,
  ) {
    return this.service.updateCompetency(req.user.companyId, id, req.user, dto);
  }

  // Designation Competency Requirements
  @Get('designation/:designationId')
  async getDesignationCompetencies(
    @Request() req,
    @Param('designationId') designationId: string,
  ) {
    return this.service.getDesignationCompetencies(req.user.companyId, designationId);
  }

  @Post('designation')
  async setJobPositionCompetency(
    @Request() req,
    @Body() dto: SetJobPositionCompetencyDto,
  ) {
    return this.service.setJobPositionCompetency(req.user.companyId, req.user, dto);
  }

  @Delete('designation/:designationId/:competencyId')
  async removeJobPositionCompetency(
    @Request() req,
    @Param('designationId') designationId: string,
    @Param('competencyId') competencyId: string,
  ) {
    return this.service.removeJobPositionCompetency(
      req.user.companyId,
      designationId,
      competencyId,
    );
  }

  // Employee Competency Assessment
  @Get('employee/:employeeId')
  async getEmployeeCompetencies(
    @Request() req,
    @Param('employeeId') employeeId: string,
  ) {
    return this.service.getEmployeeCompetencies(req.user.companyId, employeeId);
  }

  @Post('employee/assess')
  async assessEmployee(
    @Request() req,
    @Body() dto: AssessEmployeeCompetencyDto,
  ) {
    return this.service.assessEmployeeCompetency(req.user.companyId, req.user, dto);
  }

  // Skill Gap Analysis
  @Get('gap-analysis/:employeeId')
  async analyzeGap(
    @Request() req,
    @Param('employeeId') employeeId: string,
    @Query('targetDesignationId') targetDesignationId?: string,
  ) {
    return this.service.analyzeSkillGap(
      req.user.companyId,
      employeeId,
      targetDesignationId,
    );
  }
}
