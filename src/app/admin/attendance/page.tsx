"use client";

import { useCallback, useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface EmployeeOption {
  user?: { employeeId: string };
  firstName: string;
  lastName: string;
}

export default function AdminAttendancePage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(true);

  const [showMark, setShowMark] = useState(false);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [form, setForm] = useState({ employeeId: "", status: "PRESENT", checkIn: "", checkOut: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/attendance?date=${date}`);
      if (res.status === 401) { window.location.href = "/signin"; return; }
      const d = await res.json();
      if (d.success) setRecords(d.data || []);
    } catch {
      setRecords([]);
    }
    setLoading(false);
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openMark = async () => {
    setShowMark(true);
    setFormError("");
    if (employees.length === 0) {
      try {
        const res = await fetch("/api/employees");
        const d = await res.json();
        if (d.success && Array.isArray(d.data)) setEmployees(d.data);
      } catch {}
    }
  };

  const handleMarkSubmit = async () => {
    if (!form.employeeId) { setFormError("Select an employee"); return; }
    if (form.status === "PRESENT" || form.status === "HALF_DAY") {
      if ((form.checkIn && !form.checkOut) || (!form.checkIn && form.checkOut)) {
        setFormError("Provide both check-in and check-out times");
        return;
      }
    }
    setFormError("");
    setSaving(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          date,
          status: form.status,
          ...(form.checkIn ? { checkIn: form.checkIn } : {}),
          ...(form.checkOut ? { checkOut: form.checkOut } : {}),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Attendance saved");
        setShowMark(false);
        await fetchData();
      } else {
        toast("error", data.error ?? "Failed to save attendance");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setSaving(false);
  };

  const statusVariant = (s: string) => {
    if (s === "PRESENT") return "success" as const;
    if (s === "ABSENT") return "danger" as const;
    if (s === "HALF_DAY") return "warning" as const;
    return "info" as const;
  };

  return (
    <div className="flex flex-col gap-gutter">
      <PageHeader title="Attendance Records" subtitle="Monitor check-in and check-out activity across your team.">
        <div className="relative">
          <Icon name="calendar_today" className="absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none" />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-surface-pure border border-border-light rounded-lg text-body-sm text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
        </div>
        <Button arrow onClick={openMark}>
          <Icon name="edit_calendar" className="text-[18px]" /> Mark Attendance
        </Button>
      </PageHeader>

      {loading ? (
        <div className="bg-surface-pure border border-border-light rounded-lg p-6 animate-pulse h-40" />
      ) : records.length === 0 ? (
        <div className="bg-surface-pure border border-border-light rounded-lg">
          <EmptyState icon="event_available" title="No attendance records" description="Nobody has checked in for this date yet." />
        </div>
      ) : (
        <section className="bg-surface-pure border border-border-light rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-light bg-surface-subtle">
                {["Employee", "Date", "Check In", "Check Out", "Status"].map((h, i) => (
                  <th key={i} className="py-4 px-6 text-label-md text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-body-md">
              {records.map((rec, i) => {
                const emp = rec.employee as Record<string, unknown> | undefined;
                return (
                  <tr key={i} className="hover:bg-surface-container transition-colors">
                    <td className="py-4 px-6 font-semibold text-primary">{emp?.firstName as string} {emp?.lastName as string}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{new Date(rec.date as string).toLocaleDateString()}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{rec.checkIn ? new Date(rec.checkIn as string).toLocaleTimeString() : "—"}</td>
                    <td className="py-4 px-6 text-on-surface-variant">{rec.checkOut ? new Date(rec.checkOut as string).toLocaleTimeString() : "—"}</td>
                    <td className="py-4 px-6"><Badge variant={statusVariant(rec.status as string)}>{rec.status as string}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <Modal isOpen={showMark} onClose={() => setShowMark(false)} title={`Mark Attendance — ${date}`}
        footer={<><Button variant="ghost" onClick={() => setShowMark(false)}>Cancel</Button><Button arrow onClick={handleMarkSubmit} loading={saving}>Save</Button></>}>
        <div className="space-y-4">
          {formError && <div className="bg-error-container text-on-error-container text-sm rounded px-4 py-3">{formError}</div>}
          <Select label="Employee" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
            <option value="">Select employee…</option>
            {employees.map((emp) => {
              const id = emp.user?.employeeId ?? "";
              return <option key={id} value={id}>{`${emp.firstName} ${emp.lastName} (${id})`}</option>;
            })}
          </Select>
          <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="LEAVE">Leave</option>
          </Select>
          {(form.status === "PRESENT" || form.status === "HALF_DAY") && (
            <div className="grid grid-cols-2 gap-3">
              <Input type="time" label="Check In" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
              <Input type="time" label="Check Out" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
