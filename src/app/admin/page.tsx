"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatCard from "@/components/ui/StatCard";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  department?: string | null;
  designation?: string | null;
  profilePicture?: string | null;
  dateOfJoining: string;
  user?: { employeeId: string; email: string; role: string };
}

interface LeaveRow {
  id: string;
  type: "PAID" | "SICK" | "UNPAID";
  startDate: string;
  endDate: string;
  remarks: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  employee?: EmployeeRow;
}

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const typeLabels: Record<string, string> = { PAID: "Paid Time Off", SICK: "Sick Leave", UNPAID: "Unpaid Leave" };
const typeIcons: Record<string, string> = { PAID: "beach_access", SICK: "sick", UNPAID: "calendar_month" };

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);

  const [confirming, setConfirming] = useState<{ id: string; action: "APPROVED" | "REJECTED" } | null>(null);
  const [comment, setComment] = useState("");
  const [actingId, setActingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [empRes, attRes, leaveRes] = await Promise.all([
      fetch("/api/employees").then((r) => r.json()).catch(() => ({ success: false })),
      fetch(`/api/attendance?date=${today}`).then((r) => r.json()).catch(() => ({ success: false })),
      fetch("/api/leave?status=PENDING").then((r) => r.json()).catch(() => ({ success: false })),
    ]);
    if (empRes.success) setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    if (attRes.success) setTodayAttendance(Array.isArray(attRes.data) ? attRes.data : []);
    if (leaveRes.success) setPendingLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const presentToday = todayAttendance.filter((a) => a.status === "PRESENT").length;
  const onLeaveToday = todayAttendance.filter((a) => a.status === "LEAVE").length;
  const presentPercent = employees.length > 0 ? Math.round((presentToday / employees.length) * 100) : 0;

  const handleConfirm = async () => {
    if (!confirming) return;
    setActingId(confirming.id);
    try {
      const res = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: confirming.id, status: confirming.action, adminComments: comment }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", confirming.action === "APPROVED" ? "Leave approved" : "Leave rejected");
        setConfirming(null);
        setComment("");
        await fetchData();
      } else {
        toast("error", data.error ?? "Action failed");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setActingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-section-gap">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-surface-pure rounded-xl p-6 border border-border-light animate-pulse h-40" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          <div className="lg:col-span-2 bg-surface-pure rounded-xl p-6 border border-border-light animate-pulse h-96" />
          <div className="bg-surface-pure rounded-xl p-6 border border-border-light animate-pulse h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-section-gap">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
        <div>
          <h1 className="font-headline text-headline-lg-mobile md:text-headline-xl text-primary tracking-tight mb-2">
            Welcome back, Admin
          </h1>
          <p className="text-body-lg text-secondary">Here&apos;s what&apos;s happening across your organization today.</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-secondary hover:text-primary transition-colors bg-surface-container-low rounded-full">
            <Icon name="notifications" className="text-[22px]" />
          </button>
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-on-primary font-bold text-sm font-headline">A</span>
          </div>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <StatCard value={employees.length} label="Total Employees" icon="group" trend={{ value: `${employees.length} active`, tone: "default" }} />
        <StatCard value={presentToday} label="Active Now" icon="how_to_reg" trend={{ value: `${presentPercent}% present`, tone: "default" }} />
        <Link href="/admin/leave">
          <span className="block">
            <StatCard value={pendingLeaves.length} label="Pending Leaves" icon="date_range" trend={{ value: pendingLeaves.length > 0 ? "Action needed" : "All clear", tone: pendingLeaves.length > 0 ? "error" : "default" }} />
          </span>
        </Link>
        <StatCard value={onLeaveToday} label="On Leave Today" icon="payments" trend={{ value: "Today", tone: "default" }} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 bg-surface-pure rounded-xl p-container-padding ambient-shadow border border-surface-variant flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-headline-md text-primary">Pending Leave Requests</h2>
            <Link href="/admin/leave" className="text-primary text-label-md hover:underline uppercase">View All</Link>
          </div>

          {pendingLeaves.length === 0 ? (
            <EmptyState icon="event_available" title="All caught up" description="No leave requests waiting for your approval." />
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              {pendingLeaves.slice(0, 4).map((leave) => {
                const emp = leave.employee;
                const name = emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
                const isConfirming = confirming?.id === leave.id;
                const days = Math.floor((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / 86_400_000) + 1;
                return (
                  <div key={leave.id} className="flex flex-col md:flex-row justify-between gap-stack-md pb-6 border-b border-border-light last:border-0 last:pb-0">
                    <div className="flex gap-4 items-start">
                      <Avatar src={emp?.profilePicture} name={name} size="md" />
                      <div>
                        <h3 className="font-headline text-body-lg text-primary">{name}</h3>
                        <p className="text-body-sm text-secondary">{emp?.designation || ""} &bull; {emp?.department || ""}</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1 rounded-xl text-label-md uppercase tracking-wider">
                            <Icon name={typeIcons[leave.type] ?? "date_range"} className="text-[14px]" />
                            {typeLabels[leave.type] ?? leave.type}
                          </span>
                          <span className="inline-flex items-center gap-1 text-on-surface-variant text-body-sm">
                            <Icon name="calendar_today" className="text-[16px] text-outline" />
                            {fmtDate(leave.startDate)} - {fmtDate(leave.endDate)} ({days} Days)
                          </span>
                        </div>
                        {leave.remarks && (
                          <div className="mt-3 bg-surface-container-low p-3 rounded-lg border border-border-light">
                            <p className="text-body-sm text-on-surface-variant italic">&ldquo;{leave.remarks}&rdquo;</p>
                          </div>
                        )}
                        {isConfirming && (
                          <div className="mt-3 bg-surface-container-low border border-outline-variant rounded-lg p-3 space-y-3">
                            <input
                              type="text"
                              placeholder="Add a comment (optional)"
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              className="w-full bg-surface-pure border border-border-light px-3 py-2 rounded text-body-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                            />
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Cancel</Button>
                              <Button size="sm" loading={actingId === leave.id} onClick={handleConfirm}>
                                {confirming?.action === "APPROVED" ? "Approve" : "Reject"}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {!isConfirming && (
                      <div className="flex md:flex-col gap-3 justify-end md:min-w-[120px]">
                        <button
                          onClick={() => { setConfirming({ id: leave.id, action: "APPROVED" }); setComment(""); }}
                          className="flex-1 md:flex-none bg-primary text-on-primary rounded-lg py-2 px-4 text-label-md uppercase hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => { setConfirming({ id: leave.id, action: "REJECTED" }); setComment(""); }}
                          className="flex-1 md:flex-none bg-transparent border border-outline text-secondary rounded-lg py-2 px-4 text-label-md uppercase hover:bg-error-container hover:text-on-error-container hover:border-error-container transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-surface-pure rounded-xl p-container-padding ambient-shadow border border-surface-variant flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-headline text-headline-md text-primary">Team Snapshot</h2>
            <Link href="/admin/employees" className="text-primary text-label-md hover:underline uppercase">View All</Link>
          </div>
          <div className="flex-1 flex flex-col gap-4">
            {employees.slice(0, 5).map((emp) => {
              const name = `${emp.firstName} ${emp.lastName}`;
              const isOnLeave = todayAttendance.some(
                (a) => a.status === "LEAVE" && (a as unknown as { employee?: { id?: string } }).employee?.id === emp.id
              );
              return (
                <div
                  key={emp.id}
                  onClick={() => router.push(`/admin/employees?id=${emp.user?.employeeId ?? ""}`)}
                  className="flex items-center gap-3 cursor-pointer hover:bg-surface-container-low rounded-lg p-2 -mx-2 transition-colors"
                >
                  <Avatar src={emp.profilePicture} name={name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-semibold text-primary truncate">{name}</p>
                    <p className="text-label-md text-secondary uppercase">{emp.department || "—"}</p>
                  </div>
                  <StatusBadge status={isOnLeave ? "ON_LEAVE" : "ACTIVE"} />
                </div>
              );
            })}
            {employees.length === 0 && (
              <EmptyState icon="group" title="No employees yet" description="Add your first team member to get started." />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
