"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { Loader2, Users, UserCheck, UserX, Clock, Settings, Calendar, ShieldCheck, Activity, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";
import { usePermissions } from "@/context/PermissionContext";
import { BroadcastNotificationModal } from "@/components/notifications/BroadcastNotificationModal";

export function AdminDashboardView() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const { isWidgetEnabled } = usePermissions();
  const showClockIn = isWidgetEnabled("clock_in_widget");
  const getToken = () => localStorage.getItem("hrms_token");

  // 1. Fetch Admin Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/attendance/admin-stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
    refetchInterval: 60000,
  });

  // 2. Fetch company announcements
  const { data: announcements } = useQuery({
    queryKey: ["adminAnnouncements"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 3. Fetch Recent Audit Logs (Live Activity Feed)
  const { data: auditLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["adminAuditLogs"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/audit?limit=8`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30s
    retry: false,
  });

  // 4. Fetch All Employees Leave Balances
  const { data: leaveBalances, isLoading: balancesLoading } = useQuery({
    queryKey: ["companyLeaveBalances"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leaves/company-balances`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
    retry: false,
  });

  const formatLogMessage = (log: any) => {
    if (log.newValue?.description) {
      return log.newValue.description;
    }
    const actorName = log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : "System";
    switch (log.action) {
      case "LOGIN":
        return `${actorName} logged in to HRMS.`;
      case "LOGOUT":
        return `${actorName} logged out of HRMS.`;
      case "DOWNLOAD":
        return `${actorName} downloaded a payslip.`;
      case "APPROVE":
        return `${actorName} approved a request.`;
      case "REJECT":
        return `${actorName} rejected a request.`;
      case "CREATE":
        if (log.entity === "LeaveRequest") {
          return `${actorName} submitted a leave request.`;
        }
        if (log.entity === "Employee") {
          return `${actorName} added a new employee.`;
        }
        return `${actorName} created a new ${log.entity}.`;
      case "UPDATE":
        return `${actorName} updated ${log.entity}.`;
      case "DELETE":
        return `${actorName} deleted ${log.entity}.`;
      default:
        return `${actorName} performed action: ${log.action} on ${log.entity}.`;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here is what is happening across your workspace today.</p>
        </div>
        <BroadcastNotificationModal
          trigger={
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 shadow-sm shrink-0">
              <Megaphone className="w-4 h-4 mr-2" /> Broadcast Notification
            </Button>
          }
        />
      </div>

      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/workspace/employees" className="block cursor-pointer">
          <Card className="bg-secondary text-secondary-foreground border-secondary shadow-sm hover:shadow-md hover:bg-secondary/90 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-primary">Total Employees</p>
                  <div className="flex items-baseline mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-9 w-16 bg-white/10" />
                    ) : (
                      <span className="text-4xl font-bold text-secondary-foreground">
                        {stats?.totalEmployees ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-primary/20 text-primary rounded-lg"><Users className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-primary/20 text-secondary border-primary/30 shadow-sm hover:shadow-md hover:bg-primary/30 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-secondary/80">Present Today</p>
                  <div className="flex items-baseline mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-9 w-16 bg-primary/30" />
                    ) : (
                      <span className="text-4xl font-bold text-secondary">
                        {stats?.presentToday ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-primary text-secondary rounded-lg"><UserCheck className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-card text-foreground border-border shadow-sm hover:shadow-md hover:bg-muted/10 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Absent / Pending</p>
                  <div className="flex items-baseline mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-9 w-16" />
                    ) : (
                      <span className="text-4xl font-bold text-foreground">
                        {stats?.absentToday ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-lg"><UserX className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/workspace/attendance" className="block cursor-pointer">
          <Card className="bg-card text-foreground border-border shadow-sm hover:shadow-md hover:bg-muted/10 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Late Arrivals</p>
                  <div className="flex items-baseline mt-2">
                    {statsLoading ? (
                      <Skeleton className="h-9 w-16" />
                    ) : (
                      <span className="text-4xl font-bold text-foreground">
                        {stats?.lateToday ?? 0}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg"><Clock className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* DUAL SECTION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Live Activities Feed */}
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary animate-pulse" /> Live Employee Activities
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">Real-time view of logins, logouts, and payslip downloads.</CardDescription>
            </div>
            <span className="text-[10px] text-secondary bg-primary/20 px-2 py-0.5 rounded-full font-semibold border border-primary/30">Live Feed</span>
          </CardHeader>
          <CardContent className="p-0">
            {logsLoading ? (
              <div className="p-4 divide-y divide-border space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`log-skel-${i}`} className="pt-3 first:pt-0 flex justify-between items-start gap-4">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                      <Skeleton className="h-2.5 w-1/3 rounded" />
                    </div>
                    <Skeleton className="h-4 w-12 rounded" />
                  </div>
                ))}
              </div>
            ) : !auditLogs || auditLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-12">No recent employee activities logged.</p>
            ) : (
              <div className="divide-y divide-border max-h-[340px] overflow-y-auto">
                {auditLogs.map((log: any) => (
                  <div key={log.id} className="p-4 hover:bg-muted/10 flex justify-between items-start gap-4 transition-colors">
                    <div className="space-y-1">
                      <p className="text-xs text-foreground font-medium leading-relaxed">
                        {formatLogMessage(log)}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        {log.actor?.email || "System"} {log.ipAddress && `• ${log.ipAddress}`}
                      </p>
                    </div>
                    <span className="text-[9px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Admin Shortcuts */}
        <div className="lg:col-span-1 space-y-6">
         
          
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Settings className="w-4 h-4 mr-2 text-secondary" /> Admin Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              <Link href="/workspace/settings" className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground transition-colors">
                <span className="flex items-center"><Settings className="w-4 h-4 mr-2 text-muted-foreground" /> Company Settings</span>
                <span className="text-muted-foreground">Configure →</span>
              </Link>
              <Link href="/workspace/schedules/admin" className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground transition-colors">
                <span className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-muted-foreground" /> Shift Schedules</span>
                <span className="text-muted-foreground">Manage →</span>
              </Link>
              <Link href="/workspace/employees" className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 border border-border rounded-xl text-xs font-semibold text-foreground transition-colors">
                <span className="flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-muted-foreground" /> System Roles & Directory</span>
                <span className="text-muted-foreground">Modify →</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ROW 3: LEAVE BALANCES & ANNOUNCEMENTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Leave Balances Table */}
        <Card className="border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-foreground flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-secondary" /> Employee Leave Balances
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Direct overview of casual, medical, and earned leaves remaining per employee.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {balancesLoading ? (
              <div className="p-4 divide-y divide-border space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={`bal-skel-${i}`} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-32 rounded" />
                      <Skeleton className="h-3 w-20 rounded" />
                    </div>
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded" />
                      <Skeleton className="h-6 w-20 rounded" />
                      <Skeleton className="h-6 w-20 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !leaveBalances || leaveBalances.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground text-sm">No employee leave balance allocations found.</div>
            ) : (
              <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-muted/20 border-b border-border">
                    <tr className="text-muted-foreground font-semibold uppercase tracking-wider">
                      <th className="p-4">Employee</th>
                      <th className="p-4">Casual Leaves</th>
                      <th className="p-4">Medical Leaves</th>
                      <th className="p-4">Earned Leaves</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaveBalances.map((emp: any) => (
                      <tr key={emp.id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-foreground">{emp.firstName} {emp.lastName}</div>
                          <div className="text-muted-foreground/60 font-normal">{emp.employeeCode || "N/A"}</div>
                        </td>
                        <td className="p-4 font-semibold text-foreground">
                          <span className="bg-primary/20 text-secondary px-2 py-1 rounded border border-primary/20">{emp.balance?.casual ?? 0} remaining</span>
                        </td>
                        <td className="p-4 font-semibold text-foreground">
                          <span className="bg-muted text-muted-foreground px-2 py-1 rounded border border-border">{emp.balance?.medical ?? 0} remaining</span>
                        </td>
                        <td className="p-4 font-semibold text-foreground">
                          <span className="bg-secondary text-primary px-2 py-1 rounded border border-secondary">{emp.balance?.earned ?? 0} remaining</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Broadcast Announcements */}
        <Card className="border-border bg-card shadow-sm lg:col-span-1">
          <CardHeader className="pb-3 border-b border-border flex items-center justify-between">
            <CardTitle className="text-base font-bold text-foreground flex items-center">
              <Megaphone className="w-4 h-4 mr-2 text-primary" /> Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {announcements?.length === 0 ? (
              <p className="text-xs text-muted-foreground italic text-center py-6">No recent notices published.</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {announcements?.slice(0, 3).map((ann: any) => (
                  <div key={ann.id} className="p-4 bg-muted/10 rounded-xl border border-border space-y-1">
                    <h4 className="text-xs font-bold text-foreground">{ann.title}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">{ann.content}</p>
                    <span className="text-[9px] text-muted-foreground/60 block mt-2">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
