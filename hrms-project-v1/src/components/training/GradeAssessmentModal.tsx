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
import { Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface GradeAssessmentModalProps {
  assessment: any | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function GradeAssessmentModal({
  assessment,
  isOpen,
  onClose,
  onSuccess,
}: GradeAssessmentModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scoreAchieved, setScoreAchieved] = useState<number>(0);
  const [result, setResult] = useState("PASSED");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (assessment) {
      setScoreAchieved(assessment.scoreAchieved ?? assessment.passingScore ?? 75);
      setResult(assessment.result === "PENDING" ? "PASSED" : assessment.result || "PASSED");
      setFeedback(assessment.feedback || "");
    }
  }, [assessment]);

  // Auto set result when score changes
  useEffect(() => {
    if (assessment) {
      if (scoreAchieved >= (assessment.passingScore || 70)) {
        setResult("PASSED");
      } else {
        setResult("FAILED");
      }
    }
  }, [scoreAchieved, assessment]);

  if (!assessment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.patch(`/training/assessments/${assessment.id}/grade`, {
        scoreAchieved: Number(scoreAchieved),
        result,
        feedback: feedback.trim() || undefined,
      });

      toast("Assessment graded successfully", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to grade assessment", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold">
            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
            Grade Assessment: {assessment.title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Candidate: <strong className="text-foreground">{assessment.employee?.firstName} {assessment.employee?.lastName}</strong> ({assessment.employee?.employeeCode})
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passing Benchmark:</span>
              <span className="font-semibold">{assessment.passingScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maximum Possible Score:</span>
              <span className="font-semibold">{assessment.maxScore || 100}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Score Achieved *</Label>
              <Input
                type="number"
                min="0"
                max={assessment.maxScore || 100}
                value={scoreAchieved}
                onChange={(e) => setScoreAchieved(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Result Decision</Label>
              <Select value={result} onValueChange={(val) => setResult(val || "PASSED")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSED">Passed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="WAIVED">Waived / Exempt</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Examiner Feedback & Notes</Label>
            <Textarea
              placeholder="Candidate performance notes, feedback for manager, or next steps..."
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Submit Final Grade
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
