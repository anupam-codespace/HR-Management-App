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

interface NewCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  plans?: any[];
  defaultEmployeeId?: string;
  defaultPlanId?: string;
}

export default function NewCertificateModal({
  isOpen,
  onClose,
  onSuccess,
  plans = [],
  defaultEmployeeId,
  defaultPlanId,
}: NewCertificateModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState(defaultEmployeeId || "");
  const [selectedPlanId, setSelectedPlanId] = useState(defaultPlanId || "");
  const [title, setTitle] = useState("");
  const [certificateNumber, setCertificateNumber] = useState("");
  const [issuingOrganization, setIssuingOrganization] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("VERIFIED");

  useEffect(() => {
    if (!isOpen) return;
    loadEmployees();
    setIssueDate(new Date().toISOString().slice(0, 10));
    if (defaultEmployeeId) setSelectedEmployeeId(defaultEmployeeId);
    if (defaultPlanId) setSelectedPlanId(defaultPlanId);
  }, [isOpen, defaultEmployeeId, defaultPlanId]);

  const loadEmployees = async () => {
    try {
      const res = await api.get("/employees");
      const data = res.data;
      setEmployees(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      console.error("Failed to load employees:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !title.trim() || !issuingOrganization.trim() || !issueDate) {
      toast("Please fill in candidate, certificate title, issuing organization, and issue date", "error");
      return;
    }

    try {
      setLoading(true);
      await api.post("/training/certificates", {
        employeeId: selectedEmployeeId,
        planId: selectedPlanId === "STANDALONE" || !selectedPlanId ? undefined : selectedPlanId,
        title: title.trim(),
        certificateNumber: certificateNumber.trim() || undefined,
        issuingOrganization: issuingOrganization.trim(),
        issueDate: new Date(issueDate).toISOString(),
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
        credentialUrl: credentialUrl.trim() || undefined,
        verificationStatus,
      });

      toast("Certificate qualification recorded successfully", "success");
      onSuccess();
      onClose();

      // Reset
      setTitle("");
      setCertificateNumber("");
      setIssuingOrganization("");
      setExpiryDate("");
      setCredentialUrl("");
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to record certificate", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold">
            <Award className="w-5 h-5 mr-2 text-primary" />
            Register Earned Certificate / Qualification
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Award credentials following training completion or record recognized external certifications.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Certified Employee *</Label>
              <Select value={selectedEmployeeId} onValueChange={(val) => setSelectedEmployeeId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Associated Training Plan (Optional)</Label>
              <Select value={selectedPlanId} onValueChange={(val) => setSelectedPlanId(val || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Standalone or Select Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDALONE">None / External Credential</SelectItem>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title} ({p.planNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Certificate / Qualification Title *</Label>
            <Input
              placeholder="e.g. AWS Certified Solutions Architect, CPR & BLS, Six Sigma Green Belt"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Issuing Body / Authority *</Label>
              <Input
                placeholder="e.g. Amazon Web Services, American Red Cross, PMI"
                value={issuingOrganization}
                onChange={(e) => setIssuingOrganization(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Certificate / License ID #</Label>
              <Input
                placeholder="e.g. CERT-2026-88912"
                value={certificateNumber}
                onChange={(e) => setCertificateNumber(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Issue Date *</Label>
              <Input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Expiration Date (Optional)</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
              <span className="text-[10px] text-muted-foreground">Leave empty for lifetime credentials</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Digital Credential URL / Verification Link (Optional)</Label>
            <Input
              placeholder="e.g. https://www.credly.com/badges/... or cloud storage URL"
              value={credentialUrl}
              onChange={(e) => setCredentialUrl(e.target.value)}
            />
            <span className="text-[10px] text-muted-foreground">Direct URL for audit or accreditation verification</span>
          </div>

          <div className="space-y-1.5">
            <Label>Verification Status</Label>
            <Select value={verificationStatus} onValueChange={(val) => setVerificationStatus(val || "VERIFIED")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VERIFIED">Verified Official</SelectItem>
                <SelectItem value="PENDING_VERIFICATION">Pending HR Verification</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary text-primary-foreground">
              {loading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Save Certificate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
