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
import { Loader2, Sparkles, BookOpen } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface NewCompetencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewCompetencyModal({
  isOpen,
  onClose,
  onSuccess,
}: NewCompetencyModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("Technical");
  const [description, setDescription] = useState("");
  const [assessmentMethod, setAssessmentMethod] = useState("PRACTICAL_DEMO");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast("Please provide both Competency Name and unique Code", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/training/competencies", {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        description: description.trim() || undefined,
        proficiencyScale: "STANDARD",
        assessmentMethod,
      });

      toast("New competency added to catalog successfully", "success");
      onSuccess();
      onClose();
      // Reset
      setName("");
      setCode("");
      setDescription("");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to create competency", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl rounded-2xl border shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Add Custom Competency / Skill
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Define a reusable industry or organizational skill in the competency master catalog.
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">
                Competency Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Cloud Kubernetes Orchestration / Clinical Triage / Six Sigma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-9 text-sm"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">
                Unique Code <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. COMP-CLOUD-01"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="h-9 text-sm font-mono uppercase"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Category Classification</Label>
              <Select value={category} onValueChange={(val) => setCategory(val || "Technical")}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Technical">Technical & Engineering</SelectItem>
                  <SelectItem value="Compliance">Statutory & Compliance</SelectItem>
                  <SelectItem value="Leadership">Leadership & Management</SelectItem>
                  <SelectItem value="Safety">Safety & Hazardous Material</SelectItem>
                  <SelectItem value="Quality">Quality & Auditing</SelectItem>
                  <SelectItem value="Operational">Operational & Customer</SelectItem>
                  <SelectItem value="Behavioral">Behavioral & Soft Skills</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Primary Assessment Method</Label>
              <Select
                value={assessmentMethod}
                onValueChange={(val) => setAssessmentMethod(val || "PRACTICAL_DEMO")}
              >
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRACTICAL_DEMO">Practical Hands-on Demonstration / Lab</SelectItem>
                  <SelectItem value="SUPERVISOR_EVAL">Direct Supervisor Observation & Sign-off</SelectItem>
                  <SelectItem value="WRITTEN_EXAM">Standardized Written / Online Examination</SelectItem>
                  <SelectItem value="EXTERNAL_CERT">Third-Party External Certification Verification</SelectItem>
                  <SelectItem value="INTERVIEW">Panel Interview & Defense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Description & Learning Scope</Label>
              <Textarea
                placeholder="Detail what knowledge, abilities, and benchmarks are expected for this competency..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs"
              />
            </div>
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
              disabled={loading}
              className="h-9 text-xs font-semibold bg-primary gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Save to Catalog
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
