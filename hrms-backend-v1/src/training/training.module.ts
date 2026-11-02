import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationModule } from '../notification/notification.module';

// Services
import { TrainingSequenceService } from './services/training-sequence.service';
import { TrainingCategoryService } from './services/training-category.service';
import { CompetencyService } from './services/competency.service';
import { TrainingProgramService } from './services/training-program.service';
import { TrainingPlanService } from './services/training-plan.service';
import { TrainingSessionService } from './services/training-session.service';
import { TrainingEnrollmentService } from './services/training-enrollment.service';
import { TrainingAssessmentService } from './services/training-assessment.service';
import { TrainingEvaluationService } from './services/training-evaluation.service';
import { EmployeePositionChangeService } from './services/employee-position-change.service';
import { TrainingDashboardService } from './services/training-dashboard.service';

// Controllers
import { TrainingDashboardController } from './controllers/training-dashboard.controller';
import { TrainingCategoryController } from './controllers/training-category.controller';
import { CompetencyController } from './controllers/competency.controller';
import { TrainingProgramController } from './controllers/training-program.controller';
import { TrainingPlanController } from './controllers/training-plan.controller';
import { TrainingSessionController } from './controllers/training-session.controller';
import { TrainingEnrollmentController } from './controllers/training-enrollment.controller';
import { TrainingAssessmentController } from './controllers/training-assessment.controller';
import { TrainingEvaluationController } from './controllers/training-evaluation.controller';
import { EmployeePositionChangeController } from './controllers/employee-position-change.controller';
import { TrainingExpenseController } from './controllers/training-expense.controller';
import { MyLearningController } from './controllers/my-learning.controller';

@Module({
  imports: [PrismaModule, AuditModule, NotificationModule],
  controllers: [
    TrainingDashboardController,
    TrainingCategoryController,
    CompetencyController,
    TrainingProgramController,
    TrainingPlanController,
    TrainingSessionController,
    TrainingEnrollmentController,
    TrainingAssessmentController,
    TrainingEvaluationController,
    EmployeePositionChangeController,
    TrainingExpenseController,
    MyLearningController,
  ],
  providers: [
    TrainingSequenceService,
    TrainingCategoryService,
    CompetencyService,
    TrainingProgramService,
    TrainingPlanService,
    TrainingSessionService,
    TrainingEnrollmentService,
    TrainingAssessmentService,
    TrainingEvaluationService,
    EmployeePositionChangeService,
    TrainingDashboardService,
  ],
  exports: [
    TrainingSequenceService,
    TrainingCategoryService,
    CompetencyService,
    TrainingProgramService,
    TrainingPlanService,
    TrainingSessionService,
    TrainingEnrollmentService,
    TrainingAssessmentService,
    TrainingEvaluationService,
    EmployeePositionChangeService,
    TrainingDashboardService,
  ],
})
export class TrainingModule {}
