"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface LeaveRecord {
  id: string;
  type: "PAID" | "SICK" | "UNPAID";
  startDate: string;
  endDate: string;
  remarks: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

type LeaveType = LeaveRecord["type"];
type Filter = "ALL" | LeaveRecord["status"];

const BALANCES: Record<LeaveType, number> = { PAID: 12, SICK: 8, UNPAID: 15 };

const typeMeta: Record<LeaveType, { label: string; accent: string; iconBg: string }> = {
  PAID:   { label: "Paid",   accent: "bg-success", iconBg: "bg-success-light text-success-text" },
  SICK:   { label: "Sick",   accent: "bg-warning", iconBg: "bg-warning-light text-warning-text" },
  UNPAID: { label: "Unpaid", accent: "bg-info",    iconBg: "bg-info-light text-info-text" },
};

function daysBetween(start: string, end: string) {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function LeavePage() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<{ type: LeaveType; startDate: string; endDate: string; remarks: string }>({
    type: "PAID",
    startDate: "",
    endDate: "",
    remarks: "",
  });

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/leave");
      const data = await res.json();
      if (data.success) setLeaves(data.data ?? []);
    } catch {
      setLeaves([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaves();
    // Open apply modal when arriving via "Apply for Leave" quick action on dashboard
    if (typeof window !== "undefined" && window.location.search.includes("apply=1")) {
      setShowApply(true);
    }
  }, [fetchLeaves]);

  const usedDays = useMemo(() => {
    const used: Record<LeaveType, number> = { PAID: 0, SICK: 0, UNPAID: 0 };
    leaves.forEach((l) => {
      if (l.status === "APPROVED" || l.status === "PENDING") {
        used[l.type] += daysBetween(l.startDate, l.endDate);
      }
    });
    return used;
  }, [leaves]);

  const filtered = useMemo(() => {
    const list = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaves, filter]);

  const canSubmit =
    !!form.startDate &&
    !!form.endDate &&
    daysBetween(form.startDate, form.endDate) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) {
      setFormError("End date cannot be before start date");
      return;
    }
    setFormError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setShowApply(false);
        toast("success", "Leave request submitted");
        setForm({ type: "PAID", startDate: "", endDate: "", remarks: "" });
        await fetchLeaves();
      } else {
        setFormError(data.error ?? "Failed to submit request");
      }
    } catch {
      setFormError("Something went wrong");
    }
    setSubmitting(false);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "All" },
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="space-y-6">
      {/* Balances + apply button */}
      <div>
        <div className="flex items-center justify-end mb-4">
          <Button onClick={() => setShowApply(true)}>Apply for Leave</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(typeMeta) as LeaveType[]).map((type) => (
            <div key={type} className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
              <div className={`h-1 ${typeMeta[type].accent}`} />
              <div className="p-5 flex items-start justify-between">
                <div>
                  <p className="text-sm text-surface-500">{typeMeta[type].label} Leave</p>
                  <p className="text-3xl font-bold font-mono text-surface-900 mt-1">
                    {Math.max(0, BALANCES[type] - usedDays[type])}
                    <span className="text-sm font-normal text-surface-400 ml-1.5">days left</span>
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeMeta[type].iconBg}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        {/* Filter row */}
        <div className="px-5 py-3 border-b border-surface-200 flex items-center justify-between gap-3">
          <div className="inline-flex bg-surface-200 rounded-lg p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  filter === f.key
                    ? "bg-white text-surface-900 shadow-sm"
                    : "text-surface-500 hover:text-surface-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-xs text-surface-400 hidden sm:block">Newest first</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-surface-400">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-300 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-surface-400">
              No {filter === "ALL" ? "" : filter.toLowerCase() + " "}leave requests
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Start Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">End Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Days</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((leave) => (
                  <tr key={leave.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-surface-900">{typeMeta[leave.type].label}</td>
                    <td className="px-5 py-3.5 text-surface-600">{fmtDate(leave.startDate)}</td>
                    <td className="px-5 py-3.5 text-surface-600">{fmtDate(leave.endDate)}</td>
                    <td className="px-5 py-3.5 font-mono text-surface-900">{daysBetween(leave.startDate, leave.endDate)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={leave.status} /></td>
                    <td className="px-5 py-3.5 text-surface-500 max-w-[220px] truncate">{leave.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply modal */}
      <Modal
        isOpen={showApply}
        onClose={() => setShowApply(false)}
        title="Apply for Leave"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowApply(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>
              Submit Request
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <div className="bg-danger-light border border-red-200 text-danger-text text-sm rounded-lg px-4 py-3">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Leave Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as LeaveType })}
              className="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
            >
              <option value="PAID">Paid</option>
              <option value="SICK">Sick</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 ${
                  form.endDate && form.startDate && daysBetween(form.startDate, form.endDate) <= 0
                    ? "border-danger"
                    : "border-surface-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.endDate}
                min={form.startDate || undefined}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 ${
                  form.endDate && form.startDate && daysBetween(form.startDate, form.endDate) <= 0
                    ? "border-danger"
                    : "border-surface-300"
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Remarks</label>
            <textarea
              rows={3}
              placeholder="Add a reason (optional)"
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
