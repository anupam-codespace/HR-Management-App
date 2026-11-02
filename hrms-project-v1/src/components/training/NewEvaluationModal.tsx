"use client";

import React, { useState } from "react";
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
import { Loader2, Award } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface NewEvaluationModalProps {
  planId: string | null;
  employeeId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewEvaluationModal({
  planId,
  employeeId,
  isOpen,
  onClose,
  onSuccess,
}: NewEvaluationModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [effectivenessRating, setEffectivenessRating] = useState<number>(5);
  const [managerEvaluationNotes, setManagerEvaluationNotes] = useState("");
  const [businessImpact, setBusinessImpact] = useState("");
  const [remainingGaps, setRemainingGaps] = useState("");
  const [recommendedOutcome, setRecommendedOutcome] = useState("CONTINUE_CURRENT_ROLE");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planId || !employeeId || !managerEvaluationNotes.trim()) {
      toast("Please provide manager evaluation notes", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/training/evaluations", {
        planId,
        employeeId,
        trainingEffectivenessRating: Number(effectivenessRating),
        managerEvaluationNotes: managerEvaluationNotes.trim(),
        businessImpact: businessImpact.trim() || undefined,
        remainingGaps: remainingGaps.trim() || undefined,
        recommendedOutcome,
      });

      toast("Manager post-training evaluation submitted successfully", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to submit post-training evaluation", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold">
            <Award className="w-5 h-5 mr-2 text-primary" />
            Post-Training Competency & Career Evaluation
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Assess employee proficiency achieved, business impact, and recommend the governed post-training outcome.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Effectiveness Rating (1 - 5)</Label>
              <Select
                value={String(effectivenessRating)}
                onValueChange={(val) => setEffectivenessRating(parseInt(val || "3", 10))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 - Exceptional / Exceeds Target</SelectItem>
                  <SelectItem value="4">4 - Proficient / Meets All Goals</SelectItem>
                  <SelectItem value="3">3 - Satisfactory / Basic Proficiency</SelectItem>
                  <SelectItem value="2">2 - Needs Reinforcement / Minor Gaps</SelectItem>
                  <SelectItem value="1">1 - Unsatisfactory / Did Not Acquire</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Post-Training Governed Outcome *</Label>
              <Select value={recommendedOutcome} onValueChange={(val) => setRecommendedOutcome(val || "")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTINUE_CURRENT_ROLE">1. Continue in Current Position</SelectItem>
                  <SelectItem value="AUTHORIZE_ADDITIONAL_DUTIES">2. Authorize Additional Responsibilities</SelectItem>
                  <SelectItem value="RECOMMEND_PROMOTION">3. Recommend Promotion Review</SelectItem>
                  <SelectItem value="INITIATE_TRANSFER">4. Initiate Department / Branch Transfer</SelectItem>
                  <SelectItem value="RECOMMEND_ROLE_CHANGE">5. Recommend Job-Role Change</SelectItem>
                  <SelectItem value="UPDATE_APPROVED_GRADE_DESIGNATION">6. Update Approved Job Grade</SelectItem>
                  <SelectItem value="RECOMMEND_COMPENSATION_REVIEW">7. Recommend Compensation Review</SelectItem>
                  <SelectItem value="ASSIGN_REMEDIAL_TRAINING">8. Assign Further / Remedial Training</SelectItem>
                  <SelectItem value="DEFER_DECISION">9. Defer Decision (Pending Vacancy)</SelectItem>
                  <SelectItem value="CLOSE_WITHOUT_CHANGE">10. Close Plan Without Personnel Change</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Manager Evaluation Notes *</Label>
            <Textarea
              placeholder="Provide specific feedback on candidate's performance, competency demonstrations, and observations..."
              rows={3}
              value={managerEvaluationNotes}
              onChange={(e) => setManagerEvaluationNotes(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>Measurable Business Impact (Optional)</Label>
            <Input
              placeholder="e.g. Reduced audit non-conformances by 40% / Deployed 3 production microservices"
              value={businessImpact}
              onChange={(e) => setBusinessImpact(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Remaining Skill Gaps or Follow-up Items (Optional)</Label>
            <Input
              placeholder="e.g. Needs supervised experience with emergency ventilators"
              value={remainingGaps}
              onChange={(e) => setRemainingGaps(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Evaluation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
