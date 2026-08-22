"use client";

import { usePathname } from "next/navigation";

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
  "/admin/payroll": "Payroll",
};

interface TopBarProps {
  onHamburgerClick: () => void;
}

export default function TopBar({ onHamburgerClick }: TopBarProps) {
  const pathname = usePathname();

  const title = Object.entries(pageTitles).find(([path]) =>
    path === "/dashboard" || path === "/admin" ? pathname === path : pathname.startsWith(path)
  )?.[1] ?? "Dayflow";

  return (
    <header className="sticky top-0 z-20 h-topbar bg-white border-b border-surface-200 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onHamburgerClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-100 text-surface-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-surface-900">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-100 text-surface-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger rounded-full" />
        </button>
      </div>
    </header>
  );
}
