"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Users,
  Award,
  DollarSign,
  TrendingUp,
  FileText,
  Loader2,
  Plus,
  Send,
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface TrainingPlanDetailModalProps {
  planId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  userRole?: string;
  onOpenNewSession?: (planId: string) => void;
  onOpenBatchAttendance?: (sessionId: string) => void;
  onOpenNewEvaluation?: (planId: string, employeeId: string) => void;
  onOpenInitiatePositionChange?: (planId: string, employeeId: string, evalId?: string) => void;
}

export default function TrainingPlanDetailModal({
  planId,
  isOpen,
  onClose,
  onRefresh,
  userRole,
  onOpenNewSession,
  onOpenBatchAttendance,
  onOpenNewEvaluation,
  onOpenInitiatePositionChange,
}: TrainingPlanDetailModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Review Dialog State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<"APPROVE" | "REJECT" | "CHANGES_REQUESTED">("APPROVE");
  const [reviewComments, setReviewComments] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Add Expense State
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [expenseCategory, setExpenseCategory] = useState("MATERIALS");
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseDesc, setExpenseDesc] = useState("");

  useEffect(() => {
    if (!isOpen || !planId) return;
    loadPlanDetails();
  }, [isOpen, planId]);

  const loadPlanDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/training/plans/${planId}`);
      setPlan(res.data);
    } catch (err) {
      console.error("Failed to load plan details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!confirm("Are you sure you want to submit this training plan for approval?")) return;
    try {
      setSubmittingAction(true);
      await api.post(`/training/plans/${planId}/submit`);
      toast("Training plan submitted for managerial review & budget approval", "success");
      await loadPlanDetails();
      onRefresh();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to submit plan", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmittingAction(true);
      await api.post(`/training/plans/${planId}/review`, {
        decision: reviewDecision,
        comments: reviewComments.trim() || undefined,
      });
      toast(`Plan ${reviewDecision.toLowerCase()} decision recorded`, "success");
      setIsReviewOpen(false);
      setReviewComments("");
      await loadPlanDetails();
      onRefresh();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setSubmittingAction(true);
      await api.patch(`/training/plans/${planId}/status`, { status: newStatus });
      toast(`Plan status updated to ${newStatus}`, "success");
      await loadPlanDetails();
      onRefresh();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || expenseAmount <= 0) {
      toast("Please enter a valid expense amount", "error");
      return;
    }
    try {
      setSubmittingAction(true);
      await api.post("/training/expenses", {
        planId,
        expenseCategory,
        amount: Number(expenseAmount),
        description: expenseDesc.trim() || undefined,
      });
      toast("Expense voucher recorded against plan budget", "success");
      setIsExpenseOpen(false);
      setExpenseAmount(0);
      setExpenseDesc("");
      await loadPlanDetails();
      onRefresh();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to record expense", "error");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (!isOpen) return null;

  const canApprove =
    userRole === "HR_HEAD" || userRole === "SUPER_ADMIN" || userRole === "OWNER";

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

  const totalActualExpenditure =
    plan?.expenses?.reduce((sum: number, exp: any) => sum + (exp.amount || 0), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-5xl max-h-[92vh] overflow-y-auto">
        {loading || !plan ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading training plan details...</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="border-b border-border pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {plan.planNumber}
                    </Badge>
                    <Badge variant="outline" className={getStatusBadgeVariant(plan.status)}>
                      {plan.status.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {plan.trainingType.replace(/_/g, " ")}
                    </Badge>
                  </div>
                  <DialogTitle className="text-2xl font-bold mt-1 text-foreground">
                    {plan.title}
                  </DialogTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Category: <span className="font-medium">{plan.category?.name || "General"}</span> • Reason:{" "}
                    <span className="font-medium">{plan.reason.replace(/_/g, " ")}</span> • Priority:{" "}
                    <span className="font-medium">{plan.priority}</span>
                  </p>
                </div>

                {/* Workflow Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  {plan.status === "DRAFT" && (
                    <Button
                      size="sm"
                      onClick={handleSubmitForApproval}
                      disabled={submittingAction}
                      className="gap-1.5"
                    >
                      <Send className="w-4 h-4" />
                      Submit For Approval
                    </Button>
                  )}

                  {plan.status === "PENDING_APPROVAL" && canApprove && (
                    <Button
                      size="sm"
                      onClick={() => setIsReviewOpen(true)}
                      disabled={submittingAction}
                      className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Check className="w-4 h-4" />
                      Review & Approve
                    </Button>
                  )}

                  {plan.status === "APPROVED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange("SCHEDULED")}
                      disabled={submittingAction}
                    >
                      Mark Scheduled
                    </Button>
                  )}

                  {plan.status === "SCHEDULED" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange("IN_PROGRESS")}
                      disabled={submittingAction}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Start Training
                    </Button>
                  )}

                  {plan.status === "IN_PROGRESS" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange("COMPLETED")}
                      disabled={submittingAction}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Mark Completed
                    </Button>
                  )}

                  {plan.status === "COMPLETED" && (
                    <div className="flex items-center gap-2">
                      {onOpenNewEvaluation && plan.enrollments?.length > 0 && (
                        <Button
                          size="sm"
                          onClick={() => {
                            const firstEmp = plan.enrollments[0]?.employee?.id;
                            if (firstEmp) onOpenNewEvaluation(plan.id, firstEmp);
                          }}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs gap-1.5 shadow-sm"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Log Manager Review
                        </Button>
                      )}
                      {onOpenInitiatePositionChange && plan.enrollments?.length > 0 && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const firstEmp = plan.enrollments[0]?.employee?.id;
                            if (firstEmp) onOpenInitiatePositionChange(plan.id, firstEmp);
                          }}
                          className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10 shadow-sm"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          Propose Promotion
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            {/* Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <div className="overflow-x-auto pb-1 -mb-1 scrollbar-none">
                <TabsList className="inline-flex h-auto w-auto min-w-full items-center justify-start gap-1 p-1 bg-muted/60 border border-border/50 rounded-xl">
                  <TabsTrigger value="overview" className="text-xs px-3 py-1.5 whitespace-nowrap shrink-0">Overview</TabsTrigger>
                  <TabsTrigger value="sessions" className="text-xs px-3 py-1.5 whitespace-nowrap shrink-0">
                    Sessions ({plan.sessions?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="participants" className="text-xs px-3 py-1.5 whitespace-nowrap shrink-0">
                    Participants ({plan.enrollments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="assessments" className="text-xs px-3 py-1.5 whitespace-nowrap shrink-0">
                    Assessments ({plan.assessments?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="career" className="text-xs px-3 py-1.5 whitespace-nowrap shrink-0">
                    Career ({plan.evaluations?.length || 0})
                  </TabsTrigger>
                  <TabsTrigger value="expenses" className="text-xs px-3 py-1.5 whitespace-nowrap shrink-0">
                    Budget & Expenses
                  </TabsTrigger>
                  <TabsTrigger value="approvals" className="text-xs px-3 py-1.5 whitespace-nowrap shrink-0">
                    Audit & Approvals
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: OVERVIEW */}
              <TabsContent value="overview" className="space-y-4 pt-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2 md:col-span-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                      Business Justification & Goals
                    </h4>
                    <p className="text-sm text-foreground whitespace-pre-line">
                      {plan.businessJustification || "No explicit justification provided."}
                    </p>
                    {plan.notes && (
                      <div className="mt-3 pt-3 border-t border-border/60">
                        <span className="text-xs font-medium text-muted-foreground">Internal Notes:</span>
                        <p className="text-xs text-foreground mt-0.5">{plan.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="bg-muted/40 p-4 rounded-xl border border-border space-y-2.5 text-xs">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                      Arrangements & Schedule
                    </h4>
                    <div>
                      <span className="text-muted-foreground">Provider:</span>{" "}
                      <span className="font-semibold text-foreground">
                        {plan.providerType} {plan.providerName ? `(${plan.providerName})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Trainer:</span>{" "}
                      <span className="font-semibold text-foreground">
                        {plan.trainerName || plan.trainerEmployee?.firstName || "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Delivery:</span>{" "}
                      <span className="font-semibold text-foreground">{plan.deliveryMethod}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Venue / Link:</span>{" "}
                      <span className="font-semibold text-foreground">{plan.venueOrLink || "TBD"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Duration:</span>{" "}
                      <span className="font-semibold text-foreground">{plan.plannedHours} Hours</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Window:</span>{" "}
                      <span className="font-semibold text-foreground">
                        {plan.startDate ? new Date(plan.startDate).toLocaleDateString() : "TBD"} -{" "}
                        {plan.endDate ? new Date(plan.endDate).toLocaleDateString() : "TBD"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Career Outcome Banner */}
                {(plan.targetDesignation || plan.targetDepartment) && (
                  <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-semibold text-foreground">
                          Associated Career Advancement Target
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Successful completion and competency achievement qualifies participants for review for:{" "}
                        <span className="font-semibold text-primary">
                          {plan.targetDesignation?.name || "Current Designation"}
                        </span>{" "}
                        in <span className="font-semibold">{plan.targetDepartment?.name || "Current Department"}</span>.
                      </p>
                    </div>
                    {plan.proposedEffectiveDate && (
                      <Badge variant="outline" className="text-xs font-normal">
                        Proposed Effective: {new Date(plan.proposedEffectiveDate).toLocaleDateString()}
                      </Badge>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: SESSIONS & SCHEDULING */}
              <TabsContent value="sessions" className="space-y-4 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Scheduled Cohort Sessions</h4>
                  {onOpenNewSession && (
                    <Button size="sm" onClick={() => onOpenNewSession(plan.id)} className="gap-1.5 text-xs">
                      <Plus className="w-3.5 h-3.5" />
                      Add Session
                    </Button>
                  )}
                </div>

                {plan.sessions?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                    No sessions scheduled yet. Click &quot;Add Session&quot; to define timetable and assign trainer.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {plan.sessions?.map((sess: any) => (
                      <div
                        key={sess.id}
                        className="p-4 rounded-xl border border-border bg-card space-y-2 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary">
                            Session #{sess.sessionNumber}: {sess.title}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {sess.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <div className="flex items-center">
                            <Clock className="w-3.5 h-3.5 mr-1 text-muted-foreground/70" />
                            {new Date(sess.startTime).toLocaleString()} -{" "}
                            {new Date(sess.endTime).toLocaleTimeString()}
                          </div>
                          <div>Trainer: {sess.trainerName || sess.trainerEmployee?.firstName || "TBD"}</div>
                          <div>Venue: {sess.venueOrLink || "TBD"}</div>
                          <div>Capacity: {sess.capacity} seats</div>
                        </div>

                        {onOpenBatchAttendance && (
                          <div className="pt-2 border-t border-border/60 flex justify-end">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-xs h-7 gap-1"
                              onClick={() => onOpenBatchAttendance(sess.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              Mark Session Attendance
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: PARTICIPANTS & ATTENDANCE */}
              <TabsContent value="participants" className="space-y-4 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    Enrolled Employees ({plan.enrollments?.length || 0})
                  </h4>
                </div>

                {plan.enrollments?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                    No employees enrolled in this plan.
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr className="text-left text-muted-foreground">
                          <th className="p-3">Employee</th>
                          <th className="p-3">Designation / Dept</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Hours Spent</th>
                          <th className="p-3">Attendance %</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {plan.enrollments?.map((enr: any) => (
                          <tr key={enr.id} className="hover:bg-muted/30">
                            <td className="p-3 font-medium text-foreground">
                              {enr.employee.firstName} {enr.employee.lastName}
                              <div className="text-[11px] text-muted-foreground font-normal">
                                {enr.employee.employeeCode}
                              </div>
                            </td>
                            <td className="p-3 text-muted-foreground">
                              {enr.employee.designation?.name || "Unassigned"} •{" "}
                              {enr.employee.department?.name || "Unassigned"}
                            </td>
                            <td className="p-3">
                              <Badge variant="outline" className="text-[10px]">
                                {enr.status}
                              </Badge>
                            </td>
                            <td className="p-3">{enr.actualHoursSpent} hrs</td>
                            <td className="p-3">
                              <span className="font-semibold text-primary">
                                {enr.completionPercentage}%
                              </span>
                            </td>
                            <td className="p-3 text-right space-x-1">
                              {onOpenNewEvaluation && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-[11px] h-7"
                                  onClick={() => onOpenNewEvaluation(plan.id, enr.employee.id)}
                                >
                                  Post-Training Evaluation
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: ASSESSMENTS & CERTIFICATES */}
              <TabsContent value="assessments" className="space-y-4 pt-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">Assessments & Verifications</h4>
                </div>

                {plan.assessments?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                    No assessments recorded for this plan yet. Practical evaluations and examinations will appear here.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plan.assessments?.map((asmt: any) => (
                      <div
                        key={asmt.id}
                        className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {asmt.title} ({asmt.assessmentType.replace(/_/g, " ")})
                          </div>
                          <div className="text-muted-foreground text-[11px]">
                            Passing Score: {asmt.passingScore}% • Score Achieved:{" "}
                            {asmt.scoreAchieved !== null ? `${asmt.scoreAchieved}%` : "Pending Grading"} •
                            Assessor: {asmt.assessorName || "Staff Assessor"}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            asmt.result === "PASSED"
                              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                              : asmt.result === "FAILED"
                              ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                              : "bg-muted text-muted-foreground"
                          }
                        >
                          {asmt.result}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 5: POST-TRAINING CAREER PROGRESSION */}
              <TabsContent value="career" className="space-y-4 pt-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Post-Training Career Decisions</h4>
                    <p className="text-xs text-muted-foreground">
                      Structured evaluations governing promotions, transfers, and competency authorizations.
                    </p>
                  </div>
                </div>

                {plan.evaluations?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                    No post-training evaluations completed yet. Evaluations can be recorded once employee participation is concluded.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {plan.evaluations?.map((ev: any) => (
                      <div
                        key={ev.id}
                        className="p-4 rounded-xl border border-border bg-card space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-foreground">
                              {ev.employee?.firstName} {ev.employee?.lastName}
                            </span>
                            <span className="text-muted-foreground ml-2">
                              • Evaluated by {ev.evaluator?.firstName || "Manager"} on{" "}
                              {new Date(ev.evaluationDate).toLocaleDateString()}
                            </span>
                          </div>
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 font-semibold">
                            Outcome: {ev.recommendedOutcome.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground bg-muted/40 p-2.5 rounded-lg italic">
                          &quot;{ev.managerEvaluationNotes}&quot;
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-border/60">
                          <span className="text-[11px] text-muted-foreground">
                            Effectiveness Rating: {ev.trainingEffectivenessRating}/5 • Status: {ev.actionStatus}
                          </span>

                          {/* Initiate Position Change CTA if promotion or transfer recommended */}
                          {[
                            "RECOMMEND_PROMOTION",
                            "INITIATE_TRANSFER",
                            "RECOMMEND_ROLE_CHANGE",
                            "UPDATE_APPROVED_GRADE_DESIGNATION",
                          ].includes(ev.recommendedOutcome) &&
                            !ev.positionChange &&
                            onOpenInitiatePositionChange && (
                              <Button
                                size="sm"
                                className="h-7 text-xs gap-1 bg-primary text-primary-foreground"
                                onClick={() =>
                                  onOpenInitiatePositionChange(plan.id, ev.employee.id, ev.id)
                                }
                              >
                                <TrendingUp className="w-3.5 h-3.5" />
                                Initiate Official Position Change
                              </Button>
                            )}

                          {ev.positionChange && (
                            <Badge variant="outline" className="text-emerald-600 bg-emerald-500/10 border-emerald-500/30">
                              Position Change Processed ({ev.positionChange.changeNumber} - {ev.positionChange.status})
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* TAB 6: BUDGET & EXPENSES */}
              <TabsContent value="expenses" className="space-y-4 pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-xs font-mono">
                      Planned: ₹{(plan.totalBudget || 0).toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-mono text-primary bg-primary/10">
                      Actual: ₹{totalActualExpenditure.toLocaleString()}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`text-xs font-mono ${
                        totalActualExpenditure > plan.totalBudget
                          ? "text-rose-500 bg-rose-500/10"
                          : "text-emerald-500 bg-emerald-500/10"
                      }`}
                    >
                      Variance: ₹{(plan.totalBudget - totalActualExpenditure).toLocaleString()}
                    </Badge>
                  </div>

                  <Button size="sm" onClick={() => setIsExpenseOpen(true)} className="gap-1.5 text-xs">
                    <Plus className="w-3.5 h-3.5" />
                    Record Expense
                  </Button>
                </div>

                {plan.expenses?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                    No expense items logged yet. Record travel, registration, instructor fees, or certification charges.
                  </div>
                ) : (
                  <div className="border border-border rounded-xl overflow-hidden bg-card">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50 border-b border-border">
                        <tr className="text-left text-muted-foreground">
                          <th className="p-3">Category</th>
                          <th className="p-3">Description</th>
                          <th className="p-3">Date</th>
                          <th className="p-3 text-right">Amount (INR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {plan.expenses?.map((exp: any) => (
                          <tr key={exp.id}>
                            <td className="p-3 font-semibold">{exp.expenseCategory}</td>
                            <td className="p-3 text-muted-foreground">{exp.description || "N/A"}</td>
                            <td className="p-3 text-muted-foreground">
                              {new Date(exp.date).toLocaleDateString()}
                            </td>
                            <td className="p-3 text-right font-mono font-medium">
                              ₹{exp.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* TAB 7: APPROVAL TIMELINE & AUDIT */}
              <TabsContent value="approvals" className="space-y-4 pt-3">
                <h4 className="text-sm font-semibold">Governance & Approval Timeline</h4>
                {plan.approvals?.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground border border-dashed rounded-xl">
                    No approval actions logged yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {plan.approvals?.map((app: any) => (
                      <div
                        key={app.id}
                        className="p-3 rounded-xl border border-border bg-card flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-foreground">
                            {app.approver?.firstName} {app.approver?.lastName} ({app.approver?.role})
                          </span>
                          <span className="text-muted-foreground ml-2">
                            • {new Date(app.createdAt).toLocaleString()}
                          </span>
                          {app.comments && (
                            <p className="text-[11px] text-muted-foreground mt-0.5 italic">
                              &quot;{app.comments}&quot;
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            app.status === "APPROVE"
                              ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
                              : app.status === "REJECT"
                              ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                              : "bg-amber-500/15 text-amber-600 border-amber-500/30"
                          }
                        >
                          {app.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Review Dialog Modal */}
            {isReviewOpen && (
              <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">
                      Review Training Plan: {plan.planNumber}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label>Decision</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant={reviewDecision === "APPROVE" ? "default" : "outline"}
                          className={reviewDecision === "APPROVE" ? "bg-emerald-600" : ""}
                          onClick={() => setReviewDecision("APPROVE")}
                        >
                          Approve
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={reviewDecision === "CHANGES_REQUESTED" ? "default" : "outline"}
                          className={reviewDecision === "CHANGES_REQUESTED" ? "bg-amber-600" : ""}
                          onClick={() => setReviewDecision("CHANGES_REQUESTED")}
                        >
                          Revisions
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={reviewDecision === "REJECT" ? "default" : "outline"}
                          className={reviewDecision === "REJECT" ? "bg-rose-600" : ""}
                          onClick={() => setReviewDecision("REJECT")}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Review Notes / Justification</Label>
                      <Textarea
                        placeholder="Provide comments or conditions for this decision..."
                        rows={3}
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsReviewOpen(false)}
                        disabled={submittingAction}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingAction}>
                        {submittingAction && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        Confirm Decision
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            {/* Record Expense Dialog Modal */}
            {isExpenseOpen && (
              <Dialog open={isExpenseOpen} onOpenChange={setIsExpenseOpen}>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold">
                      Record Training Expenditure
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateExpense} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label>Expense Category</Label>
                      <select
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                      >
                        <option value="REGISTRATION">Registration / Course Fees</option>
                        <option value="TRAINER_FEE">Instructor / Trainer Compensation</option>
                        <option value="TRAVEL">Travel & Transit</option>
                        <option value="ACCOMMODATION">Hotel / Accommodation</option>
                        <option value="MATERIALS">Study Materials & Equipment</option>
                        <option value="CERTIFICATION">Exam & Certification Fee</option>
                        <option value="VENUE">Venue & Catering</option>
                        <option value="MISC">Miscellaneous</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <Label>Amount (INR)</Label>
                      <input
                        type="number"
                        min="1"
                        className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Invoice number, vendor name, or expense details..."
                        rows={2}
                        value={expenseDesc}
                        onChange={(e) => setExpenseDesc(e.target.value)}
                      />
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsExpenseOpen(false)}
                        disabled={submittingAction}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submittingAction}>
                        {submittingAction && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        Save Expense
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}

            <DialogFooter className="pt-2 border-t border-border">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
