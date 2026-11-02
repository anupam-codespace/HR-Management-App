"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Users,
  Sparkles,
  BookOpen,
  Calendar,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Info,
  Check,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface NewTrainingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialValues?: {
    employeeIds?: string[];
    title?: string;
    justification?: string;
    targetDesignationId?: string;
    categoryId?: string;
    reason?: string;
  } | null;
}

export default function NewTrainingPlanModal({
  isOpen,
  onClose,
  onSuccess,
  initialValues,
}: NewTrainingPlanModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Dropdown options
  const [categories, setCategories] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Step 1: Purpose & Program
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [programId, setProgramId] = useState("");
  const [trainingType, setTrainingType] = useState("GROUP");
  const [reason, setReason] = useState("SKILL_GAP");
  const [priority, setPriority] = useState("MEDIUM");
  const [businessJustification, setBusinessJustification] = useState("");

  // Step 2: Logistics & Schedule
  const [deliveryMethod, setDeliveryMethod] = useState("HYBRID");
  const [providerType, setProviderType] = useState("INTERNAL");
  const [providerName, setProviderName] = useState("");
  const [trainerName, setTrainerName] = useState("");
  const [venueOrLink, setVenueOrLink] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [plannedHours, setPlannedHours] = useState<number>(16);

  // Step 3: Budget & Career Target
  const [estimatedRegistrationCost, setEstimatedRegistrationCost] = useState<number>(0);
  const [estimatedTravelCost, setEstimatedTravelCost] = useState<number>(0);
  const [estimatedAccommodationCost, setEstimatedAccommodationCost] = useState<number>(0);
  const [estimatedMaterialCost, setEstimatedMaterialCost] = useState<number>(0);
  const [targetDesignationId, setTargetDesignationId] = useState("");
  const [targetDepartmentId, setTargetDepartmentId] = useState("");
  const [proposedEffectiveDate, setProposedEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");

  // Step 4: Participants
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      return;
    }
    loadDropdownData();
    if (initialValues) {
      if (initialValues.title) setTitle(initialValues.title);
      if (initialValues.justification) setBusinessJustification(initialValues.justification);
      if (initialValues.targetDesignationId) setTargetDesignationId(initialValues.targetDesignationId);
      if (initialValues.categoryId) setCategoryId(initialValues.categoryId);
      if (initialValues.reason) setReason(initialValues.reason);
      if (initialValues.employeeIds && initialValues.employeeIds.length > 0) {
        setSelectedEmployeeIds(initialValues.employeeIds);
        setTrainingType(initialValues.employeeIds.length === 1 ? "INDIVIDUAL" : "GROUP");
      }
    }
  }, [isOpen, initialValues]);

  const loadDropdownData = async () => {
    try {
      const [catRes, progRes, deptRes, desigRes, empRes] = await Promise.allSettled([
        api.get("/training/categories?onlyActive=true"),
        api.get("/training/programs?status=PUBLISHED"),
        api.get("/organization/departments"),
        api.get("/organization/designations"),
        api.get("/employees"),
      ]);

      if (catRes.status === "fulfilled") setCategories(catRes.value.data || []);
      if (progRes.status === "fulfilled") setPrograms(progRes.value.data || []);
      if (deptRes.status === "fulfilled") setDepartments(deptRes.value.data || []);
      if (desigRes.status === "fulfilled") setDesignations(desigRes.value.data || []);
      if (empRes.status === "fulfilled") setEmployees(empRes.value.data || []);
    } catch (err) {
      console.error("Error loading dropdown data:", err);
    }
  };

  const handleProgramSelect = (selectedId: string) => {
    setProgramId(selectedId);
    if (!selectedId || selectedId === "none") return;
    const prog = programs.find((p) => p.id === selectedId);
    if (prog) {
      if (!title) setTitle(prog.title);
      if (prog.categoryId) setCategoryId(prog.categoryId);
      if (prog.deliveryMethod) setDeliveryMethod(prog.deliveryMethod);
      if (prog.plannedHours) setPlannedHours(prog.plannedHours);
    }
  };

  const toggleEmployee = (empId: string) => {
    if (trainingType === "INDIVIDUAL") {
      setSelectedEmployeeIds([empId]);
    } else {
      setSelectedEmployeeIds((prev) =>
        prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
      );
    }
  };

  const selectAllFiltered = () => {
    if (trainingType === "INDIVIDUAL") return;
    const filteredIds = filteredEmployees.map((e) => e.id);
    setSelectedEmployeeIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const clearSelectedEmployees = () => {
    setSelectedEmployeeIds([]);
  };

  const totalCalculatedBudget =
    Number(estimatedRegistrationCost || 0) +
    Number(estimatedTravelCost || 0) +
    Number(estimatedAccommodationCost || 0) +
    Number(estimatedMaterialCost || 0);

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim()) {
        toast("Please provide a Training Plan Title before continuing", "error");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setStep(1);
      toast("Please provide a training plan title", "error");
      return;
    }

    try {
      setLoading(true);
      const payload: any = {
        title: title.trim(),
        categoryId: categoryId && categoryId !== "none" ? categoryId : undefined,
        programId: programId && programId !== "none" ? programId : undefined,
        trainingType,
        reason,
        priority,
        businessJustification: businessJustification.trim() || undefined,
        deliveryMethod,
        providerType,
        providerName: providerName.trim() || undefined,
        trainerName: trainerName.trim() || undefined,
        venueOrLink: venueOrLink.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        plannedHours: Number(plannedHours) || 0,
        totalBudget: totalCalculatedBudget,
        estimatedRegistrationCost: Number(estimatedRegistrationCost) || 0,
        estimatedTravelCost: Number(estimatedTravelCost) || 0,
        estimatedAccommodationCost: Number(estimatedAccommodationCost) || 0,
        estimatedMaterialCost: Number(estimatedMaterialCost) || 0,
        targetDesignationId:
          targetDesignationId && targetDesignationId !== "none"
            ? targetDesignationId
            : undefined,
        targetDepartmentId:
          targetDepartmentId && targetDepartmentId !== "none"
            ? targetDepartmentId
            : undefined,
        proposedEffectiveDate: proposedEffectiveDate
          ? new Date(proposedEffectiveDate).toISOString()
          : undefined,
        notes: notes.trim() || undefined,
        employeeIds: selectedEmployeeIds,
      };

      await api.post("/training/plans", payload);
      toast("Training plan formulated successfully", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Failed to create training plan:", err);
      toast(err.response?.data?.message || "Failed to create training plan", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((emp) => {
    if (selectedDeptFilter !== "all" && emp.departmentId !== selectedDeptFilter) {
      return false;
    }
    if (!employeeSearch) return true;
    const q = employeeSearch.toLowerCase();
    const name = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
    const code = (emp.employeeCode || "").toLowerCase();
    const dept = (emp.department?.name || "").toLowerCase();
    const role = (emp.designation?.name || emp.role || "").toLowerCase();
    return name.includes(q) || code.includes(q) || dept.includes(q) || role.includes(q);
  });

  const STEPS = [
    { id: 1, label: "Need & Objectives", icon: BookOpen },
    { id: 2, label: "Schedule & Delivery", icon: Calendar },
    { id: 3, label: "Budget & Career Path", icon: TrendingUp },
    { id: 4, label: "Participant Roster", icon: Users },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-5 pb-3 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                  Create Training & Career Development Plan
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Industry-independent workforce competency, schedule, budget, and governed promotion readiness.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1">
              Step {step} of 4
            </Badge>
          </div>

          {/* Stepper Wizard Bar */}
          <div className="grid grid-cols-4 gap-2 pt-4 pb-1">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isPassed = step > s.id;
              const isCurrent = step === s.id;
              return (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    if (s.id < step || title.trim()) setStep(s.id);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all border ${
                    isCurrent
                      ? "bg-primary text-primary-foreground border-primary shadow-sm font-semibold"
                      : isPassed
                      ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                      : "bg-muted/40 text-muted-foreground border-border/40 hover:bg-muted"
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] shrink-0 font-bold ${
                      isCurrent
                        ? "bg-primary-foreground text-primary"
                        : isPassed
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground border"
                    }`}
                  >
                    {isPassed ? <Check className="w-3 h-3" /> : s.id}
                  </div>
                  <span className="text-xs truncate hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>
        </DialogHeader>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: NEED & OBJECTIVES */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="space-y-1.5">
                <Label htmlFor="plan-title" className="text-sm font-medium">
                  Training Plan Title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="plan-title"
                  placeholder="e.g. Distributed Cloud Architecture / ICU Clinical Protocols / Quality Auditing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 text-sm font-medium"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Training Category</Label>
                  <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select industry category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Pre-configured Standard Template (Optional)
                  </Label>
                  <Select value={programId} onValueChange={(val) => handleProgramSelect(val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select template or custom plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Custom / Ad-hoc Training Plan)</SelectItem>
                      {programs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title} ({p.programCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Plan Scope & Type</Label>
                  <Select value={trainingType} onValueChange={(val) => setTrainingType(val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GROUP">Group / Cohort Training</SelectItem>
                      <SelectItem value="INDIVIDUAL">Individual Development Plan (IDP)</SelectItem>
                      <SelectItem value="DEPARTMENTAL">Departmental Operational Training</SelectItem>
                      <SelectItem value="COMPLIANCE">Mandatory Compliance & Safety</SelectItem>
                      <SelectItem value="ONBOARDING">New Hire Onboarding Academy</SelectItem>
                      <SelectItem value="CAREER_PROMOTION">Career Progression & Promotion Track</SelectItem>
                      <SelectItem value="SKILL_GAP">Target Skill Gap Remediation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Primary Driver / Reason</Label>
                  <Select value={reason} onValueChange={(val) => setReason(val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SKILL_GAP">Identified Competency Gap</SelectItem>
                      <SelectItem value="PERFORMANCE_REVIEW">Annual Performance Appraisal</SelectItem>
                      <SelectItem value="PROMOTION_REQUIREMENT">Target Promotion Prerequisite</SelectItem>
                      <SelectItem value="NEW_RESPONSIBILITY">New Project / Responsibility</SelectItem>
                      <SelectItem value="NEW_TECHNOLOGY">New Tool, System or Technology</SelectItem>
                      <SelectItem value="COMPLIANCE_REQUIREMENT">Statutory / Regulatory Compliance</SelectItem>
                      <SelectItem value="DEPARTMENTAL_NEED">Departmental Operational Demand</SelectItem>
                      <SelectItem value="CAREER_DEVELOPMENT">Employee Self-Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Priority Level</Label>
                  <Select value={priority} onValueChange={(val) => setPriority(val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low Priority</SelectItem>
                      <SelectItem value="MEDIUM">Medium Priority</SelectItem>
                      <SelectItem value="HIGH">High Priority</SelectItem>
                      <SelectItem value="CRITICAL">Critical / Urgent Statutory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Business Justification & Expected Outcomes
                </Label>
                <Textarea
                  placeholder="Detail why this training is needed, key skills to acquire, and expected operational return on investment..."
                  rows={3}
                  value={businessJustification}
                  onChange={(e) => setBusinessJustification(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>
          )}

          {/* STEP 2: SCHEDULE & DELIVERY */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Delivery Method</Label>
                  <Select value={deliveryMethod} onValueChange={(val) => setDeliveryMethod(val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ONLINE">Online Virtual (Zoom/Meet/LMS)</SelectItem>
                      <SelectItem value="CLASSROOM">Classroom / In-Person</SelectItem>
                      <SelectItem value="ON_THE_JOB">On-the-Job / Practical Demonstration</SelectItem>
                      <SelectItem value="HYBRID">Hybrid (Online + Hands-on Lab)</SelectItem>
                      <SelectItem value="EXTERNAL">External Workshop / Institute</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Training Provider</Label>
                  <Select value={providerType} onValueChange={(val) => setProviderType(val || "")}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INTERNAL">Internal Organization Trainer</SelectItem>
                      <SelectItem value="EXTERNAL">External Training Partner / Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">
                    {providerType === "EXTERNAL" ? "Institute / Vendor Name" : "Internal Division / Team"}
                  </Label>
                  <Input
                    placeholder={providerType === "EXTERNAL" ? "e.g. Siemens Academy / Coursera" : "e.g. Internal Architecture Guild"}
                    value={providerName}
                    onChange={(e) => setProviderName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Lead Trainer / Instructor</Label>
                  <Input
                    placeholder="e.g. Dr. Alex Morgan"
                    value={trainerName}
                    onChange={(e) => setTrainerName(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <Label className="text-xs font-medium text-muted-foreground">
                    Venue Location or Online Meeting Link
                  </Label>
                  <Input
                    placeholder="e.g. Training Hall A, 3rd Floor or https://meet.google.com/abc-defg-hij"
                    value={venueOrLink}
                    onChange={(e) => setVenueOrLink(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>

              {/* Planned Hours and quick preset pills */}
              <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    Planned Total Training Hours
                  </Label>
                  <span className="text-xs font-semibold text-primary">{plannedHours} Hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    step="0.5"
                    value={plannedHours}
                    onChange={(e) => setPlannedHours(parseFloat(e.target.value) || 0)}
                    className="h-9 w-32 text-sm"
                  />
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[8, 16, 24, 40, 80].map((h) => (
                      <button
                        type="button"
                        key={h}
                        onClick={() => setPlannedHours(h)}
                        className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                          plannedHours === h
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {h}h ({h <= 8 ? "1d" : `${h / 8}d`})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BUDGET & CAREER TARGET */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {/* Cost breakdown */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <Label className="text-sm font-semibold">Estimated Budget Breakdown (INR)</Label>
                  </div>
                  <Badge variant="outline" className="text-xs font-bold text-emerald-700 bg-emerald-50 border-emerald-300">
                    Total Estimated: ₹{totalCalculatedBudget.toLocaleString()}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1 p-3 rounded-lg border bg-card">
                    <span className="text-[11px] text-muted-foreground block">Registration / Fees</span>
                    <Input
                      type="number"
                      min="0"
                      value={estimatedRegistrationCost}
                      onChange={(e) => setEstimatedRegistrationCost(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1 p-3 rounded-lg border bg-card">
                    <span className="text-[11px] text-muted-foreground block">Travel & Logistics</span>
                    <Input
                      type="number"
                      min="0"
                      value={estimatedTravelCost}
                      onChange={(e) => setEstimatedTravelCost(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1 p-3 rounded-lg border bg-card">
                    <span className="text-[11px] text-muted-foreground block">Accommodation</span>
                    <Input
                      type="number"
                      min="0"
                      value={estimatedAccommodationCost}
                      onChange={(e) => setEstimatedAccommodationCost(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                  <div className="space-y-1 p-3 rounded-lg border bg-card">
                    <span className="text-[11px] text-muted-foreground block">Materials & Labs</span>
                    <Input
                      type="number"
                      min="0"
                      value={estimatedMaterialCost}
                      onChange={(e) => setEstimatedMaterialCost(parseFloat(e.target.value) || 0)}
                      className="h-8 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Career outcome section */}
              <div className="p-4 rounded-xl border border-border/80 bg-muted/20 space-y-3.5">
                <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  Target Career Progression & Readiness (Optional)
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 text-xs">
                  <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <p>
                    <strong>Non-Automatic Promotion Rule:</strong> Training completion documents target competency readiness for review. Official promotion or compensation revisions require separate governed approvals.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Target Position / Role</Label>
                    <Select value={targetDesignationId} onValueChange={(val) => setTargetDesignationId(val || "")}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Retain current position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Retain Current Position</SelectItem>
                        {designations.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">Target Department</Label>
                    <Select value={targetDepartmentId} onValueChange={(val) => setTargetDepartmentId(val || "")}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Same department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Retain Current Department</SelectItem>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      Proposed Effective Date
                    </Label>
                    <Input
                      type="date"
                      value={proposedEffectiveDate}
                      onChange={(e) => setProposedEffectiveDate(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PARTICIPANT ROSTER */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Enrolled Participants ({selectedEmployeeIds.length} Selected)
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {trainingType === "INDIVIDUAL"
                      ? "Individual Development Plan: Select 1 target employee"
                      : "Group Cohort: Select all employees who will attend this program"}
                  </p>
                </div>

                {trainingType !== "INDIVIDUAL" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllFiltered}
                      className="h-8 text-xs"
                    >
                      Select All Filtered ({filteredEmployees.length})
                    </Button>
                    {selectedEmployeeIds.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearSelectedEmployees}
                        className="h-8 text-xs text-muted-foreground hover:text-destructive"
                      >
                        Clear Selection
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, employee code, or role..."
                    className="pl-9 h-9 text-xs"
                    value={employeeSearch}
                    onChange={(e) => setEmployeeSearch(e.target.value)}
                  />
                </div>

                <Select value={selectedDeptFilter} onValueChange={(val) => setSelectedDeptFilter(val || "all")}>
                  <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Participant List */}
              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-border p-2 rounded-xl bg-card">
                {filteredEmployees.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    No matching employees found for the search or department filter.
                  </div>
                ) : (
                  filteredEmployees.map((emp) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-all border ${
                          isSelected
                            ? "bg-primary/10 border-primary text-foreground font-medium shadow-xs"
                            : "border-transparent hover:bg-muted/70 text-muted-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground border"
                            }`}
                          >
                            {(emp.firstName?.[0] || "") + (emp.lastName?.[0] || "")}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-xs">
                              {emp.firstName} {emp.lastName}
                            </span>
                            <span className="ml-2 text-muted-foreground text-[11px]">
                              ({emp.employeeCode || "No Code"})
                            </span>
                            <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 shrink-0" />
                              <span>{emp.department?.name || "General"}</span>
                              <span>•</span>
                              <span>{emp.designation?.name || emp.role}</span>
                            </div>
                          </div>
                        </div>

                        <Badge
                          variant={isSelected ? "default" : "outline"}
                          className={`text-[10px] px-2 py-0.5 transition-all ${
                            isSelected ? "bg-primary text-primary-foreground" : ""
                          }`}
                        >
                          {isSelected ? (
                            <span className="flex items-center gap-1">
                              <Check className="w-3 h-3" /> Enrolled
                            </span>
                          ) : (
                            "+ Enroll"
                          )}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </form>

        {/* Modal Footer Controls */}
        <DialogFooter className="p-4 border-t bg-muted/10 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-xs h-9"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="gap-1.5 text-xs h-9"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </Button>
            )}

            {step < 4 ? (
              <Button
                type="button"
                onClick={handleNext}
                className="gap-1.5 text-xs h-9"
              >
                Next Step
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="gap-2 text-xs h-9 font-semibold bg-primary"
              >
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <Sparkles className="w-3.5 h-3.5" />
                Create Training Plan
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
