"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Settings,
  Clock,
  Calendar,
  Briefcase,
  CheckSquare,
  FolderOpen,
  HelpCircle,
  CalendarCheck,
  CalendarIcon,
  Banknote,
  Calculator,
  Shield,
  UserCheck,
  LogOut,
  GraduationCap,
  type LucideIcon,
} from "lucide-react";
import { useViewMode } from "@/context/ViewModeContext";
import { SIDEBAR_MODULES } from "@/lib/permissions";
import { usePermissions } from "@/context/PermissionContext";

// Map string icon names to actual icon components
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  CalendarClock,
  Settings,
  Clock,
  Calendar,
  Briefcase,
  CheckSquare,
  FolderOpen,
  CalendarCheck,
  CalendarIcon,
  Banknote,
  Calculator,
  Shield,
  UserCheck,
  LogOut,
  GraduationCap,
};

export default function Sidebar({
  role,
  className,
}: {
  role?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const { user, isViewAsUser } = useViewMode();
  const { sidebarModuleKeys, designation } = usePermissions();

  // If base user role is MANAGER and viewAsUser toggle is off, we are in Manager Mode
  const isManagerMode = user?.role === "MANAGER" && !isViewAsUser;

  // Build links dynamically from designation permissions
  // Falls back to role-based defaults if no designation is assigned
  const links = buildSidebarLinks(sidebarModuleKeys);

  // Add Designations link for admins (always visible for SUPER_ADMIN/OWNER/HR_HEAD)
  const isAdminOrHR = user?.role === "SUPER_ADMIN" || user?.role === "OWNER" || user?.role === "HR_HEAD";
  const finalLinks = isAdminOrHR && !links.some((l) => l.href === "/workspace/settings/designations")
    ? [
        ...links,
        {
          name: "Designations",
          href: "/workspace/settings/designations",
          icon: Shield,
        },
      ]
    : links;

  const activeHref = finalLinks
    .filter(
      (link) => pathname === link.href || pathname.startsWith(`${link.href}/`),
    )
    .sort(
      (firstLink, secondLink) => secondLink.href.length - firstLink.href.length,
    )[0]?.href;

  const isSimulatedUser = user?.role === "MANAGER" && isViewAsUser;

  const navigation = (
    <>
      <div className="flex flex-col flex-1 min-h-0 bg-card">
        {/* Logo / Brand Area */}
        <div className="h-20 flex flex-col justify-center px-8 border-b border-border shrink-0">
          <span className="text-xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            TeamHub HRMS
          </span>
          {isManagerMode && (
            <span className="mt-1 self-start text-[9px] font-bold bg-secondary text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
              Manager Portal
            </span>
          )}
          {isSimulatedUser && (
            <span className="mt-1 self-start text-[9px] font-bold bg-primary/20 text-secondary px-2 py-0.5 rounded-full uppercase tracking-wider">
              User View
            </span>
          )}
          {isAdminOrHR && (
            <span className="mt-1 self-start text-[9px] font-bold bg-secondary text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
              Admin View
            </span>
          )}
          {/* Show designation name if assigned */}
          {designation && !isSimulatedUser && (
            <span
              className="mt-0.5 self-start text-[8px] font-semibold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: `${designation.color}15`,
                borderColor: `${designation.color}40`,
                color: designation.color,
              }}
            >
              {designation.name}
            </span>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
          {finalLinks.map((link) => {
            const Icon = link.icon;
            const isActive = link.href === activeHref;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/20 text-secondary dark:text-foreground border-l-4 border-primary"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Support Link */}
      <div className="p-4 border-t border-border shrink-0 bg-card">
        <Link href="/workspace/support" className="flex items-center w-full px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-primary/10 hover:text-foreground rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <HelpCircle className="w-5 h-5 mr-3 text-muted-foreground/60" />
          Help & Support
        </Link>
      </div>
    </>
  );

  return (
    <aside
      className={`w-64 shrink-0 flex-col justify-between border-r border-border bg-card ${className}`}
    >
      {navigation}
    </aside>
  );
}

// ============================================================
// Helper: Build sidebar links from permission module keys
// ============================================================

function buildSidebarLinks(moduleKeys: string[]): { name: string; href: string; icon: LucideIcon }[] {
  return moduleKeys
    .map((key) => {
      const mod = SIDEBAR_MODULES.find((m) => m.key === key);
      if (!mod) return null;
      const icon = ICON_MAP[mod.icon.displayName || ""] || mod.icon;
      return {
        name: mod.label,
        href: mod.href,
        icon: mod.icon,
      };
    })
    .filter(Boolean) as { name: string; href: string; icon: LucideIcon }[];
}
