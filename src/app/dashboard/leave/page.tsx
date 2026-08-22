"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";

export default function LeavePage() {
  const [leaves, setLeaves] = useState<Record<string, unknown>[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "PAID", startDate: "", endDate: "", remarks: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    const res = await fetch("/api/leave");
    const data = await res.json();
    if (data.success) setLeaves(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) return;
    setSubmitting(true);
    await fetch("/api/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ type: "PAID", startDate: "", endDate: "", remarks: "" });
    fetchLeaves();
    setSubmitting(false);
  };

  const statusVariant = (s: string) => {
    if (s === "APPROVED") return "success";
    if (s === "REJECTED") return "danger";
    return "warning";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Leave Requests</h1>
        <Button onClick={() => setShowForm(true)}>Apply for Leave</Button>
      </div>

      <Card>
        {loading ? (
          <div className="text-center py-8 text-surface-400">Loading...</div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-8 text-surface-400">No leave requests yet.</div>
        ) : (
          <div className="space-y-3">
            {leaves.map((leave, i) => (
              <div key={i} className="border border-surface-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant={leave.type === "PAID" ? "info" : leave.type === "SICK" ? "warning" : "default"}>
                      {leave.type as string}
                    </Badge>
                    <Badge variant={statusVariant(leave.status as string)}>
                      {leave.status as string}
                    </Badge>
                  </div>
                  <span className="text-xs text-surface-400">
                    {new Date(leave.createdAt as string).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm text-surface-600">
                  {new Date(leave.startDate as string).toLocaleDateString()} -{" "}
                  {new Date(leave.endDate as string).toLocaleDateString()}
                </div>
                {leave.remarks ? (
                  <p className="text-sm text-surface-500 mt-1">{String(leave.remarks)}</p>
                ) : null}
                {leave.adminComments ? (
                  <p className="text-sm text-surface-400 mt-1 italic">Admin: {String(leave.adminComments)}</p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Apply for Leave">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Leave Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="PAID">Paid Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>
          <Input
            label="Start Date"
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
          />
          <Input
            label="End Date"
            type="date"
            value={form.endDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
          />
          <Input
            label="Remarks"
            placeholder="Reason for leave"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} loading={submitting}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
