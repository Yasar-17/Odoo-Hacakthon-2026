"use client";

import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import NotificationBell from "./NotificationBell";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/profile": "Profile",
  "/dashboard/attendance": "Attendance",
  "/dashboard/leave": "Leave Requests",
  "/dashboard/payroll": "Payroll",
  "/admin": "Dashboard",
  "/admin/employees": "Employees",
  "/admin/attendance": "Attendance",
  "/admin/leave": "Leave Approvals",
  "/admin/payroll": "Payroll Control",
};

interface TopBarProps {
  onHamburgerClick: () => void;
  isAdmin?: boolean;
}

export default function TopBar({ onHamburgerClick, isAdmin }: TopBarProps) {
  const pathname = usePathname();

  const title = Object.entries(pageTitles).find(([path]) =>
    path === "/dashboard" || path === "/admin" ? pathname === path : pathname.startsWith(path)
  )?.[1] ?? "Dayflow";

  return (
    <header className="lg:hidden flex justify-between items-center w-full px-margin-mobile h-16 bg-surface border-b border-outline-variant sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onHamburgerClick}
          className="text-primary p-2 hover:bg-surface-container-low rounded-full transition-colors"
        >
          <Icon name="menu" className="text-[22px]" />
        </button>
        <span className="font-headline text-headline-lg-mobile font-bold text-primary">{title}</span>
      </div>
      <div className="flex items-center gap-2">
        <NotificationBell isAdmin={isAdmin} />
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
          <span className="text-on-primary font-bold text-sm font-headline">D</span>
        </div>
      </div>
    </header>
  );
}
