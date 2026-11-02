# Standard Operating Procedure (SOP): Universal Training, Competency & Career Development Module QA Test

## 1. Purpose

This Standard Operating Procedure (SOP) defines the validation and verification process for the **Universal Training, Competency & Career Development Module** in **TeamHub HRMS**. 

It governs the complete business lifecycle of workforce development across diverse industries (Healthcare, Information Technology, Manufacturing, Education, Banking, Logistics, Hospitality, etc.):
1. Identifying training needs and skill gaps.
2. Formulating and routing individual/cohort training plans through configurable approvals.
3. Scheduling sessions and tracking batch attendance.
4. Administering multi-method assessments and tracking certification expiration.
5. Conducting post-training evaluations with governed career recommendations.
6. Processing governed position/designation changes and updates to employment history.

---

## 2. Core Business Rules

- **Industry Independence**: The workflow is common to all organizations. Training categories (e.g., Clinical, Engineering, Safety/OSHA, Banking Compliance, Pedagogical), competencies, proficiency scales, and outcomes are configurable per company.
- **Strict Non-Automatic Promotion Rule**: Training completion or a high assessment score **never** automatically modifies an employee's designation, department, grade, or salary. Career outcomes require a separate governed approval workflow (`EmployeePositionChange`).
- **Complete Tenant Isolation**: All entities (`TrainingCategory`, `Competency`, `TrainingPlan`, `TrainingEnrollment`, `EmployeePositionChange`, etc.) strictly enforce multi-tenant isolation via `companyId`.
- **Employment History Preservation**: Approved personnel changes atomically record prior and new designation, department, and effective date in `EmploymentHistory`.

---

## 3. Roles and Responsibilities

| Role | Responsibilities |
|---|---|
| **Company Admin** | Configures company-wide categories, competency matrix, and budget thresholds. |
| **HR / Training Manager** | Formulates training plans, assigns cohorts, schedules sessions, assigns trainers, manages budgets, oversees certifications, and initiates position changes. |
| **Department Manager** | Identifies skill gaps, reviews departmental training plans, submits evaluations, and recommends career outcomes. |
| **Trainer / Evaluator** | Records session attendance, submits assessment scores, grades competency demonstrations, and provides feedback. |
| **Employee** | Views assigned training, schedules, materials, assessment results, and competency progress. |
| **Approver (Finance/Dept Head)** | Reviews and approves training requests, budget expenses, and proposed position changes. |

---

## 4. Prerequisites & Test Environment

1. **Backend Service**: NestJS running on `http://localhost:5000` (or configured API port).
2. **Frontend App**: Next.js running on `http://localhost:3000`.
3. **Database**: PostgreSQL with Prisma schema synchronized (`npx prisma db push` or migrations applied).
4. **User Accounts**:
   - Company Admin / HR Manager credentials
   - Department Manager credentials
   - Employee credentials
5. **Sample Data**:
   - Active company record (`companyId`)
   - At least 1 Department (e.g., `Engineering` or `Operations`)
   - At least 2 Designations (e.g., `Software Engineer` and `Senior Software Engineer`)
   - At least 1 Employee assigned to the starting designation

---

## 5. End-to-End Test Workflow

### Step 1: Initialize Industry Categories & Competency Catalog
1. Navigate to **Training & Development** (`/workspace/training`).
2. Verify that industry-neutral categories exist (or trigger default seeding via API `POST /training/categories/seed`).
   - Standard seeds include:
     - `LND-TECH`: Technical & Engineering Skills
     - `LND-LEAD`: Leadership & Management
     - `LND-COMP`: Statutory Compliance & Safety
     - `LND-SOFT`: Professional & Soft Skills
     - `LND-OPS`: Quality & Operations
3. Under **Competencies & Matrix**:
   - Review or create a competency: `System Architecture & Distributed Design` (Category: Technical, Scale: 1-5).
   - Review or create position requirement: For `Senior Software Engineer`, require Level `4 (Advanced)`.

### Step 2: Perform Skill Gap Analysis
1. In the **Training Dashboard**, click **Skill Gap Analysis**.
2. Select an employee currently holding the designation `Software Engineer`.
3. Select the target designation `Senior Software Engineer`.
4. Observe the matrix:
   - Required Level: 4
   - Current Level: 2
   - Gap: `-2` (Deficit identified)
5. Click **Create Training Plan for Skill Gap** to auto-populate the training plan with the identified skill gap.

### Step 3: Formulate a Training Plan
1. Click **New Training Plan** (`/workspace/training`).
2. Fill in the plan details:
   - **Title**: `Advanced Distributed Systems & High-Throughput Engineering`
   - **Category**: Technical & Engineering Skills
   - **Type**: `INDIVIDUAL` or `GROUP`
   - **Reason**: `SKILL_GAP` or `PROMOTION_REQUIREMENT`
   - **Priority**: `HIGH`
   - **Delivery Method**: `HYBRID`
   - **Provider**: `INTERNAL` (or `EXTERNAL` with vendor name)
   - **Schedule**: Start date tomorrow, End date +30 days, Planned Hours: 40 hrs
   - **Budget**: Estimated Registration: ₹15,000, Material: ₹5,000 (Total: ₹20,000)
   - **Target Designation**: `Senior Software Engineer`
   - **Participants**: Select target employee(s)
3. Click **Create Training Plan**.
4. Status starts as **DRAFT**.
5. Click **Submit for Approval**. Status transitions to **PENDING_APPROVAL**.

### Step 4: Approve Training Plan & Schedule Sessions
1. Sign in or act as HR Head / Authorized Approver.
2. In the Training Plan details, click **Approve Plan**. Status transitions to **APPROVED**.
3. In the **Sessions** tab:
   - Click **Schedule Session**.
   - Set Title: `Session 1: Microservices Architecture & Event Sourcing`.
   - Set Date/Time: Upcoming date.
   - Set Delivery: `HYBRID`, Venue: `Training Room A / Google Meet`.
   - Click **Schedule Session**.
4. The participant roster is automatically created for the scheduled session.

### Step 5: Record Session Attendance & Track Progress
1. Open the created session and click **Record Attendance**.
2. For the enrolled employee:
   - Status: `PRESENT`
   - Actual Attended Hours: `4` hours
   - Notes: `Active engagement, completed live lab demo.`
3. Click **Save Attendance Roster**.
4. The plan enrollment automatically accumulates actual hours and increments the completion percentage.

### Step 6: Record Assessment & Certification
1. In the Training Plan details, open **Assessments & Certifications**.
2. Click **Record Assessment**:
   - Title: `Hands-on Architecture Capstone Defense`
   - Method: `PRACTICAL`
   - Max Score: `100`, Passing Score: `75`
   - Employee Score: `88` (Status: `PASS`)
   - Competency Verified: Level `4 (Advanced)`
   - Certificate Title: `Certified Distributed Systems Architect`
   - Certificate Number: `CDSA-2026-9041`
   - Expiry Date: 2 years from today
3. Click **Submit Assessment & Certificate**.

### Step 7: Post-Training Evaluation & Governed Outcome
1. Navigate to **Post-Training Evaluations**.
2. Click **Submit Post-Training Evaluation**:
   - Plan: Select the completed plan.
   - Employee: Select the participant.
   - Effectiveness Rating: `5 - Exceptional / Exceeds Target`
   - Post-Training Outcome: `RECOMMEND_PROMOTION`
   - Manager Evaluation: `Exceeded benchmarks. Architected high-throughput message pipeline during practical capstone.`
   - Business Impact: `Reduced event processing latency by 35%.`
3. Click **Submit Governed Evaluation**.
4. **Notice**: The employee's designation is still `Software Engineer`. Training evaluation **recommends** promotion, but does not apply it.

### Step 8: Formulate & Approve Position Change
1. Click **Initiate Position Change**.
2. Form fields:
   - **Employee**: Target employee
   - **Change Type**: `PROMOTION`
   - **Current Designation**: `Software Engineer` (Auto-filled)
   - **Proposed Designation**: `Senior Software Engineer`
   - **Proposed Department**: Same or target department
   - **Effective Date**: Select next pay cycle or immediate date
   - **Reason**: `Successfully completed Advanced Distributed Systems plan with Level 4 competency pass.`
3. Click **Submit for Review**. Status is `PENDING_REVIEW`.
4. Authorized Executive / HR Head reviews the submission and clicks **Approve & Apply Position Change**.
5. **System Execution**:
   - `Employee.designationId` is atomically updated to `Senior Software Engineer`.
   - `EmploymentHistory` records the prior designation, new designation, change reason, and effective date.
   - Notification is sent to the employee and manager.

---

## 6. Backend API Verification Recipes (curl / Postman)

Set environment variables:
```bash
TOKEN="YOUR_AUTH_JWT_TOKEN"
BASE_URL="http://localhost:5000"
```

### 1. Seed Industry-Independent Categories
```bash
curl -X POST "$BASE_URL/training/categories/seed" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Query Dashboard KPIs
```bash
curl -X GET "$BASE_URL/training/dashboard" \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Analyze Skill Gap
```bash
curl -X GET "$BASE_URL/training/competencies/skill-gap?employeeId=EMP_UUID&targetDesignationId=DESIG_UUID" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Create Training Plan
```bash
curl -X POST "$BASE_URL/training/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Universal Safety & Operations Standards",
    "trainingType": "GROUP",
    "reason": "COMPLIANCE_REQUIREMENT",
    "priority": "HIGH",
    "deliveryMethod": "HYBRID",
    "providerType": "INTERNAL",
    "plannedHours": 20,
    "totalBudget": 50000,
    "employeeIds": ["EMP_UUID_1", "EMP_UUID_2"]
  }'
```

### 5. Transition Plan Status
```bash
# Submit for approval
curl -X PATCH "$BASE_URL/training/plans/PLAN_UUID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PENDING_APPROVAL"}'

# Approve plan
curl -X PATCH "$BASE_URL/training/plans/PLAN_UUID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED", "comments": "Approved by Operations Head"}'
```

### 6. Schedule Session & Record Attendance
```bash
# Create Session
curl -X POST "$BASE_URL/training/sessions" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "PLAN_UUID",
    "title": "Module 1: Safety & Clean Room Protocols",
    "sessionNumber": 1,
    "deliveryMethod": "CLASSROOM",
    "startTime": "2026-11-01T09:00:00Z",
    "endTime": "2026-11-01T13:00:00Z"
  }'

# Batch Attendance
curl -X POST "$BASE_URL/training/sessions/SESSION_UUID/attendance" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {
        "enrollmentId": "ENROLLMENT_UUID",
        "status": "PRESENT",
        "actualHours": 4
      }
    ]
  }'
```

### 7. Post-Training Evaluation
```bash
curl -X POST "$BASE_URL/training/evaluations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "PLAN_UUID",
    "employeeId": "EMP_UUID",
    "effectivenessRating": 5,
    "recommendedOutcome": "RECOMMEND_PROMOTION",
    "managerEvaluation": "Demonstrated mastery of core benchmarks.",
    "businessImpact": "Zero audit non-conformances in Q4."
  }'
```

### 8. Position Change Workflow
```bash
# Initiate Position Change Request
curl -X POST "$BASE_URL/training/position-changes" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP_UUID",
    "changeType": "PROMOTION",
    "proposedDesignationId": "SENIOR_DESIG_UUID",
    "proposedDepartmentId": "DEPT_UUID",
    "effectiveDate": "2026-12-01T00:00:00Z",
    "reason": "Exceeded all criteria in Universal Training Module.",
    "trainingPlanId": "PLAN_UUID"
  }'

# Review & Apply Position Change
curl -X PATCH "$BASE_URL/training/position-changes/PC_UUID/review" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "decision": "APPROVED",
    "decisionNotes": "Authorized by HR Committee for Dec 1 effective date."
  }'
```

---

## 7. QA Acceptance Checklist

| # | Test Scenario | Expected Outcome | Result |
|---|---|---|---|
| 1 | Multi-Tenant Data Isolation | User in Company A cannot view or access Training Plans or Competencies belonging to Company B. | PASS |
| 2 | Reference Sequence Uniqueness | Reference numbers (`TRN-2026-0001`, `PRG-2026-0001`, `PC-2026-0001`) are unique, contiguous, and isolated per tenant. | PASS |
| 3 | Duplicate Enrollment Guard | Attempting to enroll the same employee twice into the same plan returns `409 Conflict`. | PASS |
| 4 | Duplicate Attendance Guard | Attempting to log duplicate attendance for the same enrollment in a session updates the existing record or is rejected. | PASS |
| 5 | Non-Automatic Promotion Guard | Completing training with score 100% and effectiveness rating 5 does **not** change the employee's designation or salary. | PASS |
| 6 | Position Change History | Approving a position change atomically updates `Employee.designationId` and creates an audit record in `EmploymentHistory`. | PASS |
| 7 | Expiring Certificate Tracking | Querying `/training/certificates/expiring?withinDays=60` returns credentials nearing expiration. | PASS |
| 8 | Automated Jest Unit Tests | All backend unit test suites pass (`npm test` in `hrms-backend-v1`). | PASS |
| 9 | Next.js Frontend Production Build | Next.js builds cleanly with 0 TypeScript/ESLint errors (`npm run build` in `hrms-project-v1`). | PASS |
