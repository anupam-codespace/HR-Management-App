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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, BookOpen, Sparkles, Layers } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface NewProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  categories: any[];
}

export default function NewProgramModal({
  isOpen,
  onClose,
  onSuccess,
  categories,
}: NewProgramModalProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [programCode, setProgramCode] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("INTERMEDIATE");
  const [estimatedHours, setEstimatedHours] = useState(16);
  const [passingScore, setPassingScore] = useState(70);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !programCode.trim()) {
      toast("Please provide both a program title and code", "error");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/training/programs", {
        title: title.trim(),
        programCode: programCode.trim().toUpperCase(),
        categoryId: categoryId || undefined,
        description: description.trim() || undefined,
        learningObjectives: learningObjectives.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined,
        difficultyLevel,
        estimatedHours: Number(estimatedHours) || 0,
        passingScore: Number(passingScore) || 70,
        status: "PUBLISHED",
      });

      toast("Training program curriculum created successfully", "success");
      onClose();
      if (onSuccess) onSuccess();

      // Reset
      setTitle("");
      setProgramCode("");
      setCategoryId("");
      setDescription("");
      setLearningObjectives("");
      setTargetAudience("");
      setDifficultyLevel("INTERMEDIATE");
      setEstimatedHours(16);
      setPassingScore(70);
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to create program", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Create Reusable Training Program
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define standard curriculum, learning benchmarks, and target course hours.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">Program Title *</Label>
              <Input
                placeholder="e.g. Full-Stack Cloud Architecture & Security"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Program Code *</Label>
              <Input
                placeholder="e.g. PROG-ENG-02"
                value={programCode}
                onChange={(e) => setProgramCode(e.target.value)}
                className="h-9 text-xs font-mono uppercase"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Training Category</Label>
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Select classification..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Difficulty Level</Label>
              <Select value={difficultyLevel} onValueChange={(val) => setDifficultyLevel(val || "INTERMEDIATE")}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Foundational / Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate Practitioner</SelectItem>
                  <SelectItem value="ADVANCED">Advanced / Specialist</SelectItem>
                  <SelectItem value="EXPERT">Mastery / Lead Architect</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Estimated Duration (Hours)</Label>
              <Input
                type="number"
                min="1"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(parseInt(e.target.value, 10) || 0)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Passing Score Benchmark (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={passingScore}
                onChange={(e) => setPassingScore(parseFloat(e.target.value) || 70)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Target Audience</Label>
            <Input
              placeholder="e.g. Mid-level Engineers, Team Leads, New Onboardees"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Curriculum Description</Label>
            <Textarea
              placeholder="Summary of course content, tools covered, and delivery scope..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs resize-none"
              rows={2}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Learning Objectives</Label>
            <Textarea
              placeholder="Expected abilities and demonstrable competencies upon graduation..."
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
              className="text-xs resize-none"
              rows={2}
            />
          </div>

          <DialogFooter className="pt-3 border-t gap-2 sm:gap-0">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Creating Program...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save Program Curriculum
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
