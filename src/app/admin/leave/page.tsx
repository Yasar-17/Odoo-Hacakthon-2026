"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface LeaveRecord {
  id: string; type: "PAID" | "SICK" | "UNPAID";
  startDate: string; endDate: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  remarks: string | null; adminComments: string | null; createdAt: string;
  employee?: { firstName: string; lastName: string; department?: string | null; profilePicture?: string | null; user?: { employeeId: string } };
}

type Filter = "ALL" | LeaveRecord["status"];
const typeLabels: Record<string, string> = { PAID: "Paid Time Off", SICK: "Sick Leave" };
const typeIcons: Record<string, string> = { PAID: "beach_access", SICK: "sick" };

function daysBetween(s: string, e: string) { return Math.floor((new Date(e).getTime() - new Date(s).getTime()) / 86_400_000) + 1; }
function fmtDate(iso: string) { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

export default function AdminLeavePage() {
  const { toast } = useToast();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [selectedLeave, setSelectedLeave] = useState<LeaveRecord | null>(null);
  const [adminComment, setAdminComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/leave"); const data = await res.json(); if (data.success) setLeaves(data.data ?? []); }
    catch { setLeaves([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchLeaves(); }, [fetchLeaves]);

  const filtered = useMemo(() => {
    let list = leaves.filter((l) => {
      const matchesStatus = filter === "ALL" || l.status === filter;
      const name = `${l.employee?.firstName ?? ""} ${l.employee?.lastName ?? ""}`.toLowerCase();
      return matchesStatus && (search === "" || name.includes(search.toLowerCase()));
    });
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [leaves, filter, search]);

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter((l) => l.status === "REJECTED").length;
  const processed = leaves.filter((l) => l.status !== "PENDING").slice(0, 5);

  const openAction = (leave: LeaveRecord, type: "APPROVED" | "REJECTED") => {
    setSelectedLeave(leave); setActionType(type); setAdminComment(""); setShowModal(true);
  };

  const handleConfirm = async () => {
    if (!selectedLeave) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/leave", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: selectedLeave.id, status: actionType, adminComments: adminComment }) });
      const data = await res.json();
      if (data.success) { toast("success", `Leave ${actionType.toLowerCase()}`); setShowModal(false); fetchLeaves(); }
      else { toast("error", data.error ?? "Action failed"); }
    } catch { toast("error", "Something went wrong"); }
    setSubmitting(false);
  };

  const filters: { key: Filter; label: string }[] = [
    { key: "PENDING", label: "Pending" }, { key: "APPROVED", label: "Approved" },
    { key: "REJECTED", label: "Rejected" }, { key: "ALL", label: "All" },
  ];

  const pct = (n: number) => leaves.length > 0 ? (n / leaves.length) * 100 : 0;

  return (
    <div className="flex flex-col gap-gutter">
      <PageHeader title="Leave Approval" subtitle="Review and manage employee time-off requests.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="w-full md:w-64" />
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <div className="lg:col-span-8 flex flex-col gap-stack-md">
          <h2 className="font-headline text-headline-md text-primary flex items-center gap-2">
            {filter === "ALL" ? "All Requests" : filter.charAt(0) + filter.slice(1).toLowerCase() + " Requests"}
            {pendingCount > 0 && filter === "PENDING" && <span className="bg-error-container text-on-error-container text-xs font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>}
          </h2>

          <div className="flex gap-2 flex-wrap">
            {filters.map((f) => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`px-4 py-2 text-label-md uppercase tracking-wider rounded-lg transition-colors ${filter === f.key ? "bg-primary text-on-primary" : "bg-surface-container-low text-secondary hover:bg-surface-container-high"}`}>
                {f.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-surface-pure rounded-xl border border-border-light p-6 animate-pulse h-40" />
          ) : filtered.length === 0 ? (
            <div className="bg-surface-pure rounded-xl border border-border-light">
              <EmptyState icon="event_available" title={`No ${filter === "ALL" ? "" : filter.toLowerCase() + " "}leave requests`} description="When employees submit leave requests, they'll appear here for approval." />
            </div>
          ) : (
            <div className="flex flex-col gap-stack-md">
              {filtered.map((leave) => {
                const empName = `${leave.employee?.firstName ?? ""} ${leave.employee?.lastName ?? ""}`;
                const days = daysBetween(leave.startDate, leave.endDate);
                return (
                  <div key={leave.id} className="bg-surface-pure rounded-xl p-container-padding ambient-shadow ambient-shadow-hover border border-transparent hover:border-outline-variant transition-all relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${leave.status === "PENDING" ? "bg-secondary-fixed" : leave.status === "APPROVED" ? "bg-success" : "bg-error"}`} />
                    <div className="flex flex-col md:flex-row justify-between gap-stack-md">
                      <div className="flex gap-4 items-start">
                        <Avatar src={leave.employee?.profilePicture} name={empName} size="md" />
                        <div>
                          <h3 className="font-headline text-body-lg text-primary">{empName}</h3>
                          <p className="text-body-sm text-secondary">{leave.employee?.department || ""}</p>
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
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-3 justify-end md:min-w-[120px]">
                        {leave.status === "PENDING" ? (
                          <>
                            <button onClick={() => openAction(leave, "APPROVED")} className="flex-1 md:flex-none bg-primary text-on-primary rounded-lg py-2 px-4 text-label-md uppercase hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm">Approve</button>
                            <button onClick={() => openAction(leave, "REJECTED")} className="flex-1 md:flex-none bg-transparent border border-outline text-secondary rounded-lg py-2 px-4 text-label-md uppercase hover:bg-error-container hover:text-on-error-container hover:border-error-container transition-colors">Reject</button>
                          </>
                        ) : <StatusBadge status={leave.status} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-stack-md">
          <div className="bg-surface-pure rounded-xl p-6 ambient-shadow border border-surface-variant">
            <h3 className="font-headline text-body-lg text-primary mb-4">Leave Statistics</h3>
            <div className="space-y-4">
              {[
                { label: "Pending", count: pendingCount, color: "bg-warning" },
                { label: "Approved", count: approvedCount, color: "bg-success" },
                { label: "Rejected", count: rejectedCount, color: "bg-error" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="flex justify-between text-body-sm mb-1">
                    <span className="text-on-surface">{s.label}</span>
                    <span className="font-bold text-primary">{s.count}</span>
                  </div>
                  <div className="w-full bg-surface-container-high rounded-full h-2">
                    <div className={`${s.color} h-2 rounded-full transition-all`} style={{ width: `${pct(s.count)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface-container-low rounded-xl p-6 border border-border-light">
            <h3 className="font-headline text-body-lg text-primary mb-4 flex items-center gap-2">
              <Icon name="history" className="text-[20px]" /> Recently Processed
            </h3>
            <div className="flex flex-col gap-4 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-px bg-outline-variant opacity-50" />
              {processed.map((leave) => (
                <div key={leave.id} className="flex gap-3 relative z-10">
                  <div className={`w-6 h-6 rounded-full bg-surface border-2 ${leave.status === "APPROVED" ? "border-success" : "border-error"} flex items-center justify-center shrink-0 mt-0.5`}>
                    <span className="material-symbols-outlined text-[12px]" style={{ color: leave.status === "APPROVED" ? "#16a34a" : "#dc2626" }}>{leave.status === "APPROVED" ? "check" : "close"}</span>
                  </div>
                  <div>
                    <p className="text-body-sm text-on-surface"><span className="font-bold">{leave.employee?.firstName} {leave.employee?.lastName}</span></p>
                    <p className="text-label-md text-secondary mt-0.5 uppercase">{leave.status === "APPROVED" ? "Approved" : "Rejected"}</p>
                  </div>
                </div>
              ))}
              {processed.length === 0 && <p className="text-body-sm text-secondary">No processed requests yet.</p>}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={actionType === "APPROVED" ? "Approve Leave" : "Reject Leave"}
        footer={<><button onClick={() => setShowModal(false)} className="px-4 py-2 text-label-md uppercase text-secondary hover:text-primary transition-colors">Cancel</button><button onClick={handleConfirm} disabled={submitting} className={`px-4 py-2 text-label-md uppercase rounded-lg text-on-primary transition-colors ${actionType === "APPROVED" ? "bg-primary hover:bg-primary-container" : "bg-error hover:brightness-95"}`}>{actionType === "APPROVED" ? "Approve" : "Reject"}</button></>}>
        <div className="space-y-4">
          <p className="text-body-sm text-on-surface-variant">{actionType === "APPROVED" ? "Approve" : "Reject"} leave for <span className="font-bold text-primary">{selectedLeave?.employee?.firstName} {selectedLeave?.employee?.lastName}</span>?</p>
          <p className="text-label-md text-secondary uppercase">{selectedLeave && fmtDate(selectedLeave.startDate)} to {selectedLeave && fmtDate(selectedLeave.endDate)} ({selectedLeave ? daysBetween(selectedLeave.startDate, selectedLeave.endDate) : 0} days)</p>
          <textarea rows={3} placeholder="Add a comment (optional)" value={adminComment} onChange={(e) => setAdminComment(e.target.value)}
            className="w-full bg-surface-pure border border-border-light px-4 py-3 rounded font-body-md text-body-md text-primary resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>
      </Modal>
    </div>
  );
}
