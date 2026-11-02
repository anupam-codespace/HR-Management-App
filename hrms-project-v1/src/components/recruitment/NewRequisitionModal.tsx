"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/ToastProvider";

interface NewRequisitionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  initialData?: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function NewRequisitionModal({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: NewRequisitionModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dropdowns data
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Skill tag input
  const [skillInput, setSkillInput] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    departmentId: "",
    designationId: "",
    positionsCount: 1,
    employmentType: "FULL_TIME",
    location: "",
    hiringReason: "NEW_POSITION",
    replacementForId: "",
    minExperienceYears: 0 as number | string,
    maxExperienceYears: 3 as number | string,
    minSalary: "",
    maxSalary: "",
    currency: "INR",
    expectedJoiningDate: "",
    isBudgeted: true,
    budgetAmount: "",
    requiredSkills: [] as string[],
    justification: "",
  });

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;

  useEffect(() => {
    if (open) {
      const headers = { Authorization: `Bearer ${getToken()}` };
      axios
        .get(`${API_URL}/organization/departments`, { headers })
        .then((res) => setDepartments(res.data || []))
        .catch(() => {});
      axios
        .get(`${API_URL}/organization/designations`, { headers })
        .then((res) => setDesignations(res.data || []))
        .catch(() => {});
      axios
        .get(`${API_URL}/employees`, { headers })
        .then((res) => setEmployees(res.data || []))
        .catch(() => {});

      if (initialData) {
        setFormData({
          departmentId: initialData.departmentId || "",
          designationId: initialData.designationId || "",
          positionsCount: initialData.positionsCount || 1,
          employmentType: initialData.employmentType || "FULL_TIME",
          location: initialData.location || "",
          hiringReason: initialData.hiringReason || "NEW_POSITION",
          replacementForId: initialData.replacementForId || "",
          minExperienceYears: initialData.minExperienceYears || 0,
          maxExperienceYears: initialData.maxExperienceYears || 3,
          minSalary: initialData.minSalary ? String(initialData.minSalary) : "",
          maxSalary: initialData.maxSalary ? String(initialData.maxSalary) : "",
          currency: initialData.currency || "INR",
          expectedJoiningDate: initialData.expectedJoiningDate
            ? initialData.expectedJoiningDate.split("T")[0]
            : "",
          isBudgeted: initialData.isBudgeted ?? true,
          budgetAmount: initialData.budgetAmount
            ? String(initialData.budgetAmount)
            : "",
          requiredSkills: initialData.requiredSkills || [],
          justification: initialData.justification || "",
        });
      } else {
        setFormData({
          departmentId: "",
          designationId: "",
          positionsCount: 1,
          employmentType: "FULL_TIME",
          location: "",
          hiringReason: "NEW_POSITION",
          replacementForId: "",
          minExperienceYears: 0,
          maxExperienceYears: 3,
          minSalary: "",
          maxSalary: "",
          currency: "INR",
          expectedJoiningDate: "",
          isBudgeted: true,
          budgetAmount: "",
          requiredSkills: [],
          justification: "",
        });
      }
      setStep(1);
    }
  }, [open, initialData]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !formData.requiredSkills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, trimmed],
      }));
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.filter((s) => s !== skill),
    }));
  };

  const handleSave = async (submitNow: boolean) => {
    if (!formData.departmentId || !formData.designationId) {
      toast("Please select both Department and Designation", "error");
      setStep(1);
      return;
    }

    setIsSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };
      const payload: any = {
        departmentId: formData.departmentId,
        designationId: formData.designationId,
        positionsCount: Number(formData.positionsCount) || 1,
        employmentType: formData.employmentType,
        location: formData.location || null,
        hiringReason: formData.hiringReason,
        replacementForId:
          formData.hiringReason === "REPLACEMENT"
            ? formData.replacementForId || null
            : null,
        minExperienceYears: Number(formData.minExperienceYears) || 0,
        maxExperienceYears: formData.maxExperienceYears
          ? Number(formData.maxExperienceYears)
          : null,
        minSalary: formData.minSalary ? Number(formData.minSalary) : null,
        maxSalary: formData.maxSalary ? Number(formData.maxSalary) : null,
        currency: formData.currency,
        expectedJoiningDate: formData.expectedJoiningDate || null,
        isBudgeted: formData.isBudgeted,
        budgetAmount: formData.budgetAmount
          ? Number(formData.budgetAmount)
          : null,
        requiredSkills: formData.requiredSkills,
        justification: formData.justification || null,
      };

      let reqId: string;
      if (initialData?.id) {
        await axios.patch(
          `${API_URL}/recruitment/manpower/${initialData.id}`,
          payload,
          { headers },
        );
        reqId = initialData.id;
        toast("Requisition updated successfully", "success");
      } else {
        const res = await axios.post(
          `${API_URL}/recruitment/manpower`,
          payload,
          { headers },
        );
        reqId = res.data.id;
        toast("Manpower requisition draft saved", "success");
      }

      if (submitNow) {
        await axios.post(
          `${API_URL}/recruitment/manpower/${reqId}/submit`,
          {},
          { headers },
        );
        toast("Requisition submitted for approval!", "success");
      }

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to save requisition";
      toast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">
                {initialData
                  ? "Edit Manpower Requisition"
                  : "New Manpower Requisition"}
              </DialogTitle>
              <DialogDescription>
                Follow the 3-step wizard to document headcount need,
                compensation, and justification.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Wizard Steps indicator */}
        <div className="flex items-center justify-between my-2 px-2 py-3 bg-muted/40 rounded-xl border">
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              1
            </span>
            <span
              className={`text-xs font-medium ${step === 1 ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              Role & Headcount
            </span>
          </div>
          <div className="h-[2px] w-8 bg-border" />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              2
            </span>
            <span
              className={`text-xs font-medium ${step === 2 ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              Compensation & Budget
            </span>
          </div>
          <div className="h-[2px] w-8 bg-border" />
          <div className="flex items-center gap-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              3
            </span>
            <span
              className={`text-xs font-medium ${step === 3 ? "text-primary font-semibold" : "text-muted-foreground"}`}
            >
              Skills & Justification
            </span>
          </div>
        </div>

        {/* STEP 1: Role & Headcount */}
        {step === 1 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Department *
                </label>
                <Select
                  value={formData.departmentId}
                  onValueChange={(val) =>
                    val && setFormData({ ...formData, departmentId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Designation / Role *
                </label>
                <Select
                  value={formData.designationId}
                  onValueChange={(val) =>
                    val && setFormData({ ...formData, designationId: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Designation" />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((desig) => (
                      <SelectItem key={desig.id} value={desig.id}>
                        {desig.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Headcount / Positions *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={formData.positionsCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      positionsCount: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Employment Type
                </label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(val) =>
                    val && setFormData({ ...formData, employmentType: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full Time</SelectItem>
                    <SelectItem value="PART_TIME">Part Time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERNSHIP">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Target Location
                </label>
                <Input
                  placeholder="e.g. Guwahati / Remote"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Hiring Reason *
                </label>
                <Select
                  value={formData.hiringReason}
                  onValueChange={(val) =>
                    val && setFormData({ ...formData, hiringReason: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW_POSITION">New Position</SelectItem>
                    <SelectItem value="REPLACEMENT">Replacement</SelectItem>
                    <SelectItem value="EXPANSION">Team Expansion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.hiringReason === "REPLACEMENT" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    Replacement For Employee
                  </label>
                  <Select
                    value={formData.replacementForId}
                    onValueChange={(val) =>
                      val && setFormData({ ...formData, replacementForId: val })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select outgoing employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.firstName} {emp.lastName} ({emp.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Compensation & Budget */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Min Experience (Years)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.minExperienceYears}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      minExperienceYears:
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Max Experience (Years)
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.maxExperienceYears}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxExperienceYears:
                        e.target.value === "" ? "" : parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Min Salary / LPA
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 600000"
                  value={formData.minSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, minSalary: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Max Salary / LPA
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 900000"
                  value={formData.maxSalary}
                  onChange={(e) =>
                    setFormData({ ...formData, maxSalary: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Currency
                </label>
                <Select
                  value={formData.currency}
                  onValueChange={(val) =>
                    val && setFormData({ ...formData, currency: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Target Joining Date
                </label>
                <Input
                  type="date"
                  value={formData.expectedJoiningDate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      expectedJoiningDate: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Allocated Budget Amount
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 1600000"
                  value={formData.budgetAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, budgetAmount: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Skills & Justification */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Required Skills
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g. Node.js, NestJS, PostgreSQL"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addSkill}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-muted/30 rounded-lg border">
                {formData.requiredSkills.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">
                    No skills added yet. Press Enter or click Add.
                  </span>
                ) : (
                  formData.requiredSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="gap-1 py-1 px-2 text-xs font-medium"
                    >
                      {skill}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-destructive"
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Business Justification & Need *
              </label>
              <Textarea
                rows={4}
                placeholder="Explain why this position is required, project deliverables, and team impact..."
                value={formData.justification}
                onChange={(e) =>
                  setFormData({ ...formData, justification: e.target.value })
                }
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between sm:justify-between border-t pt-4">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (
                    step === 1 &&
                    (!formData.departmentId || !formData.designationId)
                  ) {
                    toast("Department and Designation are required", "error");
                    return;
                  }
                  setStep((s) => s + 1);
                }}
              >
                Next <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={() => handleSave(false)}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSave(true)}
                  className="bg-primary text-primary-foreground font-semibold"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                  )}
                  Save & Submit
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
