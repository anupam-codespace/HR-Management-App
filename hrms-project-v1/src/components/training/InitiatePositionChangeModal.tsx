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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface InitiatePositionChangeModalProps {
  planId: string | null;
  employeeId: string | null;
  evaluationId?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InitiatePositionChangeModal({
  planId,
  employeeId,
  evaluationId,
  isOpen,
  onClose,
  onSuccess,
}: InitiatePositionChangeModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employeeId || "");
  const [employees, setEmployees] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const [changeType, setChangeType] = useState("PROMOTION");
  const [proposedDesignationId, setProposedDesignationId] = useState("");
  const [proposedDepartmentId, setProposedDepartmentId] = useState("");
  const [proposedEffectiveDate, setProposedEffectiveDate] = useState("");
  const [reason, setReason] = useState("");
  const [compensationReviewStatus, setCompensationReviewStatus] = useState("NOT_REQUIRED");
  const [proposedSalaryIncrease, setProposedSalaryIncrease] = useState<number>(0);
  const [decisionNotes, setDecisionNotes] = useState("");

  useEffect(() => {
    if (employeeId) {
      setSelectedEmployeeId(employeeId);
    }
  }, [employeeId]);

  useEffect(() => {
    if (!isOpen) return;
    loadDropdowns();
  }, [isOpen]);

  const loadDropdowns = async () => {
    try {
      const [desigRes, deptRes, empRes] = await Promise.allSettled([
        api.get("/organization/designations"),
        api.get("/organization/departments"),
        api.get("/employees"),
      ]);
      if (desigRes.status === "fulfilled") setDesignations(desigRes.value.data || []);
      if (deptRes.status === "fulfilled") setDepartments(deptRes.value.data || []);
      if (empRes.status === "fulfilled") {
        const data = empRes.value.data;
        setEmployees(Array.isArray(data) ? data : data?.data || []);
      }
    } catch (err) {
      console.error("Failed to load dropdowns:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmployeeId = selectedEmployeeId || employeeId;
    if (!targetEmployeeId || !reason.trim() || !proposedEffectiveDate) {
      toast("Please select an employee and fill in all required fields (reason & effective date)", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/training/position-changes", {
        employeeId: targetEmployeeId,
        trainingPlanId: planId || undefined,
        evaluationId: evaluationId || undefined,
        changeType,
        reason: reason.trim(),
        proposedDesignationId: proposedDesignationId || undefined,
        proposedDepartmentId: proposedDepartmentId || undefined,
        proposedEffectiveDate: new Date(proposedEffectiveDate).toISOString(),
        compensationReviewStatus,
        proposedSalaryIncrease: Number(proposedSalaryIncrease) || undefined,
        decisionNotes: decisionNotes.trim() || undefined,
      });

      toast("Official position change proposal submitted for executive governance", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to initiate position change", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold">
            <TrendingUp className="w-5 h-5 mr-2 text-primary" />
            Initiate Official Personnel Position Change
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Routes proposed promotion, transfer, or role change through multi-stage governance before official employment record update.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!employeeId && (
            <div className="space-y-1.5">
              <Label>Select Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={(val) => setSelectedEmployeeId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee for career progression" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode}) - {emp.designation?.name || "No Role"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Change Type *</Label>
              <Select value={changeType} onValueChange={(val) => setChangeType(val || "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROMOTION">Promotion</SelectItem>
                  <SelectItem value="TRANSFER">Department / Branch Transfer</SelectItem>
                  <SelectItem value="REDESIGNATION">Redesignation / Title Alignment</SelectItem>
                  <SelectItem value="ADDITIONAL_RESPONSIBILITY">Authorized Additional Duties</SelectItem>
                  <SelectItem value="GRADE_CHANGE">Approved Job Grade Revision</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Proposed Effective Date *</Label>
              <Input
                type="date"
                value={proposedEffectiveDate}
                onChange={(e) => setProposedEffectiveDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Proposed Designation</Label>
              <Select value={proposedDesignationId} onValueChange={(val) => setProposedDesignationId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target designation" />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Proposed Department</Label>
              <Select value={proposedDepartmentId} onValueChange={(val) => setProposedDepartmentId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Retain or transfer department" />
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
          </div>

          <div className="space-y-1.5">
            <Label>Business Justification & Evidence *</Label>
            <Textarea
              placeholder="Cite supporting training completion, competency achievements, or vacancies..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Compensation Review</Label>
              <Select
                value={compensationReviewStatus}
                onValueChange={(val) => setCompensationReviewStatus(val || "")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NOT_REQUIRED">Not Required / Non-Monetary</SelectItem>
                  <SelectItem value="PENDING_REVIEW">Pending Finance / HR Review</SelectItem>
                  <SelectItem value="APPROVED">Pre-Approved in Budget</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Proposed Salary Incr. (Annual ₹)</Label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={proposedSalaryIncrease}
                onChange={(e) => setProposedSalaryIncrease(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Approval / Committee Decision Notes</Label>
            <Input
              placeholder="e.g. Approved by Q3 Promotion Committee"
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Initiate Approval Chain
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
