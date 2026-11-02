"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useViewMode } from "@/context/ViewModeContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  Sparkles,
  Search,
  Plus,
  Calendar,
  Clock,
  Award,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Download,
  Loader2,
  RefreshCw,
  Building,
  Layers,
  UserCheck,
  LayoutGrid,
  List,
  MapPin,
  Video,
  BarChart3,
  Check,
  ExternalLink,
  Target,
  FileCheck2,
  Star,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

// Modals
import NewTrainingPlanModal from "@/components/training/NewTrainingPlanModal";
import TrainingPlanDetailModal from "@/components/training/TrainingPlanDetailModal";
import NewSessionModal from "@/components/training/NewSessionModal";
import BatchAttendanceModal from "@/components/training/BatchAttendanceModal";
import NewEvaluationModal from "@/components/training/NewEvaluationModal";
import InitiatePositionChangeModal from "@/components/training/InitiatePositionChangeModal";
import SkillGapAnalysisModal from "@/components/training/SkillGapAnalysisModal";
import NewCompetencyModal from "@/components/training/NewCompetencyModal";
import ConfigureRoleMatrixModal from "@/components/training/ConfigureRoleMatrixModal";
import AssessEmployeeSkillModal from "@/components/training/AssessEmployeeSkillModal";
import NewAssessmentModal from "@/components/training/NewAssessmentModal";
import GradeAssessmentModal from "@/components/training/GradeAssessmentModal";
import NewCertificateModal from "@/components/training/NewCertificateModal";
import NewCategoryModal from "@/components/training/NewCategoryModal";

export default function TrainingModulePage() {
  const { user } = useViewMode();
  const { toast } = useToast();

  // 4-Pillar Pipeline Navigation
  const [activeTab, setActiveTab] = useState("initiatives");
  const [loading, setLoading] = useState(true);
  const [newPlanInitialData, setNewPlanInitialData] = useState<any>(null);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [allAssessments, setAllAssessments] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [positionChanges, setPositionChanges] = useState<any[]>([]);
  const [myLearningData, setMyLearningData] = useState<any>(null);

  // Pillar 1: Sub-views (Plans vs Delivery Sessions)
  const [initiativesSubView, setInitiativesSubView] = useState<"plans" | "sessions">("plans");
  const [plansViewMode, setPlansViewMode] = useState<"table" | "grid">("table");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [sessionFilter, setSessionFilter] = useState<"upcoming" | "past" | "all">("upcoming");

  // Pillar 3: Post-Training Sub-views (Certificates vs Evaluations vs Practical Exams)
  const [postTrainingSubTab, setPostTrainingSubTab] = useState<"certificates" | "evaluations" | "assessments">("certificates");
  const [assessmentFilter, setAssessmentFilter] = useState("ALL");

  // Modals state
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [activeSessionPlanId, setActiveSessionPlanId] = useState<string | null>(null);
  const [isNewSessionOpen, setIsNewSessionOpen] = useState(false);

  const [activeAttendanceSessionId, setActiveAttendanceSessionId] = useState<string | null>(null);
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);

  const [activeEvalPlanId, setActiveEvalPlanId] = useState<string | null>(null);
  const [activeEvalEmployeeId, setActiveEvalEmployeeId] = useState<string | null>(null);
  const [isNewEvalOpen, setIsNewEvalOpen] = useState(false);

  const [activePosChangePlanId, setActivePosChangePlanId] = useState<string | null>(null);
  const [activePosChangeEmpId, setActivePosChangeEmpId] = useState<string | null>(null);
  const [activePosChangeEvalId, setActivePosChangeEvalId] = useState<string | undefined>(undefined);
  const [isPosChangeOpen, setIsPosChangeOpen] = useState(false);

  const [isSkillGapOpen, setIsSkillGapOpen] = useState(false);
  const [isNewCompetencyOpen, setIsNewCompetencyOpen] = useState(false);
  const [isConfigureMatrixOpen, setIsConfigureMatrixOpen] = useState(false);
  const [isAssessEmployeeOpen, setIsAssessEmployeeOpen] = useState(false);

  const [isNewAssessmentOpen, setIsNewAssessmentOpen] = useState(false);
  const [gradingAssessment, setGradingAssessment] = useState<any | null>(null);
  const [isGradeAssessmentOpen, setIsGradeAssessmentOpen] = useState(false);

  const [isNewCertificateOpen, setIsNewCertificateOpen] = useState(false);
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [user]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [
        dashRes,
        plansRes,
        sessRes,
        compsRes,
        catsRes,
        assessRes,
        certsRes,
        evalsRes,
        posChangesRes,
        myLearnRes,
      ] = await Promise.allSettled([
        api.get("/training/dashboard"),
        api.get("/training/plans"),
        api.get("/training/sessions"),
        api.get("/training/competencies"),
        api.get("/training/categories"),
        api.get("/training/assessments"),
        api.get("/training/certificates"),
        api.get("/training/evaluations"),
        api.get("/training/position-changes"),
        api.get("/training/my-learning"),
      ]);

      if (dashRes.status === "fulfilled") setDashboardData(dashRes.value.data);
      if (plansRes.status === "fulfilled") setPlans(plansRes.value.data || []);
      if (sessRes.status === "fulfilled") setSessions(sessRes.value.data || []);
      if (compsRes.status === "fulfilled") setCompetencies(compsRes.value.data || []);
      if (catsRes.status === "fulfilled") setCategories(catsRes.value.data || []);
      if (assessRes.status === "fulfilled") setAllAssessments(assessRes.value.data || []);
      if (certsRes.status === "fulfilled") setCertificates(certsRes.value.data || []);
      if (evalsRes.status === "fulfilled") setEvaluations(evalsRes.value.data || []);
      if (posChangesRes.status === "fulfilled") setPositionChanges(posChangesRes.value.data || []);
      if (myLearnRes.status === "fulfilled") setMyLearningData(myLearnRes.value.data);
    } catch (err) {
      console.error("Error loading training module data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    try {
      setLoading(true);
      await Promise.all([
        api.post("/training/categories/seed-defaults"),
        api.post("/training/competencies/seed-defaults"),
      ]);
      await loadAllData();
      toast("Default industry categories and competency standards successfully initialized!", "success");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to seed defaults", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPositionChange = async (changeId: string) => {
    if (!confirm("Are you sure you want to officially apply this approved position change to the employee's official personnel record?")) {
      return;
    }
    try {
      setLoading(true);
      await api.post(`/training/position-changes/${changeId}/apply`, {});
      await loadAllData();
      toast("Position change officially applied! Historical employment record preserved.", "success");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to apply position change", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCertificate = async (certId: string) => {
    try {
      setLoading(true);
      await api.patch(`/training/certificates/${certId}/verify`, {
        verificationStatus: "VERIFIED",
      });
      await loadAllData();
      toast("Certificate officially verified and accredited to employee profile!", "success");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to verify certificate", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReportsCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Plan Number,Title,Category,Status,Training Type,Budget,Hours",
        ...plans.map(
          (p) =>
            `"${p.planNumber}","${p.title}","${p.category?.name || "General"}","${p.status}","${p.trainingType}",${p.totalBudget},${p.plannedHours}`
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `training_plans_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Department-wise summary for ROI Report
  const departmentStats = useMemo(() => {
    const deptMap: { [key: string]: { name: string; enrolled: number; completed: number; hours: number } } = {};
    plans.forEach((p) => {
      (p.enrollments || []).forEach((enr: any) => {
        const deptName = enr.employee?.department?.name || "General / Operations";
        if (!deptMap[deptName]) {
          deptMap[deptName] = { name: deptName, enrolled: 0, completed: 0, hours: 0 };
        }
        deptMap[deptName].enrolled += 1;
        if (enr.status === "COMPLETED") deptMap[deptName].completed += 1;
        deptMap[deptName].hours += enr.actualHoursSpent || 0;
      });
    });
    return Object.values(deptMap);
  }, [plans]);

  const handleExportDeptCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        "Department,Total Participants,Completed Count,Training Hours Logged",
        ...departmentStats.map(
          (d) => `"${d.name}",${d.enrolled},${d.completed},${d.hours}`
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `department_training_summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      if (statusFilter !== "ALL" && plan.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && plan.categoryId !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = plan.title.toLowerCase().includes(q);
        const matchesCode = plan.planNumber.toLowerCase().includes(q);
        const matchesTrainer = (plan.trainerName || "").toLowerCase().includes(q);
        if (!matchesTitle && !matchesCode && !matchesTrainer) return false;
      }
      return true;
    });
  }, [plans, statusFilter, categoryFilter, searchQuery]);

  // Filtered Sessions
  const filteredSessions = useMemo(() => {
    const now = new Date();
    return sessions.filter((s) => {
      const sessDate = new Date(s.startTime);
      if (sessionFilter === "upcoming") return sessDate >= now;
      if (sessionFilter === "past") return sessDate < now;
      return true;
    });
  }, [sessions, sessionFilter]);

  // Filtered Assessments
  const filteredAssessments = useMemo(() => {
    return allAssessments.filter((a) => {
      if (assessmentFilter !== "ALL" && a.result !== assessmentFilter) return false;
      return true;
    });
  }, [allAssessments, assessmentFilter]);

  const kpis = dashboardData?.kpis || {};

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
      case "IN_PROGRESS":
      case "SCHEDULED":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      case "APPROVED":
        return "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30";
      case "PENDING_APPROVAL":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "REJECTED":
        return "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                Training, Competency & Career Governance
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-secondary text-primary uppercase tracking-wider">
                  Enterprise HRMS
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Identify skill gaps, assign training initiatives, track delivery rosters, verify credentials, and govern career promotions.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSkillGapOpen(true)}
            className="gap-1.5 text-xs shadow-sm border-border hover:bg-muted"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Skill Gap Engine
          </Button>

          {categories.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaults}
              className="gap-1.5 text-xs border-dashed text-primary"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Seed Industry Standards
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => setIsNewPlanOpen(true)}
            className="gap-1.5 text-xs shadow-sm bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New Training Plan
          </Button>
        </div>
      </div>

      {/* Main Navigation Tabs: 4 Focused Pillars + Employee Self-Service */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto pb-1 -mb-1 scrollbar-none">
          <TabsList className="inline-flex h-auto w-auto min-w-full items-center justify-start gap-1 p-1 bg-muted/60 border border-border/50 rounded-xl">
            <TabsTrigger value="initiatives" className="text-xs px-3.5 py-1.5 whitespace-nowrap shrink-0 font-medium">
              1. Initiatives & Roster ({plans.length})
            </TabsTrigger>
            <TabsTrigger value="gaps" className="text-xs px-3.5 py-1.5 whitespace-nowrap shrink-0 font-medium">
              2. Skill Gaps & Readiness
            </TabsTrigger>
            <TabsTrigger value="post-training" className="text-xs px-3.5 py-1.5 whitespace-nowrap shrink-0 font-medium">
              3. Post-Training Proof & Skills ({certificates.length + evaluations.length + allAssessments.length})
            </TabsTrigger>
            <TabsTrigger value="career" className="text-xs px-3.5 py-1.5 whitespace-nowrap shrink-0 font-medium">
              4. Promotions & ROI Governance ({positionChanges.length})
            </TabsTrigger>
            <TabsTrigger value="my-learning" className="text-xs px-3.5 py-1.5 whitespace-nowrap shrink-0 font-medium">
              My Learning Portal
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ======================================================== */}
        {/* PILLAR 1: INITIATIVES & ROSTER (CREATE & ASSIGN) */}
        {/* ======================================================== */}
        <TabsContent value="initiatives" className="space-y-6">
          {/* Actionable Banner Alerts */}
          {kpis.pendingApprovalPlans > 0 && (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="font-bold text-amber-800 dark:text-amber-200">
                    {kpis.pendingApprovalPlans} Training Initiative{kpis.pendingApprovalPlans > 1 ? "s" : ""} Awaiting HR Review
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    Authorized trainers, vendor quotes, and budget allocations pending sign-off.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-amber-500/40 text-amber-700 dark:text-amber-300"
                onClick={() => {
                  setStatusFilter("PENDING_APPROVAL");
                  setInitiativesSubView("plans");
                }}
              >
                Review Plans
              </Button>
            </div>
          )}

          {kpis.expiringCertificatesCount > 0 && (
            <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <span className="font-bold text-rose-800 dark:text-rose-200">
                    {kpis.expiringCertificatesCount} Qualification{kpis.expiringCertificatesCount > 1 ? "s" : ""} Expiring Within 60 Days
                  </span>
                  <p className="text-muted-foreground mt-0.5">
                    Statutory and technical certifications requiring refresher courses or renewal.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-rose-500/40 text-rose-700 dark:text-rose-300"
                onClick={() => {
                  setActiveTab("post-training");
                  setPostTrainingSubTab("certificates");
                }}
              >
                View Expiring List
              </Button>
            </div>
          )}

          {/* Executive KPI Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Active Initiatives</span>
                <Calendar className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {(kpis.scheduledPlans || 0) + (kpis.inProgressPlans || 0)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {kpis.totalPlans || 0} Total Plans Registered
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Completion Rate</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {kpis.completionRate || 0}%
              </div>
              <div className="text-[11px] text-muted-foreground">
                {kpis.completedEnrollments || 0} of {kpis.totalEnrollments || 0} Enrollments Completed
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Training Expenditure</span>
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">
                ₹{(kpis.actualExpenditure || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-muted-foreground">
                ₹{(kpis.totalPlannedBudget || 0).toLocaleString()} Budget ({kpis.budgetUtilization || 0}% Utilized)
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-1">
              <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
                <span>Pending Career Decisions</span>
                <TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {(kpis.pendingEvaluations || 0) + (kpis.pendingPositionChanges || 0)}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {kpis.pendingPositionChanges || 0} Promotion/Transfer Approvals Pending
              </div>
            </div>
          </div>

          {/* Sub-View Switcher: Initiatives vs Delivery Schedule */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center space-x-2">
              <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40 text-xs">
                <button
                  onClick={() => setInitiativesSubView("plans")}
                  className={`px-3 py-1.5 rounded-md font-semibold ${
                    initiativesSubView === "plans"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Training Initiatives ({plans.length})
                </button>
                <button
                  onClick={() => setInitiativesSubView("sessions")}
                  className={`px-3 py-1.5 rounded-md font-semibold ${
                    initiativesSubView === "sessions"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Delivery Sessions & Attendance ({sessions.length})
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 flex-wrap">
              {initiativesSubView === "plans" ? (
                <>
                  <div className="flex items-center space-x-2">
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Search title, plan #, trainer..."
                      className="h-8 text-xs w-48"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING_APPROVAL">Pending Approval</option>
                    <option value="APPROVED">Approved</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="REJECTED">Rejected</option>
                  </select>

                  <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40">
                    <button
                      onClick={() => setPlansViewMode("table")}
                      className={`p-1.5 rounded-md text-xs ${
                        plansViewMode === "table" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                      title="Table View"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setPlansViewMode("grid")}
                      className={`p-1.5 rounded-md text-xs ${
                        plansViewMode === "grid" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                      }`}
                      title="Grid Cards"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => setIsNewPlanOpen(true)}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New Plan
                  </Button>
                </>
              ) : (
                <>
                  <select
                    className="h-8 rounded-md border border-input bg-background px-2.5 text-xs text-foreground"
                    value={sessionFilter}
                    onChange={(e: any) => setSessionFilter(e.target.value)}
                  >
                    <option value="upcoming">Upcoming Sessions</option>
                    <option value="past">Past / Completed</option>
                    <option value="all">All Sessions</option>
                  </select>

                  <Button
                    size="sm"
                    className="h-8 text-xs gap-1.5"
                    onClick={() => {
                      setActiveSessionPlanId(plans[0]?.id || null);
                      setIsNewSessionOpen(true);
                    }}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule Class Session
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Sub-view 1: Initiatives (Plans) Table or Grid */}
          {initiativesSubView === "plans" && (
            filteredPlans.length === 0 ? (
              <div className="p-12 text-center text-sm text-muted-foreground border border-dashed rounded-xl bg-card">
                No matching training initiatives found. Click &quot;New Plan&quot; to formulate a training cohort.
              </div>
            ) : plansViewMode === "table" ? (
              <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-left text-muted-foreground">
                      <th className="p-3">Plan # / Title</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Type / Reason</th>
                      <th className="p-3">Enrolled</th>
                      <th className="p-3">Total Budget</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredPlans.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => {
                          setSelectedPlanId(p.id);
                          setIsDetailOpen(true);
                        }}
                        className="hover:bg-muted/40 cursor-pointer transition-colors"
                      >
                        <td className="p-3 font-medium text-foreground">
                          <div className="font-semibold text-sm">{p.title}</div>
                          <span className="font-mono text-[11px] text-muted-foreground">{p.planNumber}</span>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {p.category?.name || "General"}
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div>{p.trainingType.replace(/_/g, " ")}</div>
                          <div className="text-[10px] text-muted-foreground/80">{p.reason.replace(/_/g, " ")}</div>
                        </td>
                        <td className="p-3">
                          <span className="font-semibold">{p._count?.enrollments || 0}</span> Employees
                        </td>
                        <td className="p-3 font-mono font-medium">
                          ₹{(p.totalBudget || 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={getStatusBadgeVariant(p.status)}>
                            {p.status.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="outline" className="h-7 text-xs">
                            Manage →
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlans.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlanId(p.id);
                      setIsDetailOpen(true);
                    }}
                    className="p-5 rounded-2xl border border-border bg-card hover:border-primary/50 transition-all cursor-pointer shadow-xs space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          {p.planNumber}
                        </span>
                        <Badge variant="outline" className={getStatusBadgeVariant(p.status)}>
                          {p.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-sm text-foreground line-clamp-2">{p.title}</h4>

                      <div className="text-[11px] text-muted-foreground space-y-1">
                        <div>Category: <strong className="text-foreground">{p.category?.name || "General"}</strong></div>
                        <div>Delivery: <strong className="text-foreground">{p.deliveryMethod || "HYBRID"}</strong> • Trainer: {p.trainerName || "TBD"}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground">Budget</span>
                        <div className="font-mono font-bold text-foreground">₹{(p.totalBudget || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground">Cohort</span>
                        <div className="font-bold text-foreground">{p._count?.enrollments || 0} enrolled</div>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        Details →
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* Sub-view 2: Delivery Sessions & Attendance */}
          {initiativesSubView === "sessions" && (
            filteredSessions.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-card">
                No delivery sessions found matching this view. Schedule a new session to organize classes.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSessions.map((sess) => (
                  <div
                    key={sess.id}
                    className="p-5 rounded-2xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                          Session #{sess.sessionNumber}
                        </span>
                        <Badge variant="outline" className={getStatusBadgeVariant(sess.status)}>
                          {sess.status}
                        </Badge>
                      </div>

                      <h4 className="font-bold text-sm text-foreground line-clamp-1">{sess.title}</h4>
                      <div className="text-[11px] text-primary font-medium">{sess.plan?.title}</div>

                      <div className="text-xs text-muted-foreground space-y-1 pt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{new Date(sess.startTime).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {sess.deliveryMethod === "ONLINE" ? (
                            <Video className="w-3.5 h-3.5 text-blue-500" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span className="truncate">{sess.venueOrLink || "TBD"}</span>
                        </div>
                        <div>Trainer: <strong className="text-foreground">{sess.trainerName || sess.trainerEmployee?.firstName || "Assigned Trainer"}</strong></div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {sess._count?.attendances || 0} Attendees
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7 gap-1"
                        onClick={() => {
                          setActiveAttendanceSessionId(sess.id);
                          setIsAttendanceOpen(true);
                        }}
                      >
                        <UserCheck className="w-3.5 h-3.5 text-primary" />
                        Record Attendance
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* PILLAR 2: SKILL GAPS & ROLE READINESS (IDENTIFY NEEDS) */}
        {/* ======================================================== */}
        <TabsContent value="gaps" className="space-y-6">
          {/* Skill Gap Engine Highlight Banner */}
          <div className="p-6 rounded-2xl border border-primary/30 bg-primary/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-base font-bold text-foreground">
                  Universal Skill Gap & Role Readiness Engine
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Compare employee competencies directly against target designations. Missing skills immediately feed into the training formulation pipeline.
              </p>
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
              <Button
                size="sm"
                onClick={() => setIsSkillGapOpen(true)}
                className="gap-1.5 text-xs bg-primary text-primary-foreground shadow-sm"
              >
                <Target className="w-3.5 h-3.5" />
                Launch Skill Gap Analyzer
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsConfigureMatrixOpen(true)}
                className="gap-1.5 text-xs"
              >
                <Layers className="w-3.5 h-3.5 text-primary" />
                Configure Role Requirements
              </Button>
            </div>
          </div>

          {/* Master Organizational Competency Taxonomy */}
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Organizational Competency Framework</h3>
                <p className="text-xs text-muted-foreground">
                  Standard skills, proficiency benchmarks, and evaluation methodologies across the company.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsAssessEmployeeOpen(true)}
                  className="text-xs gap-1.5"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Assess Employee Skill
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsNewCompetencyOpen(true)}
                  className="text-xs gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Competency
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {competencies.map((comp) => (
                <div
                  key={comp.id}
                  className="p-4 rounded-xl bg-card border border-border shadow-xs hover:border-primary/40 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {comp.code}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {comp.category}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-foreground">{comp.name}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {comp.description || "Company competency benchmark."}
                  </p>
                  <div className="text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                    Assessment: <span className="font-medium text-foreground">{comp.assessmentMethod.replace(/_/g, " ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* PILLAR 3: POST-TRAINING PROOF & SKILLS (AFTER-TRAINING PHASE) */}
        {/* ======================================================== */}
        <TabsContent value="post-training" className="space-y-4">
          {/* Informational Callout: Core HR Sync */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold text-emerald-800 dark:text-emerald-200">
                  Automatic Employee Competency Upgrade
                </span>
                <p className="text-muted-foreground mt-0.5">
                  Verified certifications, passed practical exams, and approved evaluations automatically upgrade employee skill ratings in core HR personnel profiles.
                </p>
              </div>
            </div>
          </div>

          {/* Sub-tab Switcher: Certificates vs Manager Evaluations vs Practical Exams */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-xl border border-border">
            <div className="flex items-center space-x-2">
              <div className="flex items-center border border-border rounded-lg p-0.5 bg-muted/40 text-xs">
                <button
                  onClick={() => setPostTrainingSubTab("certificates")}
                  className={`px-3 py-1.5 rounded-md font-semibold ${
                    postTrainingSubTab === "certificates"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Verified Certificates ({certificates.length})
                </button>
                <button
                  onClick={() => setPostTrainingSubTab("evaluations")}
                  className={`px-3 py-1.5 rounded-md font-semibold ${
                    postTrainingSubTab === "evaluations"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Manager Post-Training Reviews ({evaluations.length})
                </button>
                <button
                  onClick={() => setPostTrainingSubTab("assessments")}
                  className={`px-3 py-1.5 rounded-md font-semibold ${
                    postTrainingSubTab === "assessments"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Practical Demonstrations & Exams ({allAssessments.length})
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {postTrainingSubTab === "certificates" && (
                <Button size="sm" className="text-xs gap-1.5" onClick={() => setIsNewCertificateOpen(true)}>
                  <Award className="w-3.5 h-3.5" />
                  Register Certificate
                </Button>
              )}
              {postTrainingSubTab === "assessments" && (
                <Button size="sm" className="text-xs gap-1.5" onClick={() => setIsNewAssessmentOpen(true)}>
                  <Plus className="w-3.5 h-3.5" />
                  Record Practical Exam
                </Button>
              )}
            </div>
          </div>

          {/* Sub-View 1: Certificates & Credentials */}
          {postTrainingSubTab === "certificates" && (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-3">Certificate / Qualification</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Issuing Organization</th>
                    <th className="p-3">Issue Date</th>
                    <th className="p-3">Expiration Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Official Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {certificates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No certificates recorded yet. Click &quot;Register Certificate&quot; to log credentials.
                      </td>
                    </tr>
                  ) : (
                    certificates.map((cert) => {
                      const isExpired = cert.expiryDate && new Date(cert.expiryDate) < new Date();
                      return (
                        <tr key={cert.id}>
                          <td className="p-3 font-semibold text-foreground">
                            {cert.title}
                            {cert.certificateNumber && (
                              <div className="text-[10px] font-mono text-muted-foreground">
                                #{cert.certificateNumber}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-medium">
                            {cert.employee?.firstName} {cert.employee?.lastName}
                            <div className="text-[10px] text-muted-foreground">{cert.employee?.employeeCode}</div>
                          </td>
                          <td className="p-3 text-muted-foreground">{cert.issuingOrganization}</td>
                          <td className="p-3 text-muted-foreground">
                            {new Date(cert.issueDate).toLocaleDateString()}
                          </td>
                          <td className="p-3 font-medium">
                            {cert.expiryDate ? (
                              <span className={isExpired ? "text-rose-600 font-bold" : "text-foreground"}>
                                {new Date(cert.expiryDate).toLocaleDateString()}{" "}
                                {isExpired && "(Expired)"}
                              </span>
                            ) : (
                              "Lifetime / No Expiry"
                            )}
                          </td>
                          <td className="p-3">
                            <Badge
                              variant="outline"
                              className={
                                cert.verificationStatus === "VERIFIED"
                                  ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                  : "bg-muted text-muted-foreground"
                              }
                            >
                              {cert.verificationStatus}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            {cert.verificationStatus !== "VERIFIED" ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                onClick={() => handleVerifyCertificate(cert.id)}
                              >
                                Verify
                              </Button>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium">✓ Verified & Profile Synced</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-View 2: Manager Post-Training Evaluations */}
          {postTrainingSubTab === "evaluations" && (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-3">Employee</th>
                    <th className="p-3">Training Initiative</th>
                    <th className="p-3">Effectiveness Rating</th>
                    <th className="p-3">Manager Notes & Impact</th>
                    <th className="p-3">Recommended Career Outcome</th>
                    <th className="p-3 text-right">Career Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {evaluations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">
                        No manager post-training reviews recorded yet. Evaluations can be recorded once employee cohort participation is completed.
                      </td>
                    </tr>
                  ) : (
                    evaluations.map((ev) => (
                      <tr key={ev.id}>
                        <td className="p-3 font-semibold text-foreground">
                          {ev.employee?.firstName} {ev.employee?.lastName}
                          <div className="text-[10px] text-muted-foreground">{ev.employee?.employeeCode}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {ev.plan?.title || "Plan"}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1 font-bold text-amber-600">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{ev.trainingEffectivenessRating}/5</span>
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs">
                          <p className="line-clamp-2 italic">&quot;{ev.managerEvaluationNotes}&quot;</p>
                          {ev.businessImpact && (
                            <span className="text-[10px] text-foreground font-medium">Impact: {ev.businessImpact}</span>
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="font-semibold text-primary bg-primary/10 border-primary/20">
                            {ev.recommendedOutcome.replace(/_/g, " ")}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {[
                            "RECOMMEND_PROMOTION",
                            "INITIATE_TRANSFER",
                            "RECOMMEND_ROLE_CHANGE",
                          ].includes(ev.recommendedOutcome) && !ev.positionChange ? (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-primary text-primary-foreground gap-1"
                              onClick={() => {
                                setActivePosChangePlanId(ev.planId);
                                setActivePosChangeEmpId(ev.employeeId);
                                setActivePosChangeEvalId(ev.id);
                                setIsPosChangeOpen(true);
                              }}
                            >
                              <TrendingUp className="w-3.5 h-3.5" />
                              Initiate Change
                            </Button>
                          ) : ev.positionChange ? (
                            <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                              Change Initiated ({ev.positionChange.status})
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Role Retained</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Sub-View 3: Practical Exams & Benchmarks */}
          {postTrainingSubTab === "assessments" && (
            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-3">Assessment Title / Type</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Training Plan</th>
                    <th className="p-3">Benchmark</th>
                    <th className="p-3">Score Achieved</th>
                    <th className="p-3">Result</th>
                    <th className="p-3">Evaluator / Date</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredAssessments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-muted-foreground">
                        No practical assessment records found. Click &quot;Record Practical Exam&quot; to add one.
                      </td>
                    </tr>
                  ) : (
                    filteredAssessments.map((a) => (
                      <tr key={a.id}>
                        <td className="p-3 font-semibold text-foreground">
                          {a.title}
                          <div className="text-[10px] text-muted-foreground">{a.assessmentType.replace(/_/g, " ")}</div>
                        </td>
                        <td className="p-3 font-medium">
                          {a.employee?.firstName} {a.employee?.lastName}
                          <div className="text-[10px] text-muted-foreground">{a.employee?.employeeCode}</div>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          {a.plan?.title || "Plan"}
                        </td>
                        <td className="p-3 font-mono">
                          {a.passingScore}%
                        </td>
                        <td className="p-3 font-mono font-bold">
                          {a.scoreAchieved !== null && a.scoreAchieved !== undefined ? `${a.scoreAchieved}/${a.maxScore}` : "Pending"}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              a.result === "PASSED"
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                : a.result === "FAILED"
                                ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                                : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                            }
                          >
                            {a.result}
                          </Badge>
                        </td>
                        <td className="p-3 text-muted-foreground">
                          <div>{a.assessor?.firstName} {a.assessor?.lastName || a.assessorName || "Certifier"}</div>
                          <div className="text-[10px]">{a.assessedAt ? new Date(a.assessedAt).toLocaleDateString() : "Pending"}</div>
                        </td>
                        <td className="p-3 text-right">
                          {a.result === "PENDING" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                              onClick={() => {
                                setGradingAssessment(a);
                                setIsGradeAssessmentOpen(true);
                              }}
                            >
                              Grade Exam
                            </Button>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-mono">Graded</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ======================================================== */}
        {/* PILLAR 4: PROMOTIONS & ROI GOVERNANCE (THE PAYOFF & DECISIONS) */}
        {/* ======================================================== */}
        <TabsContent value="career" className="space-y-6">
          {/* Post-Training Personnel Progression Register */}
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Personnel Changes & Post-Training Progression</h3>
                <p className="text-xs text-muted-foreground">
                  Training outcomes never automatically bypass management review. All career changes route through formal multi-stage approval.
                </p>
              </div>
              <Button
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => {
                  setActivePosChangePlanId(null);
                  setActivePosChangeEmpId(null);
                  setActivePosChangeEvalId(undefined);
                  setIsPosChangeOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                Propose Promotion / Transfer
              </Button>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-card shadow-xs">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-3">Change # / Type</th>
                    <th className="p-3">Employee</th>
                    <th className="p-3">Current → Proposed Role</th>
                    <th className="p-3">Reason / Training Outcome</th>
                    <th className="p-3">Effective Date</th>
                    <th className="p-3">Approval Status</th>
                    <th className="p-3 text-right">Official Application</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {positionChanges.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">
                        No pending position changes. Once post-training reviews recommend career progression, decisions will appear here.
                      </td>
                    </tr>
                  ) : (
                    positionChanges.map((pc) => (
                      <tr key={pc.id}>
                        <td className="p-3">
                          <div className="font-bold text-foreground">{pc.changeType}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{pc.changeNumber}</div>
                        </td>
                        <td className="p-3 font-medium">
                          {pc.employee.firstName} {pc.employee.lastName}
                          <div className="text-[10px] text-muted-foreground">{pc.employee.employeeCode}</div>
                        </td>
                        <td className="p-3">
                          <div className="text-muted-foreground">{pc.currentDesignation?.name || "Current Role"}</div>
                          <div className="font-semibold text-primary">
                            → {pc.proposedDesignation?.name || "Same Designation"}
                          </div>
                        </td>
                        <td className="p-3 text-muted-foreground max-w-xs truncate">
                          {pc.reason}
                        </td>
                        <td className="p-3 font-medium">
                          {new Date(pc.proposedEffectiveDate).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={
                              pc.status === "APPLIED"
                                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                                : pc.status === "APPROVED"
                                ? "bg-indigo-500/15 text-indigo-600 border-indigo-500/30"
                                : pc.status === "REJECTED"
                                ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                                : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                            }
                          >
                            {pc.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          {pc.status === "APPROVED" && (
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleApplyPositionChange(pc.id)}
                            >
                              Apply Change
                            </Button>
                          )}
                          {pc.status === "APPLIED" && (
                            <span className="text-[11px] text-emerald-600 font-medium">
                              ✓ Record Applied
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Training ROI & Departmental Participation Summary */}
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Departmental Participation & Learning ROI</h3>
                <p className="text-xs text-muted-foreground">
                  Track employee completion rates, logged learning hours, and budget variance by department.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExportReportsCSV}>
                  <Download className="w-3.5 h-3.5" />
                  Export Plans CSV
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleExportDeptCSV}>
                  <Download className="w-3.5 h-3.5 text-primary" />
                  Export Dept Summary CSV
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Budget vs Actual Spend Variance</h4>
                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget Allocated:</span>
                    <span className="font-mono font-bold">₹{(kpis.totalPlannedBudget || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual Spend Incurred:</span>
                    <span className="font-mono font-bold text-primary">₹{(kpis.actualExpenditure || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Net Surplus Variance:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      ₹{((kpis.totalPlannedBudget || 0) - (kpis.actualExpenditure || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/20 border border-border space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Participation & Outcomes</h4>
                <div className="space-y-1.5 text-xs pt-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Enrollments:</span>
                    <span className="font-semibold">{kpis.totalEnrollments || 0} Staff</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Completed Cohorts:</span>
                    <span className="font-semibold text-emerald-600">{kpis.completedEnrollments || 0}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Organization Completion Rate:</span>
                    <span className="font-bold text-primary">{kpis.completionRate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Department Breakdown Table */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left text-muted-foreground">
                    <th className="p-3">Department</th>
                    <th className="p-3">Staff Enrolled</th>
                    <th className="p-3">Completed Programs</th>
                    <th className="p-3">Total Hours Logged</th>
                    <th className="p-3 text-right">Completion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {departmentStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-muted-foreground">
                        No departmental training records found yet.
                      </td>
                    </tr>
                  ) : (
                    departmentStats.map((dept, i) => {
                      const rate = dept.enrolled > 0 ? Math.round((dept.completed / dept.enrolled) * 100) : 0;
                      return (
                        <tr key={i}>
                          <td className="p-3 font-semibold text-foreground">{dept.name}</td>
                          <td className="p-3">{dept.enrolled} Employees</td>
                          <td className="p-3 font-semibold text-emerald-600">{dept.completed}</td>
                          <td className="p-3 font-mono">{dept.hours} hrs</td>
                          <td className="p-3 text-right">
                            <span className="font-bold text-primary">{rate}%</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        {/* ======================================================== */}
        {/* PILLAR 5: MY LEARNING (PERSONAL EMPLOYEE VIEW) */}
        {/* ======================================================== */}
        <TabsContent value="my-learning" className="space-y-6">
          <div className="bg-card p-5 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  My Learning & Professional Development
                </h3>
                <p className="text-xs text-muted-foreground">
                  Track assigned training, attendance records, competency evaluations, and career progression.
                </p>
              </div>
            </div>

            {/* Employee Personal Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground">Assigned Programs</span>
                <div className="text-xl font-bold mt-1 text-foreground">
                  {myLearningData?.summary?.totalEnrolled || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground">Completed</span>
                <div className="text-xl font-bold mt-1 text-emerald-600">
                  {myLearningData?.summary?.completedCount || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground">Training Hours Logged</span>
                <div className="text-xl font-bold mt-1 text-primary">
                  {myLearningData?.summary?.totalHoursSpent || 0} hrs
                </div>
              </div>
              <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs">
                <span className="text-muted-foreground">Certificates Earned</span>
                <div className="text-xl font-bold mt-1 text-purple-600">
                  {myLearningData?.summary?.certificatesEarned || 0}
                </div>
              </div>
            </div>

            {/* My Active Enrollments */}
            <div className="space-y-3 pt-3">
              <h4 className="text-sm font-semibold text-foreground">My Training Enrollments</h4>
              {myLearningData?.enrollments?.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  You are not currently enrolled in any active training plans.
                </div>
              ) : (
                <div className="space-y-2">
                  {myLearningData?.enrollments?.map((enr: any) => (
                    <div
                      key={enr.id}
                      className="p-3.5 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-foreground text-sm">{enr.plan?.title}</div>
                        <div className="text-muted-foreground text-[11px] mt-0.5">
                          Category: {enr.plan?.category?.name || "General"} • Hours Logged: {enr.actualHoursSpent} hrs
                        </div>
                      </div>
                      <Badge variant="outline" className={getStatusBadgeVariant(enr.status)}>
                        {enr.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Verified Competencies & Skills */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">My Verified Competencies & Skills</h4>
                  <p className="text-xs text-muted-foreground">
                    Assessed skill levels recognized across the organization.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {myLearningData?.competencies?.length || 0} Skills Recorded
                </Badge>
              </div>

              {(!myLearningData?.competencies || myLearningData?.competencies?.length === 0) ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No verified skills recorded yet. Complete assigned training programs and assessments or request a manager evaluation.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myLearningData?.competencies?.map((comp: any) => (
                    <div
                      key={comp.id}
                      className="p-3.5 rounded-xl border border-border bg-muted/20 flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-sm text-foreground">
                            {comp.competency?.name || "Skill"}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Code: {comp.competency?.code} • Category: {comp.competency?.category || "Standard"}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={`text-xs font-semibold ${
                            comp.currentLevel === "EXPERT"
                              ? "bg-purple-500/10 text-purple-600 border-purple-300"
                              : comp.currentLevel === "ADVANCED"
                              ? "bg-blue-500/10 text-blue-600 border-blue-300"
                              : comp.currentLevel === "INTERMEDIATE"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-300"
                              : "bg-amber-500/10 text-amber-600 border-amber-300"
                          }`}
                        >
                          {comp.currentLevel}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Status: <strong className="text-foreground">{comp.verificationStatus || "VERIFIED"}</strong></span>
                        </div>
                        {comp.assessedBy && (
                          <span>Evaluated by: {comp.assessedBy.firstName} {comp.assessedBy.lastName}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* My Certificates & Qualifications */}
            <div className="space-y-3 pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">My Certificates & Qualifications</h4>
                  <p className="text-xs text-muted-foreground">
                    Credentials, licenses, and verified qualification records.
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {myLearningData?.certificates?.length || 0} Certificates
                </Badge>
              </div>

              {(!myLearningData?.certificates || myLearningData?.certificates?.length === 0) ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No certificates awarded yet. Passing training plan evaluations generates recognized credentials.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myLearningData?.certificates?.map((cert: any) => (
                    <div
                      key={cert.id}
                      className="p-3.5 rounded-xl border border-border bg-card flex items-start space-x-3"
                    >
                      <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-xs text-foreground">{cert.title}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Issuer: {cert.issuingOrganization}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-1">
                          Issued: {new Date(cert.issueDate).toLocaleDateString()}
                          {cert.certificateNumber && ` • #${cert.certificateNumber}`}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-300">
                        {cert.verificationStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ======================================================== */}
      {/* MODAL DIALOGS */}
      {/* ======================================================== */}
      <NewTrainingPlanModal
        isOpen={isNewPlanOpen}
        initialValues={newPlanInitialData}
        onClose={() => {
          setIsNewPlanOpen(false);
          setNewPlanInitialData(null);
        }}
        onSuccess={() => {
          loadAllData();
          setActiveTab("initiatives");
          setNewPlanInitialData(null);
        }}
      />

      <TrainingPlanDetailModal
        planId={selectedPlanId}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPlanId(null);
        }}
        onRefresh={loadAllData}
        userRole={user?.role}
        onOpenNewSession={(planId) => {
          setActiveSessionPlanId(planId);
          setIsNewSessionOpen(true);
        }}
        onOpenBatchAttendance={(sessionId) => {
          setActiveAttendanceSessionId(sessionId);
          setIsAttendanceOpen(true);
        }}
        onOpenNewEvaluation={(planId, employeeId) => {
          setActiveEvalPlanId(planId);
          setActiveEvalEmployeeId(employeeId);
          setIsNewEvalOpen(true);
        }}
        onOpenInitiatePositionChange={(planId, employeeId, evalId) => {
          setActivePosChangePlanId(planId);
          setActivePosChangeEmpId(employeeId);
          setActivePosChangeEvalId(evalId);
          setIsPosChangeOpen(true);
        }}
      />

      <NewSessionModal
        isOpen={isNewSessionOpen}
        planId={activeSessionPlanId}
        onClose={() => {
          setIsNewSessionOpen(false);
          setActiveSessionPlanId(null);
        }}
        onSuccess={loadAllData}
        plans={plans}
      />

      <BatchAttendanceModal
        isOpen={isAttendanceOpen}
        sessionId={activeAttendanceSessionId}
        onClose={() => {
          setIsAttendanceOpen(false);
          setActiveAttendanceSessionId(null);
        }}
        onSuccess={loadAllData}
      />

      <NewEvaluationModal
        isOpen={isNewEvalOpen}
        planId={activeEvalPlanId}
        employeeId={activeEvalEmployeeId}
        onClose={() => {
          setIsNewEvalOpen(false);
          setActiveEvalPlanId(null);
          setActiveEvalEmployeeId(null);
        }}
        onSuccess={loadAllData}
      />

      <InitiatePositionChangeModal
        isOpen={isPosChangeOpen}
        planId={activePosChangePlanId}
        employeeId={activePosChangeEmpId}
        evaluationId={activePosChangeEvalId}
        onClose={() => {
          setIsPosChangeOpen(false);
          setActivePosChangePlanId(null);
          setActivePosChangeEmpId(null);
          setActivePosChangeEvalId(undefined);
        }}
        onSuccess={loadAllData}
      />

      <SkillGapAnalysisModal
        isOpen={isSkillGapOpen}
        onClose={() => setIsSkillGapOpen(false)}
        onDraftPlanForGap={(gapInfo) => {
          setIsSkillGapOpen(false);
          setNewPlanInitialData({
            employeeIds: [gapInfo.employeeId],
            title: `Targeted Upskilling: ${gapInfo.competencyName}`,
            justification: `Skill Gap Identified for target role ${gapInfo.targetRole || "Career Advancement"}: Current Level ${gapInfo.currentLevel ?? 1} vs Required Level ${gapInfo.requiredLevel ?? 3}. Targeted initiative to bridge deficits.`,
            targetDesignationId: gapInfo.targetDesignationId,
            reason: "SKILL_GAP",
          });
          setIsNewPlanOpen(true);
        }}
      />

      <NewCompetencyModal
        isOpen={isNewCompetencyOpen}
        onClose={() => setIsNewCompetencyOpen(false)}
        onSuccess={loadAllData}
      />

      <ConfigureRoleMatrixModal
        isOpen={isConfigureMatrixOpen}
        onClose={() => setIsConfigureMatrixOpen(false)}
        onSuccess={loadAllData}
      />

      <AssessEmployeeSkillModal
        isOpen={isAssessEmployeeOpen}
        onClose={() => setIsAssessEmployeeOpen(false)}
        onSuccess={loadAllData}
      />

      <NewAssessmentModal
        isOpen={isNewAssessmentOpen}
        onClose={() => setIsNewAssessmentOpen(false)}
        onSuccess={loadAllData}
        plans={plans}
      />

      <GradeAssessmentModal
        assessment={gradingAssessment}
        isOpen={isGradeAssessmentOpen}
        onClose={() => {
          setIsGradeAssessmentOpen(false);
          setGradingAssessment(null);
        }}
        onSuccess={loadAllData}
      />

      <NewCertificateModal
        isOpen={isNewCertificateOpen}
        onClose={() => setIsNewCertificateOpen(false)}
        onSuccess={loadAllData}
        plans={plans}
      />

      <NewCategoryModal
        isOpen={isNewCategoryOpen}
        onClose={() => setIsNewCategoryOpen(false)}
        onSuccess={loadAllData}
      />
    </div>
  );
}
