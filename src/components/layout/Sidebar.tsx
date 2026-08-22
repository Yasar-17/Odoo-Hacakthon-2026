"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Avatar from "@/components/ui/Avatar";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const employeeNav: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: "dashboard" },
  { href: "/dashboard/profile", label: "Profile", icon: "person" },
  { href: "/dashboard/attendance", label: "Attendance", icon: "event_available" },
  { href: "/dashboard/leave", label: "Leave Requests", icon: "date_range" },
  { href: "/dashboard/payroll", label: "Payroll", icon: "payments" },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "dashboard" },
  { href: "/admin/employees", label: "Employees", icon: "group" },
  { href: "/admin/attendance", label: "Attendance", icon: "event_available" },
  { href: "/admin/leave", label: "Leave Requests", icon: "date_range" },
  { href: "/admin/payroll", label: "Payroll Control", icon: "payments" },
];

interface SidebarProps {
  isAdmin: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isAdmin, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; role: string; employee?: { firstName: string; lastName: string; profilePictureUrl?: string | null } } | null>(null);
  const links = isAdmin ? adminNav : employeeNav;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
  };

  const userName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email ?? "";
  const initials = userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (href: string) =>
    href === "/dashboard" || href === "/admin" ? pathname === href : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 flex items-center gap-2.5">
        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-on-primary font-bold text-base font-headline">D</span>
        </div>
        <div>
          <span className="font-headline text-xl font-bold text-primary leading-none">Dayflow</span>
          <p className="text-label-md text-secondary uppercase tracking-wider mt-1">
            {isAdmin ? "Admin Portal" : "Employee Portal"}
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 mt-2 scrollbar-thin">
        <ul className="flex flex-col gap-0.5">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-4 py-3 px-4 rounded-lg transition-all duration-200 ${
                    active
                      ? "bg-secondary-container text-on-secondary-container font-semibold"
                      : "text-secondary hover:bg-surface-container-low hover:text-primary"
                  }`}
                >
                  <Icon name={link.icon} filled={active} className={`text-[22px] ${active ? "text-primary" : ""}`} />
                  <span className="text-sm">{link.label}</span>
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 pb-4 border-t border-outline-variant pt-4">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-headline font-bold text-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary truncate">{userName}</p>
            <p className="text-xs text-secondary truncate">{user?.email}</p>
          </div>
        </div>
        <ul className="flex flex-col gap-0.5">
          <li>
            <button className="w-full flex items-center gap-4 text-secondary hover:bg-surface-container-low hover:text-primary py-2.5 px-4 rounded-lg transition-all duration-200">
              <Icon name="help" className="text-[22px]" />
              <span className="text-sm">Help Center</span>
            </button>
          </li>
          <li>
            <button onClick={handleLogout} className="w-full flex items-center gap-4 text-secondary hover:bg-error-container hover:text-on-error-container py-2.5 px-4 rounded-lg transition-all duration-200">
              <Icon name="logout" className="text-[22px]" />
              <span className="text-sm">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col h-screen bg-surface border-r border-outline-variant fixed left-0 top-0 w-sidebar z-30">
        {sidebarContent}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-sidebar bg-surface shadow-2xl z-50 animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
