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
  Loader2,
  Layers,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface ConfigureRoleMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ConfigureRoleMatrixModal({
  isOpen,
  onClose,
  onSuccess,
}: ConfigureRoleMatrixModalProps) {
  const { toast } = useToast();
  const [designations, setDesignations] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [selectedDesignationId, setSelectedDesignationId] = useState("");

  const [loading, setLoading] = useState(false);
  const [requirements, setRequirements] = useState<any[]>([]);

  // Add requirement form
  const [newCompetencyId, setNewCompetencyId] = useState("");
  const [requiredLevel, setRequiredLevel] = useState("INTERMEDIATE");
  const [isMandatory, setIsMandatory] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    loadDropdowns();
  }, [isOpen]);

  const loadDropdowns = async () => {
    try {
      setLoading(true);
      const [desigRes, compRes] = await Promise.allSettled([
        api.get("/organization/designations"),
        api.get("/training/competencies"),
      ]);

      if (desigRes.status === "fulfilled") {
        const des = desigRes.value.data || [];
        setDesignations(des);
        if (des.length > 0 && !selectedDesignationId) {
          setSelectedDesignationId(des[0].id);
          loadDesignationRequirements(des[0].id);
        }
      }
      if (compRes.status === "fulfilled") {
        setCompetencies(compRes.value.data || []);
      }
    } catch (err) {
      console.error("Failed to load matrix dropdowns:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDesignationRequirements = async (desigId: string) => {
    if (!desigId) return;
    try {
      setLoading(true);
      const res = await api.get(`/training/competencies/designation/${desigId}`);
      setRequirements(res.data || []);
    } catch (err: any) {
      console.error("Failed to load designation requirements:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDesignationSelect = (desigId: string) => {
    setSelectedDesignationId(desigId);
    loadDesignationRequirements(desigId);
  };

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDesignationId || !newCompetencyId) {
      toast("Please select both a designation and a competency", "error");
      return;
    }

    try {
      setIsAdding(true);
      await api.post("/training/competencies/designation", {
        designationId: selectedDesignationId,
        competencyId: newCompetencyId,
        requiredLevel,
        isMandatory,
      });

      toast("Role competency requirement mapped successfully", "success");
      setNewCompetencyId("");
      loadDesignationRequirements(selectedDesignationId);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to add requirement", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveRequirement = async (competencyId: string) => {
    try {
      await api.delete(
        `/training/competencies/designation/${selectedDesignationId}/${competencyId}`
      );
      toast("Requirement removed from designation", "success");
      loadDesignationRequirements(selectedDesignationId);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to remove requirement", "error");
    }
  };

  const selectedDesignation = designations.find((d) => d.id === selectedDesignationId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
                Configure Job Position Competency Matrix
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Customize required skill benchmarks and mandatory promotion criteria for each designation.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* 1. Designation Selector */}
        <div className="space-y-1.5 pt-3">
          <Label className="text-xs font-semibold">Select Job Position / Designation</Label>
          <Select value={selectedDesignationId} onValueChange={(val) => handleDesignationSelect(val || "")}>
            <SelectTrigger className="w-full h-10 text-xs font-medium">
              <SelectValue placeholder="Select designation to configure..." />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {designations.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Add New Requirement Card */}
        <form
          onSubmit={handleAddRequirement}
          className="bg-muted/40 p-4 rounded-xl border border-border/80 space-y-3 mt-2"
        >
          <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-primary" />
            Map Competency Requirement to {selectedDesignation?.name || "Selected Role"}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <Label className="text-[11px] text-muted-foreground">Competency</Label>
              <Select value={newCompetencyId} onValueChange={(val) => setNewCompetencyId(val || "")}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue placeholder="Choose competency..." />
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

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Required Proficiency</Label>
              <Select value={requiredLevel} onValueChange={(val) => setRequiredLevel(val || "INTERMEDIATE")}>
                <SelectTrigger className="w-full h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">1 - Beginner (Foundational)</SelectItem>
                  <SelectItem value="INTERMEDIATE">2 - Intermediate (Independent)</SelectItem>
                  <SelectItem value="ADVANCED">3 - Advanced (Proficient)</SelectItem>
                  <SelectItem value="EXPERT">4 - Expert (Master / Lead)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Promotion Gate</Label>
              <div className="flex items-center gap-2 h-9 pt-1">
                <input
                  type="checkbox"
                  id="mandatory-toggle"
                  checked={isMandatory}
                  onChange={(e) => setIsMandatory(e.target.checked)}
                  className="rounded border-border w-4 h-4 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="mandatory-toggle" className="text-xs cursor-pointer select-none">
                  {isMandatory ? (
                    <span className="font-semibold text-destructive">Mandatory</span>
                  ) : (
                    <span className="text-muted-foreground">Optional</span>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <Button
              type="submit"
              disabled={isAdding || !newCompetencyId}
              size="sm"
              className="h-8 text-xs font-semibold gap-1.5"
            >
              {isAdding && <Loader2 className="w-3 h-3 animate-spin" />}
              Save Requirement
            </Button>
          </div>
        </form>

        {/* 3. Existing Configured Requirements */}
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Currently Required Competencies ({requirements.length})
            </h4>
            <span className="text-[11px] text-muted-foreground">
              Used directly by the Skill Gap Analyzer
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
              Loading position requirements...
            </div>
          ) : requirements.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-muted/10">
              No competency requirements mapped to {selectedDesignation?.name || "this role"} yet.
              Add a requirement above to enable skill gap analytics.
            </div>
          ) : (
            <div className="border border-border rounded-xl overflow-hidden divide-y divide-border bg-card">
              {requirements.map((req: any) => (
                <div
                  key={req.id || req.competencyId}
                  className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-muted">
                      {req.competency?.code}
                    </span>
                    <div>
                      <span className="font-semibold text-foreground text-sm">
                        {req.competency?.name}
                      </span>
                      <span className="ml-2 text-[11px] text-muted-foreground">
                        ({req.competency?.category})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Badge variant="outline" className="font-medium text-[11px]">
                      Required: {req.requiredLevel}
                    </Badge>
                    {req.isMandatory ? (
                      <Badge variant="destructive" className="text-[10px] uppercase">
                        Mandatory
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        Optional
                      </Badge>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRequirement(req.competencyId)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t mt-3">
          <Button variant="outline" onClick={onClose} className="h-9 text-xs">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
