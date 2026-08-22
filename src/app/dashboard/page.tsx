"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface Employee { firstName: string; lastName: string; designation?: string | null; department?: string | null; profilePicture?: string | null; }
interface AttendanceRecord { id: string; date: string; checkIn: string | null; checkOut: string | null; status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE"; }

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
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

  useEffect(() => { loadData(); }, []);

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
      const res = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await res.json();
      if (data.success) { toast("success", hasCheckedIn ? "Checked out successfully" : "Checked in successfully"); await loadData(); }
      else { toast("error", data.error ?? "Something went wrong"); }
    } catch { toast("error", "Something went wrong"); }
    setActionLoading(false);
  };

  const activities: { icon: string; desc: string; time: string }[] = [];
  leaves.slice(0, 4).forEach((l: Record<string, unknown>) => {
    const status = l.status as string;
    const t = String(l.type).toLowerCase();
    if (status === "APPROVED") activities.push({ icon: "check_circle", desc: `Your ${t} leave was approved`, time: String(l.createdAt) });
    else if (status === "REJECTED") activities.push({ icon: "cancel", desc: `Your ${t} leave was rejected`, time: String(l.createdAt) });
    else if (status === "PENDING") activities.push({ icon: "date_range", desc: `You applied for ${t} leave`, time: String(l.createdAt) });
  });
  attendance.slice(0, 4).forEach((r) => {
    if (r.checkIn) activities.push({ icon: "event_available", desc: `Checked in at ${new Date(r.checkIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`, time: r.checkIn });
  });
  activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const recentActivity = activities.slice(0, 6);

  const fullName = employee ? `${employee.firstName} ${employee.lastName}` : "";

  if (loading) {
    return (
      <div className="flex flex-col gap-gutter">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {[1, 2, 3, 4].map((n) => <div key={n} className="bg-surface-pure rounded-xl p-6 border border-border-light animate-pulse h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-gutter">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-xl text-primary tracking-tight mb-2">Welcome back, {employee?.firstName || "Employee"}</h1>
          <p className="text-body-lg text-secondary">Here&apos;s your attendance and leave summary for today.</p>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        {/* Profile card */}
        <div className="bg-surface-pure rounded-xl p-6 ambient-shadow border border-surface-variant flex flex-col">
          <div className="w-12 h-12 bg-secondary-container rounded-lg text-on-secondary-container flex items-center justify-center mb-4">
            <Icon name="person" filled className="text-[24px]" />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <Avatar src={employee?.profilePicture} name={fullName} size="md" />
            <div className="min-w-0">
              <p className="font-headline text-body-lg font-semibold text-primary truncate">{fullName}</p>
              <p className="text-body-sm text-secondary truncate">{employee?.designation || "—"}</p>
            </div>
          </div>
          <Link href="/dashboard/profile" className="mt-auto inline-flex items-center gap-1 text-label-md uppercase text-primary hover:underline">
            View Profile <Icon name="arrow_forward" className="text-[16px]" />
          </Link>
        </div>

        {/* Attendance card */}
        <div className="bg-surface-pure rounded-xl p-6 ambient-shadow border border-surface-variant flex flex-col">
          <div className="w-12 h-12 bg-secondary-container rounded-lg text-on-secondary-container flex items-center justify-center mb-4">
            <Icon name="event_available" filled className="text-[24px]" />
          </div>
          <p className="text-label-md text-secondary uppercase mb-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</p>
          <p className="text-body-sm text-on-surface-variant mb-4">
            {hasCheckedIn && todayRecord?.checkIn ? `Checked in at ${new Date(todayRecord.checkIn).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : hasCheckedOut ? "Day complete" : "Not checked in yet"}
          </p>
          <Button onClick={handleCheckInOut} loading={actionLoading} disabled={hasCheckedOut} variant={hasCheckedIn ? "secondary" : "primary"} arrow={!hasCheckedIn} className="mt-auto w-full">
            {hasCheckedIn ? "Check Out" : "Check In"}
          </Button>
        </div>

        {/* Leave card */}
        <div className="bg-surface-pure rounded-xl p-6 ambient-shadow border border-surface-variant flex flex-col">
          <div className="w-12 h-12 bg-secondary-container rounded-lg text-on-secondary-container flex items-center justify-center mb-4">
            <Icon name="date_range" filled className="text-[24px]" />
          </div>
          <div className="mb-4">
            <span className="font-headline text-headline-lg text-primary">{pendingLeaves}</span>
            <p className="text-body-sm text-secondary mt-0.5">Pending Requests</p>
          </div>
          <Link href="/dashboard/leave?apply=1" className="mt-auto w-full inline-flex items-center justify-center px-4 py-2.5 text-label-md uppercase tracking-wider rounded bg-surface-container-low text-secondary border border-border-light hover:bg-surface-container-high hover:text-primary transition-colors">
            Apply for Leave
          </Link>
        </div>

        {/* Progress card */}
        <div className="bg-surface-pure rounded-xl p-6 ambient-shadow border border-surface-variant flex flex-col">
          <div className="w-12 h-12 bg-secondary-container rounded-lg text-on-secondary-container flex items-center justify-center mb-4">
            <Icon name="trending_up" filled className="text-[24px]" />
          </div>
          <div className="mb-1">
            <span className="font-headline text-headline-lg text-primary">{daysPresent}</span>
            <span className="text-body-sm text-secondary ml-1.5">/ {workingDays} days</span>
          </div>
          <p className="text-body-sm text-secondary mb-3">Present this month</p>
          <div className="mt-auto">
            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="text-label-md text-secondary mt-1.5 uppercase">{progressPercent}%</p>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <div className="bg-surface-pure rounded-xl p-container-padding ambient-shadow border border-surface-variant flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-headline text-headline-md text-primary">Recent Activity</h2>
        </div>
        {recentActivity.length === 0 ? (
          <EmptyState icon="history" title="No recent activity" description="Your check-ins, leave requests, and updates will show up here." />
        ) : (
          <div className="flex flex-col gap-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center shrink-0 text-secondary">
                  <Icon name={item.icon} className="text-[20px]" />
                </div>
                <div className="flex-1">
                  <p className="text-body-sm text-on-surface">{item.desc}</p>
                  <p className="text-label-md text-secondary mt-0.5 uppercase">{timeAgo(item.time)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
