"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{
    email: string;
    role: string;
    employee?: { firstName: string; lastName: string };
  } | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setUser(d.data);
      })
      .catch(() => {});
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/signin");
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="bg-white border-b border-surface-200 px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-surface-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-xl font-bold text-surface-900">Dayflow</span>
        </Link>

        <div className="flex items-center gap-4">
          {user && (
            <>
              <span className="text-sm text-surface-500">
                {user.employee
                  ? `${user.employee.firstName} ${user.employee.lastName}`
                  : user.email}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  isAdmin ? "bg-surface-900 text-white" : "bg-accent-100 text-accent-700"
                }`}
              >
                {user.role}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-surface-500 hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
