"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AdminDashboardPage() {
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [attendance, setAttendance] = useState<Record<string, unknown>[]>([]);
  const [leaves, setLeaves] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/employees").then((r) => r.json()),
      fetch("/api/attendance").then((r) => r.json()),
      fetch("/api/leave").then((r) => r.json()),
    ]).then(([empData, attData, leaveData]) => {
      if (empData.success) setEmployees(Array.isArray(empData.data) ? empData.data : []);
      if (attData.success) setAttendance(Array.isArray(attData.data) ? attData.data : []);
      if (leaveData.success) setLeaves(Array.isArray(leaveData.data) ? leaveData.data : []);
    });
  }, []);

  const pendingLeaves = leaves.filter((l: Record<string, unknown>) => l.status === "PENDING");
  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = attendance.filter((a: Record<string, unknown>) => {
    const d = new Date(a.date as string);
    return d.toISOString().split("T")[0] === today;
  });
  const presentToday = todayAttendance.filter((a: Record<string, unknown>) => a.status === "PRESENT").length;

  const handleLeaveAction = async (id: string, status: string, adminComments: string) => {
    await fetch("/api/leave", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminComments }),
    });
    setLeaves((prev) =>
      prev.map((l: Record<string, unknown>) =>
        l.id === id ? { ...l, status, adminComments } : l
      )
    );
  };

  const stats = [
    { label: "Total Employees", value: employees.length, color: "text-primary-600" },
    { label: "Present Today", value: presentToday, color: "text-accent-600" },
    { label: "Pending Leaves", value: pendingLeaves.length, color: "text-amber-600" },
    { label: "Total Attendance", value: attendance.length, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-surface-500 mt-1">{stat.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Employees</h2>
          <div className="space-y-2">
            {employees.slice(0, 5).map((emp: Record<string, unknown>, i: number) => {
              const user = emp.user as Record<string, unknown> | undefined;
              return (
                <div key={i} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-surface-900">
                      {emp.firstName as string} {emp.lastName as string}
                    </div>
                    <div className="text-xs text-surface-500">{emp.department as string}</div>
                  </div>
                  <span className="text-xs text-surface-400">{user?.employeeId as string}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-surface-900 mb-4">Pending Leave Requests</h2>
          {pendingLeaves.length === 0 ? (
            <p className="text-surface-400 text-sm">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.slice(0, 5).map((leave: Record<string, unknown>, i: number) => {
                const emp = leave.employee as Record<string, unknown> | undefined;
                return (
                  <div key={i} className="border border-surface-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-surface-900">
                        {emp?.firstName as string} {emp?.lastName as string}
                      </span>
                      <Badge variant="warning">{leave.type as string}</Badge>
                    </div>
                    <div className="text-xs text-surface-500 mb-2">
                      {new Date(leave.startDate as string).toLocaleDateString()} - {new Date(leave.endDate as string).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleLeaveAction(leave.id as string, "APPROVED", "Approved")}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleLeaveAction(leave.id as string, "REJECTED", "Rejected")}>
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
