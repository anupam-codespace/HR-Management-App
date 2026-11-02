// ============================================================
// Permissions System — Type Definitions & Constants
// ============================================================
// This file defines the complete set of configurable items that
// an admin can toggle on/off per designation.
// ============================================================

import {
  LayoutDashboard,
  Users,
  Clock,
  Calendar,
  CalendarClock,
  CalendarCheck,
  Settings,
  Banknote,
  Calculator,
  Briefcase,
  CheckSquare,
  FolderOpen,
  CalendarIcon,
  UserCheck,
  LogOut,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";

// ----- Sidebar Modules -----

export interface SidebarModuleDefinition {
  key: string;
  label: string;
  icon: LucideIcon;
  href: string;
  description: string;
  /** Roles that would see this in the old hardcoded system */
  defaultRoles: string[];
}

export const SIDEBAR_MODULES: SidebarModuleDefinition[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/workspace/dashboard",
    description: "Main dashboard with widgets and overview",
    defaultRoles: ["EMPLOYEE", "MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "onboarding",
    label: "Onboarding",
    icon: UserCheck,
    href: "/workspace/onboarding",
    description: "New hire onboarding pipeline & checklist",
    defaultRoles: ["MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
  }, 
  {
    key: "recruitment",
    label: "Recruitment",
    icon: Briefcase,
    href: "/workspace/recruitment",
    description: "Manpower requisitions, approvals & job vacancies",
    defaultRoles: ["MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "training",
    label: "Training & Development",
    icon: GraduationCap,
    href: "/workspace/training",
    description: "Universal training plans, competencies & career progression",
    defaultRoles: ["EMPLOYEE", "MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "employees",
    label: "Employees",
    icon: Users,
    href: "/workspace/employees",
    description: "Employee directory and management",
    defaultRoles: ["MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "attendance",
    label: "Clock ins/outs",
    icon: Clock,
    href: "/workspace/attendance",
    description: "Personal attendance and clock in/out",
    defaultRoles: ["EMPLOYEE", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "schedules",
    label: "Schedules",
    icon: Calendar,
    href: "/workspace/schedules",
    description: "View assigned schedules",
    defaultRoles: ["EMPLOYEE", "MANAGER"],
  },
  {
    key: "leave",
    label: "Leave",
    icon: CalendarClock,
    href: "/workspace/leave",
    description: "Apply for and track leave requests",
    defaultRoles: ["EMPLOYEE", "MANAGER"],
  },
  {
    key: "leave_approvals",
    label: "Leave Approvals",
    icon: CalendarCheck,
    href: "/workspace/leave/admin",
    description: "Approve or reject employee leave requests",
    defaultRoles: ["MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "leave_policies",
    label: "Leave Policies",
    icon: Settings,
    href: "/workspace/leave/admin/settings",
    description: "Configure leave types and policies",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "payslips",
    label: "My Payslips",
    icon: Banknote,
    href: "/workspace/my-payslips",
    description: "View and download personal payslips",
    defaultRoles: ["EMPLOYEE", "MANAGER"],
  },
  {
    key: "payroll",
    label: "Payroll Processing",
    icon: Calculator,
    href: "/workspace/payroll/admin",
    description: "Process and manage company payroll",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "shifts",
    label: "Shifts",
    icon: Briefcase,
    href: "/workspace/shifts",
    description: "View and manage shift assignments",
    defaultRoles: ["EMPLOYEE"],
  },
  {
    key: "tasks",
    label: "Tasks",
    icon: CheckSquare,
    href: "/workspace/tasks",
    description: "Task assignments and tracking",
    defaultRoles: ["EMPLOYEE", "MANAGER"],
  },
  {
    key: "documents",
    label: "Documents",
    icon: FolderOpen,
    href: "/workspace/documents",
    description: "Access personal and shared documents",
    defaultRoles: ["EMPLOYEE", "MANAGER"],
  },
  {
    key: "documents_admin",
    label: "Documents (Admin)",
    icon: FolderOpen,
    href: "/workspace/documents/admin",
    description: "Manage all company documents",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "manage_schedules",
    label: "Manage Schedules",
    icon: CalendarIcon,
    href: "/workspace/schedules/admin",
    description: "Create and manage shift schedules",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "resignation",
    label: "Resignations",
    icon: LogOut,
    href: "/workspace/resignation",
    description: "Employee resignation, notice period, and exit clearance",
    defaultRoles: ["MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    href: "/workspace/settings",
    description: "Company configuration and system settings",
    defaultRoles: ["SUPER_ADMIN", "OWNER", "HR_HEAD", "MANAGER"],
  },
];

// ----- Module Permissions (CRUD) -----

export const PERMISSION_MODULES = [
  { key: "employees", label: "Employees", description: "Manage employee records" },
  { key: "attendance", label: "Attendance", description: "Attendance tracking and reports" },
  { key: "leave", label: "Leave", description: "Leave requests and approvals" },
  { key: "payroll", label: "Payroll", description: "Payroll processing and payslips" },
  { key: "shifts", label: "Shifts", description: "Shift management" },
  { key: "tasks", label: "Tasks", description: "Task assignment and tracking" },
  { key: "documents", label: "Documents", description: "Document management" },
  { key: "schedules", label: "Schedules", description: "Schedule management" },
  { key: "resignation", label: "Resignation", description: "Resignation requests and exit clearance" },
  { key: "settings", label: "Settings", description: "System configuration" },
  { key: "reports", label: "Reports", description: "Analytics and reports" },
] as const;

export const PERMISSION_ACTIONS = ["view", "create", "edit", "delete"] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

// ----- Dashboard Widgets -----

export interface DashboardWidgetDefinition {
  key: string;
  label: string;
  description: string;
  /** Roles that would see this in the old hardcoded system */
  defaultRoles: string[];
  /** Category for grouping in the admin UI */
  category: "personal" | "team" | "admin" | "company";
}

export const DASHBOARD_WIDGETS: DashboardWidgetDefinition[] = [
  {
    key: "welcome_banner",
    label: "Welcome Banner",
    description: "Personalized greeting with attendance summary",
    defaultRoles: ["EMPLOYEE", "MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "personal",
  },
  {
    key: "clock_in_widget",
    label: "Clock In/Out Widget",
    description: "Quick clock-in/clock-out action widget",
    defaultRoles: ["EMPLOYEE", "MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "personal",
  },
  {
    key: "attendance_stats",
    label: "Attendance Statistics",
    description: "Company-wide attendance cards (total, present, absent, late)",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "admin",
  },
  {
    key: "employee_stats",
    label: "Employee Statistics",
    description: "Total employees, departments, and role distribution",
    defaultRoles: ["MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "admin",
  },
  {
    key: "leave_balance",
    label: "Leave Balance Overview",
    description: "Holidays and leave stats overview",
    defaultRoles: ["EMPLOYEE", "MANAGER"],
    category: "personal",
  },
  {
    key: "leave_balances_table",
    label: "Employee Leave Balances Table",
    description: "Tabular view of all employee leave balances",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "admin",
  },
  {
    key: "team_activity",
    label: "Live Activity Feed",
    description: "Real-time audit log of employee activities",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "admin",
  },
  {
    key: "announcements",
    label: "Announcements",
    description: "Company announcements and notices",
    defaultRoles: ["EMPLOYEE", "MANAGER", "HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "company",
  },
  {
    key: "quick_actions",
    label: "Quick Actions / Shortcuts",
    description: "Admin shortcut links to settings, schedules, etc.",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "admin",
  },
  {
    key: "team_overview",
    label: "Team Overview",
    description: "View team/department coworkers",
    defaultRoles: ["EMPLOYEE", "MANAGER"],
    category: "team",
  },
  {
    key: "quick_reports",
    label: "Quick Reports",
    description: "Links to overtime, leave summary, and payslips",
    defaultRoles: ["EMPLOYEE"],
    category: "personal",
  },
  {
    key: "payroll_summary",
    label: "Payroll Summary",
    description: "Payroll processing overview and quick stats",
    defaultRoles: ["HR_HEAD", "SUPER_ADMIN", "OWNER"],
    category: "admin",
  },
] as const;

// ----- Designation Type -----

export interface Designation {
  id: string;
  name: string;
  description: string;
  baseRole: "EMPLOYEE" | "MANAGER" | "HR_HEAD" | "SUPER_ADMIN";
  color: string;
  isDefault: boolean;
  sidebarModules: string[];
  modulePermissions: Record<string, string[]>;
  dashboardWidgets: string[];
  employeeCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ----- Helper: Get default permission config for a base role -----

export function getDefaultSidebarModules(baseRole: string): string[] {
  return SIDEBAR_MODULES
    .filter((m) => m.defaultRoles.includes(baseRole))
    .map((m) => m.key);
}

export function getDefaultDashboardWidgets(baseRole: string): string[] {
  return DASHBOARD_WIDGETS
    .filter((w) => w.defaultRoles.includes(baseRole))
    .map((w) => w.key);
}

export function getDefaultModulePermissions(baseRole: string): Record<string, string[]> {
  const permissions: Record<string, string[]> = {};

  for (const mod of PERMISSION_MODULES) {
    switch (baseRole) {
      case "SUPER_ADMIN":
      case "OWNER":
        permissions[mod.key] = ["view", "create", "edit", "delete"];
        break;
      case "HR_HEAD":
        permissions[mod.key] = ["view", "create", "edit", "delete"];
        break;
      case "MANAGER":
        if (["employees", "attendance", "leave", "tasks", "schedules"].includes(mod.key)) {
          permissions[mod.key] = ["view", "edit"];
        } else {
          permissions[mod.key] = ["view"];
        }
        break;
      case "EMPLOYEE":
      default:
        if (["leave", "documents", "tasks"].includes(mod.key)) {
          permissions[mod.key] = ["view", "create"];
        } else {
          permissions[mod.key] = ["view"];
        }
        break;
    }
  }

  return permissions;
}

// ----- Badge color presets for designations -----

export const DESIGNATION_COLORS = [
  { name: "Emerald", value: "#10B981" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Rose", value: "#F43F5E" },
  { name: "Amber", value: "#F59E0B" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Pink", value: "#EC4899" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Orange", value: "#F97316" },
] as const;
