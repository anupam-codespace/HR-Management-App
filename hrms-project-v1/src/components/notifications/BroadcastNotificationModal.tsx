"use client";

import React, { useState } from "react";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone,
  Users,
  Building2,
  UserCheck,
  AlertTriangle,
  Send,
  Loader2,
  Search,
  CheckCircle2,
  Info,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface BroadcastNotificationModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BroadcastNotificationModal({
  trigger,
  isOpen,
  onOpenChange,
  onSuccess,
}: BroadcastNotificationModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const queryClient = useQueryClient();

  // Form State
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetAudience, setTargetAudience] = useState<"ALL" | "DEPARTMENT" | "SPECIFIC_EMPLOYEES">("ALL");
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [type, setType] = useState<string>("ANNOUNCEMENT");
  const [priority, setPriority] = useState<"NORMAL" | "URGENT">("NORMAL");
  const [createAnnouncement, setCreateAnnouncement] = useState(true);

  // Search filter for chosen people
  const [employeeSearch, setEmployeeSearch] = useState("");

  const getToken = () => (typeof window !== "undefined" ? localStorage.getItem("hrms_token") : "");

  // 1. Fetch Departments
  const { data: departments = [], isLoading: deptsLoading } = useQuery({
    queryKey: ["orgDepartments"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/organization/departments`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: open,
  });

  // 2. Fetch Employees
  const { data: employees = [], isLoading: empsLoading } = useQuery({
    queryKey: ["allCompanyEmployees"],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/employees`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = res.data;
      return Array.isArray(data) ? data : data?.employees || [];
    },
    enabled: open,
  });

  // Filtered employees for "SPECIFIC_EMPLOYEES"
  const filteredEmployees = employees.filter((emp: any) => {
    const fullName = `${emp.firstName || ""} ${emp.lastName || ""}`.toLowerCase();
    const email = (emp.email || "").toLowerCase();
    const dept = (emp.department?.name || "").toLowerCase();
    const q = employeeSearch.toLowerCase();
    return fullName.includes(q) || email.includes(q) || dept.includes(q);
  });

  const toggleDepartment = (deptId: string) => {
    setSelectedDepartmentIds((prev) =>
      prev.includes(deptId) ? prev.filter((id) => id !== deptId) : [...prev, deptId]
    );
  };

  const toggleEmployee = (empId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSelectAllDepartments = () => {
    if (selectedDepartmentIds.length === departments.length) {
      setSelectedDepartmentIds([]);
    } else {
      setSelectedDepartmentIds(departments.map((d: any) => d.id));
    }
  };

  // Broadcast Mutation
  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        title: title.trim(),
        message: message.trim(),
        type,
        targetAudience,
        priority,
        createAnnouncement,
      };

      if (targetAudience === "DEPARTMENT") {
        payload.departmentIds = selectedDepartmentIds;
      } else if (targetAudience === "SPECIFIC_EMPLOYEES") {
        payload.employeeIds = selectedEmployeeIds;
      }

      const res = await axios.post(`${API_URL}/notifications/broadcast`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["hrAnnouncements"] });
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      queryClient.invalidateQueries({ queryKey: ["myDashboardAnnouncements"] });
      alert(data.message || "Notification broadcast successfully delivered!");
      // Reset form
      setTitle("");
      setMessage("");
      setTargetAudience("ALL");
      setSelectedDepartmentIds([]);
      setSelectedEmployeeIds([]);
      setPriority("NORMAL");
      setType("ANNOUNCEMENT");
      setOpen(false);
      onSuccess?.();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to broadcast notification.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      alert("Please enter both a title and message.");
      return;
    }
    if (targetAudience === "DEPARTMENT" && selectedDepartmentIds.length === 0) {
      alert("Please select at least one department.");
      return;
    }
    if (targetAudience === "SPECIFIC_EMPLOYEES" && selectedEmployeeIds.length === 0) {
      alert("Please select at least one employee.");
      return;
    }
    broadcastMutation.mutate();
  };

  // Estimated recipient count calculation
  const getEstimatedCount = () => {
    if (targetAudience === "ALL") return `${employees.length || "All active"} employees`;
    if (targetAudience === "DEPARTMENT") {
      const count = employees.filter((e: any) => selectedDepartmentIds.includes(e.departmentId)).length;
      return `${count} employees in ${selectedDepartmentIds.length} department(s)`;
    }
    if (targetAudience === "SPECIFIC_EMPLOYEES") {
      return `${selectedEmployeeIds.length} selected employee(s)`;
    }
    return "0";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">{trigger}</span>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Megaphone className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">Broadcast Notification</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Dispatch targeted notifications to all staff, specific departments, or selected people.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          {/* Target Audience Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center justify-between">
              <span>Target Audience</span>
              <span className="text-[11px] font-normal text-muted-foreground flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-primary" /> Delivery estimate:{" "}
                <strong className="text-foreground">{getEstimatedCount()}</strong>
              </span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetAudience("ALL")}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  targetAudience === "ALL"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                  <Users className="w-4 h-4 text-primary" />
                  <span>Entire Company</span>
                </div>
                <span className="text-[10px] text-muted-foreground">All active company staff</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("DEPARTMENT")}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  targetAudience === "DEPARTMENT"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>By Department</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Filter by division/team</span>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience("SPECIFIC_EMPLOYEES")}
                className={`p-3 rounded-lg border text-left transition-all flex flex-col gap-1 cursor-pointer ${
                  targetAudience === "SPECIFIC_EMPLOYEES"
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-foreground">
                  <UserCheck className="w-4 h-4 text-emerald-500" />
                  <span>Chosen People</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Pick specific staff</span>
              </button>
            </div>
          </div>

          {/* Conditional: Department Selector */}
          {targetAudience === "DEPARTMENT" && (
            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Select Target Department(s):</span>
                <button
                  type="button"
                  onClick={handleSelectAllDepartments}
                  className="text-[11px] text-primary hover:underline font-medium"
                >
                  {selectedDepartmentIds.length === departments.length ? "Deselect All" : "Select All"}
                </button>
              </div>

              {deptsLoading ? (
                <div className="text-xs text-muted-foreground py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading departments...
                </div>
              ) : departments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No departments registered in your company.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                  {departments.map((dept: any) => {
                    const isSelected = selectedDepartmentIds.includes(dept.id);
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => toggleDepartment(dept.id)}
                        className={`px-2.5 py-1.5 rounded-md border text-xs text-left transition-colors flex items-center justify-between ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-medium"
                            : "bg-background hover:bg-muted border-border text-foreground"
                        }`}
                      >
                        <span className="truncate">{dept.name}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Conditional: Employee Picker */}
          {targetAudience === "SPECIFIC_EMPLOYEES" && (
            <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-foreground">Select Chosen Employees:</span>
                <Badge variant="outline" className="text-[10px]">
                  {selectedEmployeeIds.length} Selected
                </Badge>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or department..."
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  className="pl-8 h-8 text-xs bg-background"
                />
              </div>

              {empsLoading ? (
                <div className="text-xs text-muted-foreground py-2 flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading employees...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">No matching employees found.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto p-1 border rounded-md bg-background">
                  {filteredEmployees.map((emp: any) => {
                    const isSelected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleEmployee(emp.id)}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-xs ${
                          isSelected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                            {(emp.firstName?.[0] || "") + (emp.lastName?.[0] || "")}
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="font-medium text-foreground truncate">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {emp.email} {emp.department?.name ? `• ${emp.department.name}` : ""}
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-3.5 w-3.5 accent-primary cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Type & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Notification Category</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ANNOUNCEMENT">Announcement</option>
                <option value="ALERT">Important Alert</option>
                <option value="POLICY">Policy Update</option>
                <option value="GENERAL">General Notice</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground">Urgency Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="NORMAL">Normal Priority</option>
                <option value="URGENT">⚠️ Urgent (Bypasses Mute)</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Title</label>
            <Input
              placeholder="e.g. Town Hall Meeting, New Leave Policy, System Maintenance"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* Message Content */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground">Message Details</label>
            <Textarea
              placeholder="Describe the update clearly so employees know what actions or information are expected..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[110px] text-xs"
              required
            />
          </div>

          {/* Dashboard Announcement Toggle */}
          <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/10">
            <input
              type="checkbox"
              id="createAnnouncement"
              checked={createAnnouncement}
              onChange={(e) => setCreateAnnouncement(e.target.checked)}
              className="h-4 w-4 accent-primary rounded cursor-pointer"
            />
            <label htmlFor="createAnnouncement" className="text-xs text-foreground cursor-pointer">
              Also publish to the <strong>Dashboard Announcements</strong> card for all employees
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={broadcastMutation.isPending || !title.trim() || !message.trim()}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 min-w-[120px]"
            >
              {broadcastMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Broadcasting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Dispatch Notification
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
