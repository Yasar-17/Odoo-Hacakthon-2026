"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatCard from "@/components/ui/StatCard";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
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

const PAGE_SIZE = 10;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [page, setPage] = useState(0);

  // Inline confirmation state: which leave is being actioned + comment
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[],
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`.toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase());
      const matchesDept = deptFilter === "ALL" || e.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, search, deptFilter]);

  useEffect(() => setPage(0), [search, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  const paged = filteredEmployees.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const presentToday = todayAttendance.filter((a) => a.status === "PRESENT").length;
  const onLeaveToday = todayAttendance.filter((a) => a.status === "LEAVE").length;
  const presentPercent =
    employees.length > 0 ? Math.round((presentToday / employees.length) * 100) : 0;

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
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-surface-200 p-5 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-surface-200 mb-4" />
              <div className="h-7 bg-surface-200 rounded w-16 mb-2" />
              <div className="h-3 bg-surface-100 rounded w-24" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-xl border border-surface-200 p-5 animate-pulse h-96" />
          <div className="bg-white rounded-xl border border-surface-200 p-5 animate-pulse h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          value={employees.length}
          label="Total Employees"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 7.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          value={presentToday}
          label={`${presentPercent}% of team`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <Link href="/admin/leave">
          <span className="block">
            <StatCard
              value={pendingLeaves.length}
              label="Pending Leave Requests →"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </span>
        </Link>
        <StatCard
          value={onLeaveToday}
          label="On Leave Today"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h6.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
          }
        />
      </div>

      {/* Main two-column section */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Employee table (~65%) */}
        <div className="xl:col-span-3 bg-white rounded-xl border border-surface-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-surface-200 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900"
              />
            </div>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-surface-900"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Name</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Department</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-sm text-surface-500">No employees found</td>
                  </tr>
                ) : (
                  paged.map((emp) => {
                    const name = `${emp.firstName} ${emp.lastName}`;
                    const isOnLeave = todayAttendance.some(
                      (a) =>
                        a.status === "LEAVE" &&
                        (a as unknown as { employee?: { id?: string } }).employee?.id === emp.id
                    );
                    return (
                      <tr
                        key={emp.id}
                        onClick={() => router.push(`/admin/employees?id=${emp.user?.employeeId ?? ""}`)}
                        className="border-b border-surface-100 last:border-0 hover:bg-surface-50 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar src={emp.profilePicture} name={name} size="sm" />
                            <div>
                              <p className="font-medium text-surface-900">{name}</p>
                              <p className="text-xs text-surface-400 font-mono">{emp.user?.employeeId}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-surface-600">{emp.department || "—"}</td>
                        <td className="px-5 py-3.5 text-surface-600">{emp.designation || "—"}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={isOnLeave ? "ON_LEAVE" : "ACTIVE"} /></td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/admin/employees?id=${emp.user?.employeeId ?? ""}`);
                            }}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-surface-200">
              <span className="text-xs text-surface-400">
                Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filteredEmployees.length)} of{" "}
                {filteredEmployees.length}
              </span>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Pending approvals panel (~35%) */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-surface-200 self-start">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-200">
            <h2 className="text-base font-semibold text-surface-900">Pending Approvals</h2>
            {pendingLeaves.length > 0 && (
              <span className="min-w-[22px] h-[22px] px-1.5 inline-flex items-center justify-center rounded-full bg-warning-light text-warning-text text-xs font-semibold font-mono">
                {pendingLeaves.length}
              </span>
            )}
          </div>

          {pendingLeaves.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="All caught up"
              description="No leave requests waiting for your approval."
            />
          ) : (
            <ul className="divide-y divide-surface-100">
              {pendingLeaves.map((leave) => {
                const emp = leave.employee;
                const name = emp ? `${emp.firstName} ${emp.lastName}` : "Unknown";
                const isConfirming = confirming?.id === leave.id;
                return (
                  <li key={leave.id} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Avatar src={emp?.profilePicture} name={name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{name}</p>
                        <p className="text-xs text-surface-500 mt-0.5">
                          {leave.type.charAt(0) + leave.type.slice(1).toLowerCase()} ·{" "}
                          {fmtDate(leave.startDate)} – {fmtDate(leave.endDate)}
                        </p>
                      </div>

                      {!isConfirming && (
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={() => { setConfirming({ id: leave.id, action: "APPROVED" }); setComment(""); }}
                            title="Approve"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-success-light text-success-text hover:brightness-95 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => { setConfirming({ id: leave.id, action: "REJECTED" }); setComment(""); }}
                            title="Reject"
                            className="w-8 h-8 inline-flex items-center justify-center rounded-lg bg-danger-light text-danger-text hover:brightness-95 transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {isConfirming && (
                      <div className="mt-3 bg-surface-50 border border-surface-200 rounded-lg p-3 space-y-3">
                        <p className="text-xs font-medium text-surface-600">
                          Confirm {confirming.action === "APPROVED" ? "approval" : "rejection"}?
                        </p>
                        <input
                          type="text"
                          placeholder="Add a comment (optional)"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            loading={actingId === leave.id}
                            onClick={handleConfirm}
                            className={
                              confirming.action === "APPROVED"
                                ? "!bg-success hover:!brightness-95"
                                : ""
                            }
                          >
                            {confirming.action === "APPROVED" ? "Approve" : "Reject"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
