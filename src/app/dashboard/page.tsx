"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function DashboardPage() {
  const [employee, setEmployee] = useState<Record<string, unknown> | null>(null);
  const [attendance, setAttendance] = useState<Record<string, unknown>[]>([]);
  const [leaves, setLeaves] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/leave").then((r) => r.json()),
    ]).then(([empData, attData, leaveData]) => {
      if (empData.success) setEmployee(empData.data);
      if (attData.success) setAttendance(attData.data?.slice(0, 5) || []);
      if (leaveData.success) setLeaves(leaveData.data || []);
    });
  }, []);

  const emp = employee as { firstName?: string; lastName?: string; department?: string; designation?: string } | null;
  const pendingLeaves = leaves.filter((l: Record<string, unknown>) => l.status === "PENDING");

  const quickLinks = [
    { href: "/dashboard/profile", label: "Profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "bg-primary-50 text-primary-600" },
    { href: "/dashboard/attendance", label: "Attendance", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", color: "bg-accent-50 text-accent-600" },
    { href: "/dashboard/leave", label: "Leave Requests", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "bg-amber-50 text-amber-600" },
    { href: "/dashboard/payroll", label: "Payroll", icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z", color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <h1 className="text-2xl font-bold text-surface-900">
          Welcome back, {emp?.firstName || "Employee"} {emp?.lastName || ""}
        </h1>
        <p className="text-surface-500 mt-1">
          {emp?.department || "Department"} &middot; {emp?.designation || "Designation"}
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${link.color}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={link.icon} />
                </svg>
              </div>
              <h3 className="font-medium text-surface-900">{link.label}</h3>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Recent Attendance</h2>
          {attendance.length === 0 ? (
            <p className="text-surface-400 text-sm">No attendance records this month.</p>
          ) : (
            <div className="space-y-2">
              {attendance.map((rec: Record<string, unknown>, i: number) => {
                const date = new Date(rec.date as string);
                const ci = rec.checkIn ? new Date(rec.checkIn as string) : null;
                const co = rec.checkOut ? new Date(rec.checkOut as string) : null;
                return (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                    <span className="text-sm text-surface-600">
                      {date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-sm text-surface-500">
                      {ci ? ci.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-"} &rarr;{" "}
                      {co ? co.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </span>
                    <Badge variant={rec.status === "PRESENT" ? "success" : rec.status === "ABSENT" ? "danger" : "warning"}>
                      {rec.status as string}
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Leave Summary</h2>
          <div className="flex items-center gap-4 mb-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary-600">{pendingLeaves.length}</div>
              <div className="text-xs text-surface-500">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent-600">
                {leaves.filter((l: Record<string, unknown>) => l.status === "APPROVED").length}
              </div>
              <div className="text-xs text-surface-500">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {leaves.filter((l: Record<string, unknown>) => l.status === "REJECTED").length}
              </div>
              <div className="text-xs text-surface-500">Rejected</div>
            </div>
          </div>
          <Link href="/dashboard/leave" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all requests &rarr;
          </Link>
        </Card>
      </div>
    </div>
  );
}
