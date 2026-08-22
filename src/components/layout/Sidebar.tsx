"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

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
  const [user, setUser] = useState<{ email: string; role: string; employee?: { firstName: string; lastName: string } } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const links = isAdmin ? adminNav : employeeNav;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUser(d.data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
  };

  const userName = user?.employee ? `${user.employee.firstName} ${user.employee.lastName}` : user?.email ?? "";

  const isActive = (href: string) =>
    href === "/dashboard" || href === "/admin" ? pathname === href : pathname.startsWith(href);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 flex items-center gap-2">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
          <span className="text-on-primary font-bold text-lg font-headline">D</span>
        </div>
        <div>
          <span className="font-headline text-xl font-bold text-primary leading-none">Dayflow</span>
          <p className="text-label-md text-secondary uppercase tracking-wider mt-0.5">
            {isAdmin ? "Admin Portal" : "Employee Portal"}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 mt-2 scrollbar-thin">
        <ul className="flex flex-col gap-1">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onMobileClose}
                  className={`flex items-center gap-4 py-3 px-6 rounded-r-lg transition-all ${
                    active
                      ? "bg-secondary-container text-on-secondary-container border-l-4 border-primary font-semibold"
                      : "text-secondary opacity-70 hover:bg-surface-container-high hover:opacity-100"
                  }`}
                >
                  <Icon name={link.icon} filled={active} className="text-[22px]" />
                  <span className="text-label-md uppercase">{link.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-2 pb-4 border-t border-outline-variant pt-4">
        <ul className="flex flex-col gap-1">
          <li>
            <button className="w-full flex items-center gap-4 text-secondary opacity-70 py-3 px-6 hover:bg-surface-container-high hover:opacity-100 transition-all rounded-r-lg">
              <Icon name="help" className="text-[22px]" />
              <span className="text-label-md uppercase">Help Center</span>
            </button>
          </li>
          <li>
            <button onClick={handleLogout} className="w-full flex items-center gap-4 text-secondary opacity-70 py-3 px-6 hover:bg-surface-container-high hover:opacity-100 transition-all rounded-r-lg">
              <Icon name="logout" className="text-[22px]" />
              <span className="text-label-md uppercase">Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col h-screen bg-surface border-r border-outline-variant fixed left-0 top-0 w-sidebar z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-sidebar bg-surface shadow-xl z-50">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
