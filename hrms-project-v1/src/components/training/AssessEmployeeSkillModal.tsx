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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Award, UserCheck } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface AssessEmployeeSkillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AssessEmployeeSkillModal({
  isOpen,
  onClose,
  onSuccess,
}: AssessEmployeeSkillModalProps) {
  const { toast } = useToast();
  const [employees, setEmployees] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedCompetencyId, setSelectedCompetencyId] = useState("");
  const [currentLevel, setCurrentLevel] = useState("INTERMEDIATE");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [empRes, compRes] = await Promise.allSettled([
        api.get("/employees"),
        api.get("/training/competencies"),
      ]);

      if (empRes.status === "fulfilled") setEmployees(empRes.value.data || []);
      if (compRes.status === "fulfilled") setCompetencies(compRes.value.data || []);
    } catch (err) {
      console.error("Failed to load assessment data:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedCompetencyId) {
      toast("Please select both an employee and a competency", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/training/competencies/employee/assess", {
        employeeId: selectedEmployeeId,
        competencyId: selectedCompetencyId,
        currentLevel,
        evidence: evidenceNotes.trim() || undefined,
      });

      toast("Employee assessed competency level updated successfully", "success");
      if (onSuccess) onSuccess();
      onClose();
      setEvidenceNotes("");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to record assessment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg rounded-2xl border shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Assess & Verify Employee Competency
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Record verified skill proficiency, supervisor evaluation notes, or assessment evidence.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Select Employee</Label>
            <Select value={selectedEmployeeId} onValueChange={(val) => setSelectedEmployeeId(val || "")}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Select employee to evaluate..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode || "No Code"}) - {e.designation?.name || e.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Competency</Label>
            <Select value={selectedCompetencyId} onValueChange={(val) => setSelectedCompetencyId(val || "")}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue placeholder="Select competency..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {competencies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Assessed Proficiency Level</Label>
            <Select value={currentLevel} onValueChange={(val) => setCurrentLevel(val || "INTERMEDIATE")}>
              <SelectTrigger className="w-full h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BEGINNER">1 - Beginner (Basic Awareness / Supervised)</SelectItem>
                <SelectItem value="INTERMEDIATE">2 - Intermediate (Independent Practitioner)</SelectItem>
                <SelectItem value="ADVANCED">3 - Advanced (Proficient / High Capability)</SelectItem>
                <SelectItem value="EXPERT">4 - Expert (Master / Organization Mentor)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Assessment Evidence & Evaluator Notes</Label>
            <Textarea
              placeholder="e.g. Demonstrated architecture defense in lab capstone; verified by Lead Architect on Oct 2026..."
              rows={3}
              value={evidenceNotes}
              onChange={(e) => setEvidenceNotes(e.target.value)}
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedEmployeeId || !selectedCompetencyId}
              className="h-9 text-xs font-semibold bg-primary gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save Verified Level
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
