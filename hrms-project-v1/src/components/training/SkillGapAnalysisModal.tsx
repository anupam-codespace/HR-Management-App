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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  Loader2,
  TrendingUp,
  Target,
} from "lucide-react";
import api from "@/lib/api";

interface SkillGapAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployeeId?: string;
  onSelectProgramToEnroll?: (programId: string) => void;
  onDraftPlanForGap?: (gapInfo: {
    employeeId: string;
    targetDesignationId?: string;
    targetRole?: string;
    competencyId?: string;
    competencyName?: string;
    currentLevel?: number;
    requiredLevel?: number;
  }) => void;
}

export default function SkillGapAnalysisModal({
  isOpen,
  onClose,
  initialEmployeeId,
  onSelectProgramToEnroll,
  onDraftPlanForGap,
}: SkillGapAnalysisModalProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeId || "");
  const [selectedDesignationId, setSelectedDesignationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    loadPrerequisites();
  }, [isOpen]);

  useEffect(() => {
    if (initialEmployeeId) {
      setSelectedEmployeeId(initialEmployeeId);
      runAnalysis(initialEmployeeId, selectedDesignationId);
    }
  }, [initialEmployeeId]);

  const loadPrerequisites = async () => {
    try {
      const [empRes, desigRes] = await Promise.allSettled([
        api.get("/employees"),
        api.get("/organization/designations"),
      ]);
      if (empRes.status === "fulfilled") {
        const emps = empRes.value.data || [];
        setEmployees(emps);
        if (!selectedEmployeeId && emps.length > 0) {
          const firstId = emps[0].id;
          setSelectedEmployeeId(firstId);
          runAnalysis(firstId, selectedDesignationId);
        }
      }
      if (desigRes.status === "fulfilled") setDesignations(desigRes.value.data || []);
    } catch (err) {
      console.error("Failed to load prerequisites:", err);
    }
  };

  const runAnalysis = async (empId: string, desigId?: string) => {
    if (!empId) return;
    try {
      setLoading(true);
      const url = desigId
        ? `/training/competencies/gap-analysis/${empId}?targetDesignationId=${desigId}`
        : `/training/competencies/gap-analysis/${empId}`;
      const res = await api.get(url);
      setAnalysisResult(res.data);
    } catch (err) {
      console.error("Failed to run skill gap analysis:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeChange = (id: string) => {
    setSelectedEmployeeId(id);
    runAnalysis(id, selectedDesignationId);
  };

  const handleDesignationChange = (id: string) => {
    const val = id === "current" ? "" : id;
    setSelectedDesignationId(val);
    runAnalysis(selectedEmployeeId, val);
  };

  const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);
  const selectedDesignation = designations.find((d) => d.id === selectedDesignationId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Universal Competency & Skill Gap Analyzer
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Compare an employee&apos;s current assessed competencies against current or target position requirements.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border/70 mt-3">
          <div className="space-y-1.5 min-w-0">
            <Label className="text-xs font-semibold text-foreground">Select Employee</Label>
            <Select value={selectedEmployeeId} onValueChange={(val) => handleEmployeeChange(val || "")}>
              <SelectTrigger className="w-full h-10 text-xs">
                <SelectValue placeholder="Choose employee...">
                  {selectedEmployee
                    ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.employeeCode || "No Code"})`
                    : "Choose employee..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.employeeCode || "No Code"}) - {e.designation?.name || e.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5 min-w-0">
            <Label className="text-xs font-semibold text-foreground">Target Role for Comparison</Label>
            <Select
              value={selectedDesignationId || "current"}
              onValueChange={(val) => handleDesignationChange(val || "")}
            >
              <SelectTrigger className="w-full h-10 text-xs">
                <SelectValue placeholder="Current Designation (Default)">
                  {selectedDesignation
                    ? `${selectedDesignation.name} (Target Role)`
                    : "Current Job Position Requirements"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-64">
                <SelectItem value="current">Current Job Position Requirements</SelectItem>
                {designations.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} (Target Role)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground mt-2">Analyzing competency requirements...</p>
          </div>
        ) : analysisResult ? (
          <div className="space-y-6 pt-3">
            {/* Scorecard Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs">
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Role Readiness
                </div>
                <div className="text-2xl font-bold mt-1 text-primary">
                  {analysisResult.totalRequirements === 0 || analysisResult.readinessPercentage === null
                    ? "N/A"
                    : `${analysisResult.readinessPercentage}%`}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                  Target: {analysisResult.targetDesignation || "Current Role"}
                </div>
              </div>

              <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs">
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Competencies
                </div>
                <div className="text-2xl font-bold mt-1 text-foreground">
                  {analysisResult.totalRequirements}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">Total in Matrix</div>
              </div>

              <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs">
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Skill Gaps
                </div>
                <div className="text-2xl font-bold mt-1 text-amber-500">
                  {analysisResult.gapCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">Deficits Identified</div>
              </div>

              <div className="bg-card p-3.5 rounded-xl border border-border shadow-xs">
                <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                  Mandatory Gaps
                </div>
                <div className="text-2xl font-bold mt-1 text-destructive">
                  {analysisResult.mandatoryGapsCount}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5 truncate">Must Clear for Promo</div>
              </div>
            </div>

            {/* Gap List */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" />
                Identified Skill Gaps ({analysisResult.gaps?.length || 0})
              </h4>

              {analysisResult.totalRequirements === 0 ? (
                <div className="p-6 text-center text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-amber-500" />
                  <div className="font-semibold text-sm">
                    No Competency Requirements Defined for {analysisResult.targetDesignation}
                  </div>
                  <p className="text-muted-foreground text-xs max-w-md mx-auto">
                    This position currently has 0 competencies mapped in the Job Position Matrix. Use &quot;Configure Role Requirements&quot; in the Competencies tab to map skills to this role.
                  </p>
                </div>
              ) : analysisResult.gaps?.length === 0 ? (
                <div className="p-6 text-center text-xs text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  Employee fully satisfies all assessed competency requirements for this position!
                </div>
              ) : (
                <div className="space-y-2">
                  {analysisResult.gaps.map((g: any) => (
                    <div
                      key={g.competencyId}
                      className="p-3.5 rounded-xl border border-border bg-card flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-foreground text-sm">
                            {g.competencyName}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {g.category}
                          </Badge>
                          {g.isMandatory && (
                            <Badge variant="destructive" className="text-[9px] uppercase">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                        <div className="text-muted-foreground mt-1">
                          Current Level: <span className="font-medium text-foreground">{g.currentLevel}</span>{" "}
                          → Required: <span className="font-bold text-primary">{g.requiredLevel}</span> (Gap Depth: {g.gapDepth})
                        </div>
                      </div>

                      {onDraftPlanForGap && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 border-primary/30 text-primary hover:bg-primary/10 shrink-0"
                          onClick={() => {
                            onClose();
                            onDraftPlanForGap({
                              employeeId: selectedEmployeeId,
                              targetDesignationId: selectedDesignationId,
                              targetRole: analysisResult.targetDesignation,
                              competencyId: g.competencyId,
                              competencyName: g.competencyName,
                              currentLevel: g.currentLevel,
                              requiredLevel: g.requiredLevel,
                            });
                          }}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Draft Plan
                        </Button>
                      )}
                    </div>
                  ))}

                  {analysisResult.gaps?.length > 0 && onDraftPlanForGap && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        className="w-full gap-2 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => {
                          onClose();
                          onDraftPlanForGap({
                            employeeId: selectedEmployeeId,
                            targetDesignationId: selectedDesignationId,
                            targetRole: analysisResult.targetDesignation,
                            competencyName: `${analysisResult.targetDesignation} Comprehensive Readiness`,
                          });
                        }}
                      >
                        <Sparkles className="w-4 h-4" />
                        Initiate Targeted Training Initiative for {analysisResult.employeeName}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Recommended Training Initiatives */}
            {analysisResult.recommendedPrograms?.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-semibold flex items-center">
                  <BookOpen className="w-4 h-4 mr-1.5 text-primary" />
                  Recommended Training Initiatives to Bridge Gaps
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analysisResult.recommendedPrograms.map((prog: any) => (
                    <div
                      key={prog.id}
                      className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground text-sm">{prog.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {prog.deliveryMethod}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground line-clamp-2">
                        {prog.description || "Comprehensive syllabus addressing key industry skills."}
                      </p>
                      <div className="text-[11px] text-muted-foreground pt-1">
                        Addresses: <span className="font-medium text-foreground">{prog.addressesCompetencies?.join(", ")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <DialogFooter className="pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
