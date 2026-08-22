"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface LeaveRecord {
  id: string; type: "PAID" | "SICK" | "UNPAID"; startDate: string; endDate: string;
  remarks: string | null; status: "PENDING" | "APPROVED" | "REJECTED"; createdAt: string;
}

type LeaveType = "PAID" | "SICK";
type Filter = "ALL" | LeaveRecord["status"];

const BALANCES: Record<LeaveType, number> = { PAID: 12, SICK: 8 };
const typeMeta: Record<LeaveType, { label: string; icon: string }> = {
  PAID: { label: "Paid", icon: "beach_access" },
  SICK: { label: "Sick", icon: "sick" },
};

function daysBetween(s: string, e: string) { return Math.floor((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000) + 1; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function LeavePage() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [showApply, setShowApply] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState<{ type: LeaveType; startDate: string; endDate: string; remarks: string }>({ type: "PAID", startDate: "", endDate: "", remarks: "" });

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/leave"); const data = await res.json(); if (data.success) setLeaves(data.data ?? []); }
    catch { setLeaves([]); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchLeaves();
    if (typeof window !== "undefined" && window.location.search.includes("apply=1")) setShowApply(true);
  }, [fetchLeaves]);

  const usedDays = useMemo(() => {
    const used: Record<LeaveType, number> = { PAID: 0, SICK: 0 };
    leaves.forEach((l) => {
      if ((l.status === "APPROVED" || l.status === "PENDING") && (l.type === "PAID" || l.type === "SICK")) {
        used[l.type] += daysBetween(l.startDate, l.endDate);
      }
    });
    return used;
  }, [leaves]);

  const filtered = useMemo(() => {
    const list = filter === "ALL" ? leaves : leaves.filter((l) => l.status === filter);
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaves, filter]);

  const canSubmit = !!form.startDate && !!form.endDate && daysBetween(form.startDate, form.endDate) > 0;

  const handleSubmit = async () => {
    if (!canSubmit) { setFormError("End date cannot be before start date"); return; }
    setFormError(""); setSubmitting(true);
    try {
      const res = await fetch("/api/leave", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setShowApply(false); toast("success", "Leave request submitted"); setForm({ type: "PAID", startDate: "", endDate: "", remarks: "" }); await fetchLeaves(); }
      else { setFormError(data.error ?? "Failed to submit request"); }
    } catch { setFormError("Something went wrong"); }
    setSubmitting(false);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "All" }, { key: "PENDING", label: "Pending" },
    { key: "APPROVED", label: "Approved" }, { key: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="flex flex-col gap-gutter">
      <PageHeader title="Leave Requests" subtitle="Apply for time off and track your leave history.">
        <Button arrow onClick={() => setShowApply(true)}>Apply for Leave</Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
        {(Object.keys(typeMeta) as LeaveType[]).map((type) => (
          <div key={type} className="bg-surface-pure rounded-xl p-6 ambient-shadow border border-surface-variant">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-label-md text-secondary uppercase mb-1">{typeMeta[type].label} Leave</p>
                <p className="font-headline text-headline-lg text-primary">
                  {Math.max(0, BALANCES[type] - usedDays[type])}
                  <span className="text-body-sm text-secondary ml-2">days left</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-secondary-container rounded-lg text-on-secondary-container flex items-center justify-center">
                <Icon name={typeMeta[type].icon} filled className="text-[24px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-surface-pure rounded-xl border border-border-light overflow-hidden">
        <div className="px-container-padding py-3 border-b border-border-light flex items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 text-label-md uppercase tracking-wider rounded-lg transition-colors ${filter === f.key ? "bg-primary text-on-primary" : "bg-surface-container-low text-secondary hover:bg-surface-container-high"}`}>
                {f.label}
              </button>
            ))}
          </div>
          <span className="text-label-md text-secondary uppercase hidden sm:block">Newest first</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-body-sm text-secondary animate-pulse">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon="date_range" title={`No ${filter === "ALL" ? "" : filter.toLowerCase() + " "}leave requests`} description="Leave requests you submit will be tracked here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-light bg-surface-subtle">
                  {["Type", "Start Date", "End Date", "Days", "Status", "Remarks"].map((h, i) => (
                    <th key={i} className="py-4 px-6 text-label-md text-secondary uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light text-body-md">
                {filtered.map((leave) => (
                  <tr key={leave.id} className="hover:bg-surface-container transition-colors">
                    <td className="py-4 px-6 font-semibold text-primary">{typeMeta[leave.type as LeaveType]?.label ?? leave.type}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{fmtDate(leave.startDate)}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{fmtDate(leave.endDate)}</td>
                    <td className="py-4 px-6 font-semibold text-primary">{daysBetween(leave.startDate, leave.endDate)}</td>
                    <td className="py-4 px-6"><StatusBadge status={leave.status} /></td>
                    <td className="py-4 px-6 text-secondary max-w-[220px] truncate">{leave.remarks || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showApply} onClose={() => setShowApply(false)} title="Apply for Leave"
        footer={<><Button variant="ghost" onClick={() => setShowApply(false)}>Cancel</Button><Button arrow onClick={handleSubmit} loading={submitting} disabled={!canSubmit}>Submit Request</Button></>}>
        <div className="space-y-4">
          {formError && <div className="bg-error-container text-on-error-container text-sm rounded px-4 py-3">{formError}</div>}
          <Select label="Leave Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as LeaveType })}>
            <option value="PAID">Paid</option>
            <option value="SICK">Sick</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" label="Start Date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <Input type="date" label="End Date" value={form.endDate} min={form.startDate || undefined} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <div>
            <label className="block text-label-md uppercase tracking-wider text-secondary mb-2">Remarks</label>
            <textarea rows={3} placeholder="Add a reason (optional)" value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              className="w-full bg-surface-pure border border-border-light px-4 py-3 rounded font-body-md text-body-md text-primary resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
