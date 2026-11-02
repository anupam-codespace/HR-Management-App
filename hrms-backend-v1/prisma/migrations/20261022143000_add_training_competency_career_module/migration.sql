-- Migration: Add Universal Training, Competency & Career Development Module
-- TeamHub HRMS

-- 1. Create TrainingCategory Table
CREATE TABLE IF NOT EXISTS "TrainingCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#6366F1',
    "icon" TEXT NOT NULL DEFAULT 'BookOpen',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingCategory_companyId_code_key" UNIQUE ("companyId", "code")
);
CREATE INDEX IF NOT EXISTS "TrainingCategory_companyId_idx" ON "TrainingCategory"("companyId");

-- 2. Create Competency Table
CREATE TABLE IF NOT EXISTS "Competency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'Technical',
    "description" TEXT,
    "proficiencyScale" TEXT NOT NULL DEFAULT 'STANDARD',
    "assessmentMethod" TEXT NOT NULL DEFAULT 'PRACTICAL_DEMO',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Competency_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Competency_companyId_code_key" UNIQUE ("companyId", "code")
);
CREATE INDEX IF NOT EXISTS "Competency_companyId_idx" ON "Competency"("companyId");

-- 3. Create JobPositionCompetency Table
CREATE TABLE IF NOT EXISTS "JobPositionCompetency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "designationId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "requiredLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    "isMandatory" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobPositionCompetency_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobPositionCompetency_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "Designation"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobPositionCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobPositionCompetency_designationId_competencyId_key" UNIQUE ("designationId", "competencyId")
);
CREATE INDEX IF NOT EXISTS "JobPositionCompetency_companyId_idx" ON "JobPositionCompetency"("companyId");
CREATE INDEX IF NOT EXISTS "JobPositionCompetency_designationId_idx" ON "JobPositionCompetency"("designationId");

-- 4. Create EmployeeCompetency Table
CREATE TABLE IF NOT EXISTS "EmployeeCompetency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "currentLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "assessedById" TEXT,
    "assessmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextReviewDate" TIMESTAMP(3),
    "evidenceUrl" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmployeeCompetency_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeeCompetency_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeeCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeeCompetency_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeeCompetency_employeeId_competencyId_key" UNIQUE ("employeeId", "competencyId")
);
CREATE INDEX IF NOT EXISTS "EmployeeCompetency_companyId_idx" ON "EmployeeCompetency"("companyId");
CREATE INDEX IF NOT EXISTS "EmployeeCompetency_employeeId_idx" ON "EmployeeCompetency"("employeeId");

-- 5. Create TrainingProgram Table
CREATE TABLE IF NOT EXISTS "TrainingProgram" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "programCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" TEXT,
    "description" TEXT,
    "objectives" TEXT,
    "prerequisites" TEXT,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'HYBRID',
    "plannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "requiresAssessment" BOOLEAN NOT NULL DEFAULT true,
    "requiresCertificate" BOOLEAN NOT NULL DEFAULT false,
    "validityMonths" INTEGER,
    "targetAudience" TEXT,
    "materialsUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingProgram_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingProgram_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TrainingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingProgram_companyId_programCode_key" UNIQUE ("companyId", "programCode")
);
CREATE INDEX IF NOT EXISTS "TrainingProgram_companyId_idx" ON "TrainingProgram"("companyId");

-- 6. Create TrainingProgramCompetency Table
CREATE TABLE IF NOT EXISTS "TrainingProgramCompetency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "programId" TEXT NOT NULL,
    "competencyId" TEXT NOT NULL,
    "targetLevel" TEXT NOT NULL DEFAULT 'INTERMEDIATE',
    CONSTRAINT "TrainingProgramCompetency_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingProgramCompetency_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingProgramCompetency_programId_competencyId_key" UNIQUE ("programId", "competencyId")
);
CREATE INDEX IF NOT EXISTS "TrainingProgramCompetency_programId_idx" ON "TrainingProgramCompetency"("programId");

-- 7. Create TrainingMaterial Table
CREATE TABLE IF NOT EXISTS "TrainingMaterial" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "fileSize" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingMaterial_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingMaterial_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TrainingMaterial_companyId_idx" ON "TrainingMaterial"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingMaterial_programId_idx" ON "TrainingMaterial"("programId");

-- 8. Create TrainingPlan Table
CREATE TABLE IF NOT EXISTS "TrainingPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "planNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "categoryId" TEXT,
    "programId" TEXT,
    "trainingType" TEXT NOT NULL DEFAULT 'DEPARTMENTAL',
    "businessJustification" TEXT,
    "reason" TEXT NOT NULL DEFAULT 'SKILL_GAP',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "requestingEmployeeId" TEXT,
    "requestingDepartmentId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "deliveryMethod" TEXT NOT NULL DEFAULT 'HYBRID',
    "providerType" TEXT NOT NULL DEFAULT 'INTERNAL',
    "providerName" TEXT,
    "trainerName" TEXT,
    "trainerEmployeeId" TEXT,
    "venueOrLink" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "plannedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedTravelCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedRegistrationCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedAccommodationCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "estimatedMaterialCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "targetDesignationId" TEXT,
    "targetDepartmentId" TEXT,
    "proposedEffectiveDate" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingPlan_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingPlan_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "TrainingCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingPlan_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingPlan_requestingEmployeeId_fkey" FOREIGN KEY ("requestingEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingPlan_requestingDepartmentId_fkey" FOREIGN KEY ("requestingDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingPlan_trainerEmployeeId_fkey" FOREIGN KEY ("trainerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingPlan_targetDesignationId_fkey" FOREIGN KEY ("targetDesignationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingPlan_targetDepartmentId_fkey" FOREIGN KEY ("targetDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingPlan_companyId_planNumber_key" UNIQUE ("companyId", "planNumber")
);
CREATE INDEX IF NOT EXISTS "TrainingPlan_companyId_idx" ON "TrainingPlan"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingPlan_status_idx" ON "TrainingPlan"("status");

-- 9. Create TrainingSession Table
CREATE TABLE IF NOT EXISTS "TrainingSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "programId" TEXT,
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "timeZone" TEXT NOT NULL DEFAULT 'UTC',
    "trainerName" TEXT,
    "trainerEmployeeId" TEXT,
    "venueOrLink" TEXT,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'HYBRID',
    "capacity" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingSession_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_programId_fkey" FOREIGN KEY ("programId") REFERENCES "TrainingProgram"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingSession_trainerEmployeeId_fkey" FOREIGN KEY ("trainerEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TrainingSession_companyId_idx" ON "TrainingSession"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingSession_planId_idx" ON "TrainingSession"("planId");

-- 10. Create TrainingEnrollment Table
CREATE TABLE IF NOT EXISTS "TrainingEnrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completionDate" TIMESTAMP(3),
    "completionPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actualHoursSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "preTrainingRating" INTEGER,
    "postTrainingRating" INTEGER,
    "trainerFeedback" TEXT,
    "employeeFeedback" TEXT,
    "absenceReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingEnrollment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingEnrollment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingEnrollment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingEnrollment_planId_employeeId_key" UNIQUE ("planId", "employeeId")
);
CREATE INDEX IF NOT EXISTS "TrainingEnrollment_companyId_idx" ON "TrainingEnrollment"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingEnrollment_employeeId_idx" ON "TrainingEnrollment"("employeeId");

-- 11. Create TrainingAttendance Table
CREATE TABLE IF NOT EXISTS "TrainingAttendance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PRESENT',
    "attendedHours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingAttendance_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingAttendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TrainingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingAttendance_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingAttendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingAttendance_sessionId_employeeId_key" UNIQUE ("sessionId", "employeeId")
);
CREATE INDEX IF NOT EXISTS "TrainingAttendance_companyId_idx" ON "TrainingAttendance"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingAttendance_sessionId_idx" ON "TrainingAttendance"("sessionId");
CREATE INDEX IF NOT EXISTS "TrainingAttendance_employeeId_idx" ON "TrainingAttendance"("employeeId");

-- 12. Create TrainingAssessment Table
CREATE TABLE IF NOT EXISTS "TrainingAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assessmentType" TEXT NOT NULL DEFAULT 'PRACTICAL',
    "title" TEXT NOT NULL,
    "passingScore" DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "scoreAchieved" DOUBLE PRECISION,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "assessorId" TEXT,
    "assessorName" TEXT,
    "assessedAt" TIMESTAMP(3),
    "feedback" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingAssessment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingAssessment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingAssessment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingAssessment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingAssessment_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TrainingAssessment_companyId_idx" ON "TrainingAssessment"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingAssessment_planId_idx" ON "TrainingAssessment"("planId");
CREATE INDEX IF NOT EXISTS "TrainingAssessment_employeeId_idx" ON "TrainingAssessment"("employeeId");

-- 13. Create TrainingCertificate Table
CREATE TABLE IF NOT EXISTS "TrainingCertificate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "planId" TEXT,
    "enrollmentId" TEXT,
    "title" TEXT NOT NULL,
    "certificateNumber" TEXT,
    "issuingOrganization" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED',
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "credentialUrl" TEXT,
    "documentUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingCertificate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingCertificate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingCertificate_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingCertificate_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TrainingCertificate_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TrainingCertificate_companyId_idx" ON "TrainingCertificate"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingCertificate_employeeId_idx" ON "TrainingCertificate"("employeeId");
CREATE INDEX IF NOT EXISTS "TrainingCertificate_expiryDate_idx" ON "TrainingCertificate"("expiryDate");

-- 14. Create TrainingEvaluation Table
CREATE TABLE IF NOT EXISTS "TrainingEvaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "evaluatorId" TEXT NOT NULL,
    "evaluationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "competenciesAchieved" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "trainingEffectivenessRating" INTEGER NOT NULL DEFAULT 5,
    "businessImpact" TEXT,
    "remainingGaps" TEXT,
    "trainerFeedbackSummary" TEXT,
    "managerEvaluationNotes" TEXT NOT NULL,
    "employeeFeedbackSummary" TEXT,
    "recommendedOutcome" TEXT NOT NULL DEFAULT 'CONTINUE_CURRENT_ROLE',
    "actionStatus" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "supportingEvidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingEvaluation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingEvaluation_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingEvaluation_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "TrainingEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingEvaluation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingEvaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TrainingEvaluation_companyId_idx" ON "TrainingEvaluation"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingEvaluation_planId_idx" ON "TrainingEvaluation"("planId");
CREATE INDEX IF NOT EXISTS "TrainingEvaluation_employeeId_idx" ON "TrainingEvaluation"("employeeId");

-- 15. Create EmployeePositionChange Table
CREATE TABLE IF NOT EXISTS "EmployeePositionChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "changeNumber" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "trainingPlanId" TEXT,
    "evaluationId" TEXT UNIQUE,
    "changeType" TEXT NOT NULL DEFAULT 'PROMOTION',
    "reason" TEXT NOT NULL,
    "currentDepartmentId" TEXT,
    "proposedDepartmentId" TEXT,
    "currentDesignationId" TEXT,
    "proposedDesignationId" TEXT,
    "currentJobGrade" TEXT,
    "proposedJobGrade" TEXT,
    "currentBranchId" TEXT,
    "proposedBranchId" TEXT,
    "proposedEffectiveDate" TIMESTAMP(3) NOT NULL,
    "compensationReviewStatus" TEXT NOT NULL DEFAULT 'NOT_REQUIRED',
    "proposedSalaryIncrease" DOUBLE PRECISION,
    "decisionNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_APPROVAL',
    "appliedAt" TIMESTAMP(3),
    "appliedById" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmployeePositionChange_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_trainingPlanId_fkey" FOREIGN KEY ("trainingPlanId") REFERENCES "TrainingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "TrainingEvaluation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_currentDepartmentId_fkey" FOREIGN KEY ("currentDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_proposedDepartmentId_fkey" FOREIGN KEY ("proposedDepartmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_currentDesignationId_fkey" FOREIGN KEY ("currentDesignationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_proposedDesignationId_fkey" FOREIGN KEY ("proposedDesignationId") REFERENCES "Designation"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_currentBranchId_fkey" FOREIGN KEY ("currentBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_proposedBranchId_fkey" FOREIGN KEY ("proposedBranchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_appliedById_fkey" FOREIGN KEY ("appliedById") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmployeePositionChange_companyId_changeNumber_key" UNIQUE ("companyId", "changeNumber")
);
CREATE INDEX IF NOT EXISTS "EmployeePositionChange_companyId_idx" ON "EmployeePositionChange"("companyId");
CREATE INDEX IF NOT EXISTS "EmployeePositionChange_employeeId_idx" ON "EmployeePositionChange"("employeeId");
CREATE INDEX IF NOT EXISTS "EmployeePositionChange_status_idx" ON "EmployeePositionChange"("status");

-- 16. Create PositionChangeApproval Table
CREATE TABLE IF NOT EXISTS "PositionChangeApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "positionChangeId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "stage" TEXT NOT NULL DEFAULT 'HR_HEAD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "actionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PositionChangeApproval_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PositionChangeApproval_positionChangeId_fkey" FOREIGN KEY ("positionChangeId") REFERENCES "EmployeePositionChange"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PositionChangeApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "PositionChangeApproval_companyId_idx" ON "PositionChangeApproval"("companyId");
CREATE INDEX IF NOT EXISTS "PositionChangeApproval_positionChangeId_idx" ON "PositionChangeApproval"("positionChangeId");

-- 17. Create TrainingApproval Table
CREATE TABLE IF NOT EXISTS "TrainingApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "approvalType" TEXT NOT NULL DEFAULT 'PLAN_SUBMISSION',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "actionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TrainingApproval_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingApproval_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TrainingApproval_companyId_idx" ON "TrainingApproval"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingApproval_planId_idx" ON "TrainingApproval"("planId");

-- 18. Create TrainingExpense Table
CREATE TABLE IF NOT EXISTS "TrainingExpense" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "employeeId" TEXT,
    "expenseCategory" TEXT NOT NULL DEFAULT 'MISC',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptUrl" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TrainingExpense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingExpense_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TrainingExpense_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "TrainingExpense_companyId_idx" ON "TrainingExpense"("companyId");
CREATE INDEX IF NOT EXISTS "TrainingExpense_planId_idx" ON "TrainingExpense"("planId");
