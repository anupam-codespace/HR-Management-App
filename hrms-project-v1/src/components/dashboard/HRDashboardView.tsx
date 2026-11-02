"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";
import { Users, UserCheck, UserX, Clock, Megaphone, FileText, Calendar, Check, X, Loader2, Award, ClipboardList, Send, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { usePermissions } from "@/context/PermissionContext";
import { AttendanceWidget } from "@/components/dashboard/AttendanceWidget";
import { BroadcastNotificationModal } from "@/components/notifications/BroadcastNotificationModal";

export function HRDashboardView() {
  const { isWidgetEnabled } = usePermissions();
  const showClockIn = isWidgetEnabled("clock_in_widget");
  const queryClient = useQueryClient();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const getToken = () => localStorage.getItem("hrms_token");

  // Local state for Announcement Publisher
  const [announcementForm, setAnnouncementForm] = useState({ title: "", content: "" });
  const [publishing, setPublishing] = useState(false);

  // 1. Fetch Current User Profile
  const { data: currentUser } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 2. Fetch Admin Stats (Total employees, present, absent, late)
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/attendance/admin-stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 3. Fetch Company Leave Requests
  const { data: leaves, isLoading: loadingLeaves } = useQuery({
    queryKey: ["companyLeaves"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/leaves/company`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 4. Fetch Announcements
  const { data: announcements } = useQuery({
    queryKey: ["hrAnnouncements"],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/announcements`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    },
  });

  // 5. Mutation for Leave Approval
  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await axios.patch(
        `${API_URL}/leaves/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["companyLeaves"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
      alert("Leave status updated successfully.");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to update leave status.");
    }
  });

  // 6. Mutation for Publishing Announcement
  const publishMutation = useMutation({
    mutationFn: async (data: typeof announcementForm) => {
      await axios.post(`${API_URL}/announcements`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hrAnnouncements"] });
      setAnnouncementForm({ title: "", content: "" });
      alert("Announcement published successfully to all employees!");
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to publish announcement.");
    }
  });

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) return;
    publishMutation.mutate(announcementForm);
  };

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return "Good morning";
    if (currentHour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Filter pending leaves
  const pendingLeaves = leaves?.filter((req: any) => req.status === "PENDING") || [];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* TOP BANNER */}
      <div className="bg-gradient-to-r from-secondary to-primary rounded-3xl p-8 text-white flex flex-col justify-between shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <span className="bg-white/20 text-xs px-3 py-1 rounded-full font-medium">HR Dashboard</span>
          <h1 className="text-3xl font-bold mt-4 text-white">
            {getGreeting()}, {currentUser?.firstName || 'HR Officer'}!
          </h1>
          <p className="text-white/80 mt-2 max-w-md text-sm">
            You have full administrative privileges to oversee organization metrics, process payroll, review document requests, and manage employee leave approvals.
          </p>
        </div>
      </div>

      {/* GLOBAL STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link href="/workspace/employees" className="block cursor-pointer">
          <Card className="bg-secondary text-secondary-foreground border-secondary shadow-sm hover:shadow-md hover:bg-secondary/90 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-primary">Total Employee</p>
                  {loadingStats ? (
                    <Skeleton className="h-9 w-16 bg-white/10 mt-2" />
                  ) : (
                    <span className="text-4xl font-bold text-secondary-foreground mt-2 block">
                      {stats?.totalEmployees ?? 0}
                    </span>
                  )}
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
                  {loadingStats ? (
                    <Skeleton className="h-9 w-16 bg-primary/30 mt-2" />
                  ) : (
                    <span className="text-4xl font-bold text-secondary mt-2 block">
                      {stats?.presentToday ?? 0}
                    </span>
                  )}
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
                  <p className="text-sm font-medium text-muted-foreground">Absent / Off</p>
                  {loadingStats ? (
                    <Skeleton className="h-9 w-16 mt-2" />
                  ) : (
                    <span className="text-4xl font-bold text-foreground mt-2 block">
                      {stats?.absentToday ?? 0}
                    </span>
                  )}
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
                  <p className="text-sm font-medium text-muted-foreground">Late Clock-Ins</p>
                  {loadingStats ? (
                    <Skeleton className="h-9 w-16 mt-2" />
                  ) : (
                    <span className="text-4xl font-bold text-foreground mt-2 block">
                      {stats?.lateToday ?? 0}
                    </span>
                  )}
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg"><Clock className="w-5 h-5" /></div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* MAIN CONTENT SPLIT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Leaves and Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Pending Leaves */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <ClipboardList className="w-4 h-4 mr-2 text-primary" /> Pending Leave Approvals
              </CardTitle>
              <CardDescription>Review employee time-off requests. Click Approve to update leave allocations.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingLeaves ? (
                <div className="p-4 divide-y divide-border space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`hr-leave-skel-${i}`} className="pt-3 first:pt-0 flex items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-32 rounded" />
                        <Skeleton className="h-3 w-20 rounded" />
                      </div>
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                      <div className="flex gap-2">
                        <Skeleton className="h-7 w-16 rounded-lg" />
                        <Skeleton className="h-7 w-16 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pendingLeaves.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">No leave requests pending HR decision.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider">
                        <th className="p-4">Employee</th>
                        <th className="p-4">Type</th>
                        <th className="p-4">Dates</th>
                        <th className="p-4">Days</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.slice(0, 5).map((req: any) => (
                        <tr key={req.id} className="border-b border-border hover:bg-muted/10">
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{req.employee?.firstName} {req.employee?.lastName}</div>
                            <div className="text-muted-foreground/60 font-normal">{req.employee?.employeeCode}</div>
                          </td>
                          <td className="p-4"><Badge variant="outline" className="border-border">{req.type}</Badge></td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-muted-foreground font-semibold">{req.totalDays}</td>
                          <td className="p-4 text-right space-x-2">
                            <Button 
                              size="sm" 
                              className="bg-primary hover:bg-primary/90 text-secondary font-bold h-7 px-2"
                              onClick={() => statusMutation.mutate({ id: req.id, status: 'APPROVED' })}
                              disabled={statusMutation.isPending}
                            >
                              <Check className="w-3.5 h-3.5 mr-0.5" /> Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              className="h-7 px-2"
                              onClick={() => statusMutation.mutate({ id: req.id, status: 'REJECTED' })}
                              disabled={statusMutation.isPending}
                            >
                              <X className="w-3.5 h-3.5 mr-0.5" /> Reject
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Operations Shortcuts */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Award className="w-4 h-4 mr-2 text-primary" /> Operational Shortcuts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/workspace/employees" className="flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border rounded-2xl text-center transition-colors">
                <Users className="w-6 h-6 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">Employees Directory</span>
              </Link>
              <Link href="/workspace/payroll/admin" className="flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border rounded-2xl text-center transition-colors">
                <Calculator className="w-6 h-6 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">Payroll Processing</span>
              </Link>
              <Link href="/workspace/leave/admin/settings" className="flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border rounded-2xl text-center transition-colors">
                <Calendar className="w-6 h-6 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">Leave Policies</span>
              </Link>
              <Link href="/workspace/documents/admin" className="flex flex-col items-center justify-center p-4 bg-muted/20 hover:bg-muted/40 border border-border rounded-2xl text-center transition-colors">
                <FileText className="w-6 h-6 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">Documents Hub</span>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Announcement Publisher */}
        <div className="space-y-6">
          {showClockIn && <AttendanceWidget />}
          
          {/* Announcement Publisher Form */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-primary" /> Broadcast Announcement
                </CardTitle>
                <BroadcastNotificationModal
                  trigger={
                    <Button variant="outline" size="sm" className="text-xs h-7 border-primary/30 text-primary hover:bg-primary/10">
                      <Users className="w-3.5 h-3.5 mr-1" /> Target Departments / Staff
                    </Button>
                  }
                />
              </div>
              <CardDescription>Publish updates to all employees instantly.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handlePublish} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Announcement Title</label>
                  <Input 
                    placeholder="e.g. Office Holiday Notice" 
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
                    className="text-xs border-border bg-card"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">Message Content</label>
                  <Textarea 
                    placeholder="Describe the notice in detail..." 
                    value={announcementForm.content}
                    onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
                    className="text-xs min-h-[100px] border-border bg-card"
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={publishMutation.isPending || !announcementForm.title || !announcementForm.content}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold text-xs h-9"
                >
                  {publishMutation.isPending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Publishing...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5 mr-1.5" /> Publish Notice</>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Recent Broadcasts list */}
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-foreground flex items-center">
                <Megaphone className="w-4 h-4 mr-2 text-primary" /> Recent Broadcasts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {announcements?.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">No recent broadcasts published.</p>
              ) : (
                announcements?.slice(0, 3).map((ann: any) => (
                  <div key={ann.id} className="p-3 bg-muted/10 rounded-xl border border-border space-y-1">
                    <h4 className="text-xs font-bold text-foreground">{ann.title}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{ann.content}</p>
                    <span className="text-[9px] text-muted-foreground/60 block mt-1">{new Date(ann.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
