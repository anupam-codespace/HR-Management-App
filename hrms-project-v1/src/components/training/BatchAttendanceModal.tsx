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
import { Input } from "@/components/ui/input";
import { Loader2, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

interface BatchAttendanceModalProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BatchAttendanceModal({
  sessionId,
  isOpen,
  onClose,
  onSuccess,
}: BatchAttendanceModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    loadSessionAttendance();
  }, [isOpen, sessionId]);

  const loadSessionAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/training/sessions/${sessionId}`);
      const sessionData = res.data;
      setSession(sessionData);

      let items = (sessionData.attendances || []).map((att: any) => ({
        employeeId: att.employeeId,
        name: `${att.employee?.firstName || "Staff"} ${att.employee?.lastName || ""}`,
        code: att.employee?.employeeCode || "",
        status: att.status || "PRESENT",
        attendedHours: att.attendedHours ?? 2,
        notes: att.notes || "",
      }));

      // Fallback: If no attendances created yet, load from the plan's enrolled participants
      if (items.length === 0 && sessionData.planId) {
        try {
          const planRes = await api.get(`/training/plans/${sessionData.planId}`);
          if (planRes.data?.enrollments?.length > 0) {
            items = planRes.data.enrollments.map((enr: any) => ({
              employeeId: enr.employeeId,
              name: `${enr.employee?.firstName || "Staff"} ${enr.employee?.lastName || ""}`,
              code: enr.employee?.employeeCode || "",
              status: "PRESENT",
              attendedHours: 2,
              notes: "",
            }));
          }
        } catch (planErr) {
          console.warn("Could not fetch plan enrollments fallback:", planErr);
        }
      }

      setRecords(items);
    } catch (err) {
      console.error("Failed to load session attendance:", err);
    } finally {
      setLoading(false);
    }
  };

  const markAll = (status: "PRESENT" | "ABSENT") => {
    setRecords((prev) =>
      prev.map((r) => ({
        ...r,
        status,
        attendedHours: status === "ABSENT" ? 0 : r.attendedHours || 2,
      }))
    );
  };

  const updateItemStatus = (index: number, newStatus: string) => {
    const updated = [...records];
    updated[index].status = newStatus;
    if (newStatus === "ABSENT") {
      updated[index].attendedHours = 0;
    }
    setRecords(updated);
  };

  const updateItemHours = (index: number, hours: number) => {
    const updated = [...records];
    updated[index].attendedHours = hours;
    setRecords(updated);
  };

  const handleSave = async () => {
    if (!sessionId) return;
    try {
      setSaving(true);
      await api.post("/training/attendance/batch", {
        sessionId,
        records: records.map((r) => ({
          employeeId: r.employeeId,
          status: r.status,
          attendedHours: Number(r.attendedHours) || 0,
          notes: r.notes || undefined,
        })),
      });

      toast("Batch attendance records logged successfully", "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast(err.response?.data?.message || "Failed to save attendance", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg font-bold">
            <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
            Mark Session Attendance: {session?.title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Record employee participation, hours attended, and notes for session #{session?.sessionNumber}.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {records.length > 0 && (
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs text-muted-foreground">
                  {records.length} Participant{records.length > 1 ? "s" : ""} on Roster
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                    onClick={() => markAll("PRESENT")}
                  >
                    Mark All Present
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={() => markAll("ABSENT")}
                  >
                    Mark All Absent
                  </Button>
                </div>
              </div>
            )}

            {records.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No participants enrolled in this training plan yet. Add employees to the training plan to record session attendance.
              </div>
            ) : (
              <div className="border border-border rounded-xl overflow-hidden bg-card">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2.5">Participant</th>
                      <th className="p-2.5">Attendance Status</th>
                      <th className="p-2.5 w-24">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {records.map((r, idx) => (
                    <tr key={r.employeeId}>
                      <td className="p-2.5 font-medium text-foreground">
                        {r.name}
                        <div className="text-[10px] text-muted-foreground">{r.code}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="flex items-center space-x-1">
                          {["PRESENT", "LATE", "ABSENT", "EXCUSED"].map((st) => (
                            <Button
                              key={st}
                              type="button"
                              size="sm"
                              variant={r.status === st ? "default" : "outline"}
                              className={`text-[10px] h-6 px-2 ${
                                r.status === st && st === "PRESENT"
                                  ? "bg-emerald-600 hover:bg-emerald-700"
                                  : r.status === st && st === "ABSENT"
                                  ? "bg-rose-600 hover:bg-rose-700"
                                  : ""
                              }`}
                              onClick={() => updateItemStatus(idx, st)}
                            >
                              {st}
                            </Button>
                          ))}
                        </div>
                      </td>
                      <td className="p-2.5">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          className="h-7 text-xs w-20"
                          value={r.attendedHours}
                          onChange={(e) => updateItemHours(idx, parseFloat(e.target.value) || 0)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Confirm Attendance
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
