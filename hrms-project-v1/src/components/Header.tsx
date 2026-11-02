"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  Bell,
  LogOut,
  Loader2,
  User,
  Shield,
  Menu,
  Check,
  Trash,
  Sun,
  Moon,
  Megaphone,
  AlertTriangle,
  Calendar,
  Clock,
  FileText,
  Trash2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import Sidebar from "./Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { NotificationListSkeleton } from "@/components/skeletons";
import { useViewMode } from "@/context/ViewModeContext";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const { user, activeRole, isViewAsUser, setIsViewAsUser, isLoading } = useViewMode();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    const token = localStorage.getItem("hrms_token");
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
    if (token) {
      try {
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error("Failed to log logout action on backend", err);
      }
    }
    localStorage.removeItem("hrms_token");
    queryClient.clear();
    router.push("/login");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "U";
    return `${firstName.charAt(0)}${lastName?.charAt(0) || ""}`.toUpperCase();
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = search.trim();
    if (term) router.push(`/workspace/employees?search=${encodeURIComponent(term)}`);
  };

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const formatBreadcrumb = () => {
    const paths = pathname.split("/").filter(Boolean);
    if (paths.length < 2) return "Dashboard";
    const current = paths[paths.length - 1];
    return current
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const isManagerMode = user?.role === "MANAGER" && !isViewAsUser;

  return (
    <header
      className={`flex items-center justify-between h-16 px-6 bg-card border-b border-border transition-all ${
        isManagerMode ? "border-t-2 border-t-primary" : ""
      }`}
    >
      <div className="flex items-center space-x-4">
        {/* Small and medium screens: open the sidebar as a drawer */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="inline-flex rounded-md p-2 transition-colors hover:bg-primary/10 lg:hidden"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-64 data-[side=left]:w-64 data-[side=left]:sm:max-w-64"
          >
            <Sidebar role={activeRole} className="flex h-full" />
          </SheetContent>
        </Sheet>

        {/* Breadcrumb */}
        <div className="hidden md:flex text-sm font-medium text-muted-foreground">
          <span className="text-muted-foreground/60">Workspace</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{formatBreadcrumb()}</span>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4 lg:space-x-6">
        {/* Search */}
        <form onSubmit={submitSearch} className="hidden md:block relative w-72" role="search">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <Input
            ref={searchInputRef}
            placeholder="Search employees... (Ctrl + K)"
            aria-label="Search employees"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10 rounded-full bg-muted/40 border-border focus-visible:ring-primary"
          />
        </form>

        {/* View As User Toggle (for Managers only) */}
        {!isLoading && user?.role === "MANAGER" && (
          <div className="flex items-center space-x-3 bg-muted/40 border border-border px-3 py-1.5 rounded-full select-none shadow-sm transition-all duration-200">
            {isViewAsUser ? (
              <span className="flex items-center text-[11px] font-bold text-secondary bg-primary/20 px-2.5 py-0.5 rounded-full border border-primary/30">
                <span className="h-1.5 w-1.5 mr-1.5 rounded-full bg-primary animate-pulse" />
                User View
              </span>
            ) : (
              <span className="flex items-center text-[11px] font-bold text-muted-foreground bg-border/80 px-2.5 py-0.5 rounded-full border border-border">
                <span className="h-1.5 w-1.5 mr-1.5 rounded-full bg-muted-foreground" />
                Manager Mode
              </span>
            )}

            <button
              onClick={() => setIsViewAsUser(!isViewAsUser)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isViewAsUser ? "bg-primary" : "bg-border hover:bg-border/80"
              }`}
              aria-label="Toggle user view mode"
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isViewAsUser ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 border border-transparent hover:border-border cursor-pointer focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Toggle dark/light theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5 text-amber-400 hover:text-amber-300 transition-transform duration-300 hover:rotate-45" />
          ) : (
            <Moon className="h-5 w-5 text-slate-700 hover:text-slate-900 transition-transform duration-300 hover:-rotate-12" />
          )}
        </button>

        {/* Notifications Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="relative flex items-center justify-center w-10 h-10 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none cursor-pointer">
            <Bell className="h-5 w-5" />
            <NotificationDot />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[380px] p-0 shadow-2xl border-border">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
              <span className="font-semibold text-sm text-foreground">Notifications</span>
              <MarkAllReadButton />
            </div>

            <NotificationList />
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger
            className={buttonVariants({
              variant: "ghost",
              className:
                "flex items-center gap-2 hover:bg-transparent cursor-pointer border-0 outline-none",
            })}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col items-end space-y-1">
                  <Skeleton className="h-3.5 w-24 rounded" />
                  <Skeleton className="h-3 w-16 rounded-full" />
                </div>
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            ) : (
              <>
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-sm font-semibold text-foreground">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="mt-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {user?.role === "SUPER_ADMIN"
                      ? "CEO / Admin"
                      : user?.role === "HR_HEAD"
                      ? "HR Manager"
                      : user?.role}
                  </span>
                </div>

                <Avatar className="h-9 w-9 border border-border">
                  <AvatarImage src={user?.profileImage || ""} alt={user?.firstName} />
                  <AvatarFallback className="bg-primary/20 text-secondary font-bold">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
              </>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push("/workspace/profile")}
                className="flex items-center cursor-pointer"
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => router.push("/workspace/profile?tab=security#sessions")}
                className="flex items-center cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Manage Sessions</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-rose-600 focus:text-rose-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

// ==========================================
// NOTIFICATION SUBCOMPONENTS
// ==========================================
const fetchNotifications = async (filter: "unread" | "all" = "unread") => {
  const token = typeof window !== "undefined" ? localStorage.getItem("hrms_token") : null;
  if (!token) return [];
  const endpoint = filter === "all" ? "/notifications?limit=40" : "/notifications/unread";
  const res = await axios.get(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}${endpoint}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return Array.isArray(res.data) ? res.data : [];
};

function NotificationDot() {
  const { data: notifications } = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: () => fetchNotifications("unread"),
    refetchInterval: 30000,
  });

  if (!notifications || notifications.length === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-background animate-in zoom-in-50">
      {notifications.length > 9 ? "9+" : notifications.length}
    </span>
  );
}

function MarkAllReadButton() {
  const queryClient = useQueryClient();
  const markAllMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/notifications/read-all`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  return (
    <button
      onClick={() => markAllMutation.mutate()}
      className="text-xs text-primary hover:underline font-medium flex items-center gap-1 cursor-pointer"
      title="Mark all as read"
    >
      <Check className="w-3.5 h-3.5" /> Mark all read
    </button>
  );
}

function getNotificationIcon(type?: string, title?: string) {
  if (title?.toUpperCase().includes("[URGENT]")) {
    return <AlertTriangle className="w-4 h-4 text-rose-500" />;
  }
  switch (type?.toUpperCase()) {
    case "ANNOUNCEMENT":
      return <Megaphone className="w-4 h-4 text-amber-500" />;
    case "ALERT":
      return <AlertTriangle className="w-4 h-4 text-rose-500" />;
    case "POLICY":
      return <FileText className="w-4 h-4 text-blue-500" />;
    case "LEAVE":
      return <Calendar className="w-4 h-4 text-emerald-500" />;
    case "ATTENDANCE":
      return <Clock className="w-4 h-4 text-purple-500" />;
    default:
      return <Bell className="w-4 h-4 text-primary" />;
  }
}

function NotificationList() {
  const [filter, setFilter] = useState<"unread" | "all">("unread");
  const [selectedNotif, setSelectedNotif] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", filter],
    queryFn: () => fetchNotifications(filter),
  });

  const readMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem("hrms_token");
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/notifications/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (selectedNotif) setSelectedNotif(null);
    },
  });

  const handleNotificationClick = (notif: any) => {
    setSelectedNotif(notif);
    if (!notif.isRead) {
      readMutation.mutate(notif.id);
    }
  };

  return (
    <>
      {/* Filter Tabs */}
      <div className="flex items-center px-4 py-2 border-b border-border bg-muted/20 gap-2 text-xs">
        <button
          onClick={() => setFilter("unread")}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            filter === "unread"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            filter === "all"
              ? "bg-primary text-primary-foreground font-semibold"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          All Activity
        </button>
      </div>

      {isLoading ? (
        <NotificationListSkeleton count={4} />
      ) : !notifications || notifications.length === 0 ? (
        <div className="p-8 text-center text-xs text-muted-foreground">
          {filter === "unread" ? "You're all caught up! 🎉" : "No notification history yet."}
        </div>
      ) : (
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
          {notifications.map((notif: any) => {
            const isUrgent = notif.title?.toUpperCase().includes("[URGENT]");
            return (
              <div
                key={notif.id}
                className={`p-3.5 transition-colors flex items-start gap-3 group cursor-pointer ${
                  notif.isRead
                    ? "bg-background/40 hover:bg-muted/40 opacity-75"
                    : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
                }`}
                onClick={() => handleNotificationClick(notif)}
              >
                <div className="p-2 rounded-lg bg-background border border-border shadow-xs shrink-0 mt-0.5">
                  {getNotificationIcon(notif.type, notif.title)}
                </div>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isUrgent && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30">
                        URGENT
                      </span>
                    )}
                    <p
                      className={`text-xs text-foreground truncate ${
                        notif.isRead ? "font-medium" : "font-bold"
                      }`}
                    >
                      {notif.title.replace("[URGENT] ", "")}
                    </p>
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {new Date(notif.createdAt).toLocaleDateString()} at{" "}
                    {new Date(notif.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!notif.isRead && <span className="w-2 h-2 rounded-full bg-primary" />}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(notif.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground/50 hover:text-rose-500 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog for reading full notification */}
      {selectedNotif && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-in fade-in"
          onClick={() => setSelectedNotif(null)}
        >
          <div
            className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-5 space-y-4 text-left animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
                {getNotificationIcon(selectedNotif.type, selectedNotif.title)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">{selectedNotif.title}</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Received on {new Date(selectedNotif.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-muted/30 border border-border text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedNotif.message}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => deleteMutation.mutate(selectedNotif.id)}
                className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 font-medium cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedNotif(null)}
                className="text-xs h-8"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
