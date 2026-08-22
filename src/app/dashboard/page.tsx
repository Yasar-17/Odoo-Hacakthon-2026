"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Employee {
  firstName: string;
  lastName: string;
  designation?: string | null;
  department?: string | null;
  profilePicture?: string | null;
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
}

type ActivityType = "leave" | "attendance" | "profile" | "payroll";

interface ActivityItem {
  type: ActivityType;
  description: string;
  timestamp: string;
}

const activityIcons: Record<ActivityType, { icon: React.ReactNode; bg: string }> = {
  leave: {
    bg: "bg-info-light text-info-text",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  },
  attendance: {
    bg: "bg-success-light text-success-text",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  profile: {
    bg: "bg-primary-50 text-primary-700",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  },
  payroll: {
    bg: "bg-warning-light text-warning-text",
    icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />,
  },
};

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-surface-200" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-surface-200 rounded w-1/2" />
          <div className="h-2.5 bg-surface-100 rounded w-1/3" />
        </div>
      </div>
      <div className="h-3 bg-surface-200 rounded w-3/4 mb-2" />
      <div className="h-8 bg-surface-100 rounded-lg mt-4" />
    </div>
  );
}

export default function DashboardPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<Record<string, unknown>[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    const [empData, attData, leaveData] = await Promise.all([
      fetch("/api/employees").then((r) => r.json()).catch(() => ({ success: false })),
      fetch("/api/attendance").then((r) => r.json()).catch(() => ({ success: false })),
      fetch("/api/leave").then((r) => r.json()).catch(() => ({ success: false })),
    ]);
    if (empData.success) setEmployee(empData.data);
    if (attData.success) setAttendance(attData.data ?? []);
    if (leaveData.success) setLeaves(leaveData.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = attendance.find((r) => r.date.split("T")[0] === today);
  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  const pendingLeaves = leaves.filter((l) => l.status === "PENDING").length;

  const monthRecords = attendance.filter((r) => {
    const d = new Date(r.date);
    return d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
  });
  const daysPresent = monthRecords.filter((r) => r.status === "PRESENT").length;
  const workingDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const progressPercent = workingDays > 0 ? Math.min(100, Math.round((daysPresent / workingDays) * 100)) : 0;

  const handleCheckInOut = async () => {
    setActionLoading(true);
    const action = hasCheckedIn ? "checkout" : "checkin";
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", hasCheckedIn ? "Checked out successfully" : "Checked in successfully");
        await loadData();
      } else {
        toast("error", data.error ?? "Something went wrong");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setActionLoading(false);
  };

  // Build activity feed
  const activities: ActivityItem[] = [];
  leaves.slice(0, 4).forEach((l: Record<string, unknown>) => {
    const status = l.status as string;
    if (status === "APPROVED") activities.push({ type: "leave", description: `Your ${String(l.type).toLowerCase()} leave was approved`, timestamp: String(l.createdAt) });
    else if (status === "REJECTED") activities.push({ type: "leave", description: `Your ${String(l.type).toLowerCase()} leave was rejected`, timestamp: String(l.createdAt) });
    else if (status === "PENDING") activities.push({ type: "leave", description: `You applied for ${String(l.type).toLowerCase()} leave`, timestamp: String(l.createdAt) });
  });
  attendance.slice(0, 4).forEach((r) => {
    if (r.checkIn) activities.push({ type: "attendance", description: `Checked in at ${new Date(r.checkIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`, timestamp: r.checkIn });
  });

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const recentActivity = activities.slice(0, 6);

  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : "";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => <CardSkeleton key={n} />)}
        </div>
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 animate-pulse">
          <div className="h-4 bg-surface-200 rounded w-40 mb-5" />
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-3 py-3 border-b border-surface-100 last:border-0">
              <div className="w-8 h-8 rounded-full bg-surface-200 shrink-0" />
              <div className="h-3 bg-surface-100 rounded flex-1" />
              <div className="h-2.5 bg-surface-100 rounded w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick-access cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Profile card */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 flex flex-col">
          <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={employee?.profilePicture} name={fullName} size="lg" className="!w-16 !h-16" />
            <div className="min-w-0">
              <p className="font-semibold text-surface-900 truncate">{fullName}</p>
              <p className="text-sm text-surface-500 truncate">{employee?.designation || "—"}</p>
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            View Profile
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>

        {/* Attendance card */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 flex flex-col">
          <div className="w-10 h-10 rounded-full bg-success-light text-success-text flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-xs font-mono uppercase tracking-wide text-surface-400 mb-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
          <p className="text-sm font-medium text-surface-700 mb-4">
            {hasCheckedIn && todayRecord?.checkIn
              ? `Checked in at ${new Date(todayRecord.checkIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
              : hasCheckedOut
              ? "Day complete"
              : "Not checked in yet"}
          </p>
          <Button
            onClick={handleCheckInOut}
            loading={actionLoading}
            disabled={hasCheckedOut}
            variant={hasCheckedIn ? "secondary" : "primary"}
            className="mt-auto w-full"
          >
            {hasCheckedIn ? "Check Out" : "Check In"}
          </Button>
        </div>

        {/* Leave Requests card */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 flex flex-col">
          <div className="w-10 h-10 rounded-full bg-info-light text-info-text flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="mb-4">
            <span className="text-3xl font-bold font-mono text-surface-900">{pendingLeaves}</span>
            <p className="text-sm text-surface-500 mt-0.5">Pending Requests</p>
          </div>
          <Link
            href="/dashboard/leave?apply=1"
            className="mt-auto w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg bg-surface-100 text-surface-700 border border-surface-300 hover:bg-surface-200 transition-colors"
          >
            Apply for Leave
          </Link>
        </div>

        {/* Quick stat card */}
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 flex flex-col">
          <div className="w-10 h-10 rounded-full bg-warning-light text-warning-text flex items-center justify-center mb-4">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="mb-1">
            <span className="text-3xl font-bold font-mono text-surface-900">{daysPresent}</span>
            <span className="text-sm font-mono text-surface-400 ml-1.5">/{workingDays} days</span>
          </div>
          <p className="text-sm text-surface-500 mb-3">Present this month</p>
          <div className="mt-auto">
            <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
              <div className="h-full bg-success rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-xs text-surface-400 mt-1.5 font-mono">{progressPercent}%</p>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm">
        <div className="px-5 py-4 border-b border-surface-200">
          <h2 className="text-base font-semibold text-surface-900">Recent Activity</h2>
        </div>

        {recentActivity.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-300 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-surface-400">No recent activity</p>
          </div>
        ) : (
          <ul>
            {recentActivity.map((item, i) => {
              const meta = activityIcons[item.type];
              return (
                <li key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < recentActivity.length - 1 ? "border-b border-surface-100" : ""}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${meta.bg}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {meta.icon}
                    </svg>
                  </div>
                  <p className="text-sm text-surface-700 flex-1 min-w-0">{item.description}</p>
                  <span className="text-xs text-surface-400 shrink-0">{timeAgo(item.timestamp)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
