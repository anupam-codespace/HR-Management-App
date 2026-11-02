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
import { Loader2, Award, ClipboardCheck } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface NewAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plans: any[];
}

export default function NewAssessmentModal({
  isOpen,
  onClose,
  onSuccess,
  plans = [],
}: NewAssessmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [participants, setParticipants] = useState<any[]>([]);

  const [title, setTitle] = useState("");
  const [assessmentType, setAssessmentType] = useState("PRACTICAL");
  const [passingScore, setPassingScore] = useState<number>(70);
  const [maxScore, setMaxScore] = useState<number>(100);
  const [scoreAchieved, setScoreAchieved] = useState<number | "">("");
  const [result, setResult] = useState("PENDING");
  const [assessorName, setAssessorName] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  // Load participants of the selected plan
  useEffect(() => {
    if (!selectedPlanId) {
      setParticipants([]);
      return;
    }
    const loadPlanParticipants = async () => {
      try {
        const res = await api.get(`/training/plans/${selectedPlanId}`);
        const enrs = res.data?.enrollments || [];
        setParticipants(enrs.map((e: any) => e.employee).filter(Boolean));
        if (enrs.length > 0 && enrs[0].employee?.id) {
          setSelectedEmployeeId(enrs[0].employee.id);
        } else {
          setSelectedEmployeeId("");
        }
      } catch (err) {
        console.error("Failed to load plan participants:", err);
      }
    };
    loadPlanParticipants();
  }, [selectedPlanId]);

  // Auto-calculate result if scoreAchieved is given
  useEffect(() => {
    if (scoreAchieved === "") {
      setResult("PENDING");
    } else {
      const score = Number(scoreAchieved);
      if (score >= passingScore) {
        setResult("PASSED");
      } else {
        setResult("FAILED");
      }
    }
  }, [scoreAchieved, passingScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlanId || !selectedEmployeeId || !title.trim()) {
      toast("Please select a training plan, candidate, and assessment title", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/training/assessments", {
        planId: selectedPlanId,
        employeeId: selectedEmployeeId,
        title: title.trim(),
        assessmentType,
        passingScore: Number(passingScore) || 70,
        maxScore: Number(maxScore) || 100,
        scoreAchieved: scoreAchieved !== "" ? Number(scoreAchieved) : undefined,
        result,
        assessorName: assessorName.trim() || undefined,
        assessedAt: scoreAchieved !== "" ? new Date().toISOString() : undefined,
        feedback: feedback.trim() || undefined,
      });

      toast("Assessment recorded successfully", "success");
      onSuccess();
      onClose();

      // Reset
      setTitle("");
      setScoreAchieved("");
      setResult("PENDING");
      setFeedback("");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to create assessment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold">
            <ClipboardCheck className="w-5 h-5 mr-2 text-primary" />
            Record Practical Assessment / Examination
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Register formal exams, evaluations, and proficiency benchmarks for cohort candidates.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Training Plan *</Label>
              <Select value={selectedPlanId} onValueChange={(val) => setSelectedPlanId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({p.planNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Enrolled Candidate *</Label>
              <Select value={selectedEmployeeId} onValueChange={(val) => setSelectedEmployeeId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder={participants.length === 0 ? "No participants" : "Select candidate"} />
                </SelectTrigger>
                <SelectContent>
                  {participants.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Assessment Title *</Label>
            <Input
              placeholder="e.g. Clinical Protocol Practical Demo or Final Certification Exam"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Assessment Type</Label>
              <Select value={assessmentType} onValueChange={(val) => setAssessmentType(val || "PRACTICAL")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRACTICAL">Practical Demonstration</SelectItem>
                  <SelectItem value="WRITTEN_EXAM">Written Examination</SelectItem>
                  <SelectItem value="QUIZ">Quiz / Knowledge Test</SelectItem>
                  <SelectItem value="SUPERVISOR_EVAL">Supervisor Evaluation</SelectItem>
                  <SelectItem value="TRAINER_EVAL">Trainer Evaluation</SelectItem>
                  <SelectItem value="COMPETENCY_DEMO">Competency Demonstration</SelectItem>
                  <SelectItem value="EXTERNAL_VERIFICATION">External Verification</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Evaluator / Assessor Name</Label>
              <Input
                placeholder="Name of certifying examiner"
                value={assessorName}
                onChange={(e) => setAssessorName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Passing Benchmark (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value, 10) || 70)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Max Score</Label>
              <Input
                type="number"
                min="1"
                value={maxScore}
                onChange={(e) => setMaxScore(parseInt(e.target.value, 10) || 100)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Score Achieved (Optional)</Label>
              <Input
                type="number"
                min="0"
                max={maxScore}
                placeholder="Leave blank if pending"
                value={scoreAchieved}
                onChange={(e) =>
                  setScoreAchieved(e.target.value === "" ? "" : parseFloat(e.target.value))
                }
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Result Status</Label>
            <Select value={result} onValueChange={(val) => setResult(val || "PENDING")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PENDING">Pending Grading</SelectItem>
                <SelectItem value="PASSED">Passed</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="WAIVED">Waived / Exempt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Examiner Feedback & Notes</Label>
            <Textarea
              placeholder="Strengths observed, improvement areas, or certification notes..."
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Assessment Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
