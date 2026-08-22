"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

type LeaveItem = {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  remarks?: string;
  adminComments?: string;
  employee?: {
    firstName: string;
    lastName: string;
    user?: { employeeId: string };
  };
};

const tabs = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const;

export default function AdminLeavePage() {
  const [leaves, setLeaves] = useState<LeaveItem[]>([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionType, setActionType] = useState<"APPROVED" | "REJECTED">("APPROVED");
  const [selectedLeave, setSelectedLeave] = useState<LeaveItem | null>(null);
  const [adminComments, setAdminComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async (status?: string) => {
    setLoading(true);
    const url = status && status !== "ALL" ? `/api/leave?status=${status}` : "/api/leave";
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setLeaves(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaves(activeTab);
  }, [activeTab]);

  const openModal = (leave: LeaveItem, type: "APPROVED" | "REJECTED") => {
    setSelectedLeave(leave);
    setActionType(type);
    setAdminComments("");
    setModalOpen(true);
  };

  const handleAction = async () => {
    if (!selectedLeave) return;
    setSubmitting(true);
    await fetch("/api/leave", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedLeave.id, status: actionType, adminComments }),
    });
    setModalOpen(false);
    fetchLeaves(activeTab);
    setSubmitting(false);
  };

  const statusVariant = (s: string): "success" | "danger" | "warning" => {
    if (s === "APPROVED") return "success";
    if (s === "REJECTED") return "danger";
    return "warning";
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Leave Management</h1>

      <div className="flex gap-2">
        {tabs.map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? "primary" : "secondary"}
            size="sm"
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </Button>
        ))}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-3 px-4 font-medium text-surface-600">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Type</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Start</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">End</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Remarks</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-surface-400">Loading...</td></tr>
              ) : leaves.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-surface-400">No leave requests found.</td></tr>
              ) : (
                leaves.map((leave) => (
                  <tr key={leave.id} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 font-medium">
                      {leave.employee?.firstName} {leave.employee?.lastName}
                    </td>
                    <td className="py-3 px-4"><Badge>{leave.type}</Badge></td>
                    <td className="py-3 px-4">{new Date(leave.startDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">{new Date(leave.endDate).toLocaleDateString()}</td>
                    <td className="py-3 px-4">
                      <Badge variant={statusVariant(leave.status)}>{leave.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-surface-500 max-w-[200px] truncate">{leave.remarks || "-"}</td>
                    <td className="py-3 px-4">
                      {leave.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button size="sm" onClick={() => openModal(leave, "APPROVED")}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => openModal(leave, "REJECTED")}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={actionType === "APPROVED" ? "Approve Leave" : "Reject Leave"}>
        <div className="space-y-4">
          <p className="text-sm text-surface-600">
            {actionType === "APPROVED" ? "Approve" : "Reject"} leave for{" "}
            <span className="font-medium">{selectedLeave?.employee?.firstName} {selectedLeave?.employee?.lastName}</span>?
          </p>
          <textarea
            className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            placeholder="Add admin comments (optional)"
            value={adminComments}
            onChange={(e) => setAdminComments(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button
              variant={actionType === "APPROVED" ? "primary" : "danger"}
              onClick={handleAction}
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
