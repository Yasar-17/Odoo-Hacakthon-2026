"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface LeaveRecord {
  id: string;
  type: "PAID" | "SICK" | "UNPAID";
  startDate: string;
  endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string | null;
  adminComments: string | null;
  createdAt: string;
  employee?: {
    firstName: string;
    lastName: string;
    department?: string | null;
    profilePicture?: string | null;
    user?: { employeeId: string };
  };
}

type Filter = "ALL" | LeaveRecord["status"];

const typeLabels: Record<LeaveRecord["type"], string> = { PAID: "Paid", SICK: "Sick", UNPAID: "Unpaid" };

function daysBetween(start: string, end: string) {
  return Math.floor((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminLeavePage() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const departments = useMemo(
    () => Array.from(new Set(leaves.map((l) => l.employee?.department).filter(Boolean))) as string[],
    [leaves],
  );

  const filtered = useMemo(() => {
    let list = leaves.filter((l) => {
      const matchesStatus = filter === "ALL" || l.status === filter;
      const matchesDept = deptFilter === "ALL" || l.employee?.department === deptFilter;
      const name = `${l.employee?.firstName ?? ""} ${l.employee?.lastName ?? ""}`.toLowerCase();
      const matchesSearch = search === "" || name.includes(search.toLowerCase());
      return matchesStatus && matchesDept && matchesSearch;
    });
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaves, filter, deptFilter, search]);

  const openAction = (leave: LeaveRecord, type: "APPROVED" | "REJECTED") => {
    setSelectedLeave(leave);
    setActionType(type);
    setAdminComment("");
    setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedLeave) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leave", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedLeave.id, status: actionType, adminComments: adminComment }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", `Leave ${actionType.toLowerCase()}`);
        setShowModal(false);
        fetchLeaves();
      } else {
        toast("error", data.error ?? "Action failed");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setSubmitting(false);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" },
    { key: "ALL", label: "All" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Leave Approvals</h1>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"
        >
          <option value="ALL">All Departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by employee name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-surface-400 animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-300 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-surface-400">
              No {filter === "ALL" ? "" : filter.toLowerCase() + " "}leave requests
              {deptFilter !== "ALL" ? ` in ${deptFilter}` : ""}
              {search ? ` matching "${search}"` : ""}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Employee</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Start Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">End Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Days</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Remarks</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((leave) => {
                  const empName = `${leave.employee?.firstName ?? ""} ${leave.employee?.lastName ?? ""}`;
                  return (
                    <tr key={leave.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={leave.employee?.profilePicture} name={empName} size="sm" />
                          <div>
                            <p className="font-medium text-surface-900">{empName}</p>
                            <p className="text-xs text-surface-400 font-mono">{leave.employee?.user?.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-surface-600">{typeLabels[leave.type]}</td>
                      <td className="px-5 py-3.5 font-mono text-surface-600">{fmtDate(leave.startDate)}</td>
                      <td className="px-5 py-3.5 font-mono text-surface-600">{fmtDate(leave.endDate)}</td>
                      <td className="px-5 py-3.5 font-mono text-surface-900">{daysBetween(leave.startDate, leave.endDate)}</td>
                      <td className="px-5 py-3.5 text-surface-500 max-w-[200px] truncate">{leave.remarks || "\u2014"}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={leave.status} /></td>
                      <td className="px-5 py-3.5 text-right">
                        {leave.status === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openAction(leave, "APPROVED")}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-success-text hover:bg-success-light transition-colors"
                              title="Approve"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => openAction(leave, "REJECTED")}
                              className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-danger-text hover:bg-danger-light transition-colors"
                              title="Reject"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <StatusBadge status={leave.status} />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={actionType === "APPROVED" ? "Approve Leave" : "Reject Leave"}>
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            {actionType === "APPROVED" ? "Approve" : "Reject"} leave for{" "}
            <span className="font-medium">{selectedLeave?.employee?.firstName} {selectedLeave?.employee?.lastName}</span>?
          </p>
          <p className="text-xs text-surface-400">
            {fmtDate(selectedLeave?.startDate ?? "")} to {fmtDate(selectedLeave?.endDate ?? "")} ({selectedLeave ? daysBetween(selectedLeave.startDate, selectedLeave.endDate) : 0} days)
          </p>
          <textarea
            rows={3}
            placeholder="Add a comment (optional)"
            value={adminComment}
            onChange={(e) => setAdminComment(e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              variant={actionType === "APPROVED" ? "primary" : "danger"}
              onClick={handleConfirm}
              loading={submitting}
            >
              {actionType === "APPROVED" ? "Approve" : "Reject"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
