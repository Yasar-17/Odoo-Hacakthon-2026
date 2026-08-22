"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface PayrollRecord {
  id: string; basicSalary: number; hra: number; allowances: number;
  deductions: number; netSalary: number; month: number; year: number; status: string;
  employee?: { firstName: string; lastName: string; department?: string | null; profilePicture?: string | null; user?: { employeeId: string } };
}

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AdminPayrollPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<PayrollRecord | null>(null);
  const [editForm, setEditForm] = useState({ basicSalary: 0, hra: 0, allowances: 0, deductions: 0 });
  const [saving, setSaving] = useState(false);
  const [showRun, setShowRun] = useState(false);
  const [running, setRunning] = useState(false);
  const [employees, setEmployees] = useState<Array<{ user?: { employeeId: string }; firstName: string; lastName: string; basicSalary?: number | null; deductions?: number | null }>>([]);
  const [runForm, setRunForm] = useState({ employeeId: "", month: "", grossSalary: "", totalDeductions: "", paymentStatus: "PAID" });
  const [runError, setRunError] = useState("");

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try { const res = await fetch("/api/payroll"); const data = await res.json(); if (data.success) setRecords(data.data ?? []); }
    catch { setRecords([]); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const name = `${r.employee?.firstName ?? ""} ${r.employee?.lastName ?? ""}`.toLowerCase();
      const eid = (r.employee?.user?.employeeId ?? "").toLowerCase();
      return search === "" || name.includes(search.toLowerCase()) || eid.includes(search.toLowerCase());
    });
  }, [records, search]);

  const totalGross = filtered.reduce((s, r) => s + r.basicSalary + r.hra + r.allowances, 0);
  const totalDeductions = filtered.reduce((s, r) => s + r.deductions, 0);
  const totalNet = filtered.reduce((s, r) => s + r.netSalary, 0);

  const openEdit = (record: PayrollRecord) => {
    setEditing(record);
    setEditForm({ basicSalary: record.basicSalary, hra: record.hra, allowances: record.allowances, deductions: record.deductions });
    setShowEdit(true);
  };

  const liveNet = editForm.basicSalary + editForm.hra + editForm.allowances - editForm.deductions;

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/payroll", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...editForm }) });
      const data = await res.json();
      if (data.success) { toast("success", "Payroll updated"); setShowEdit(false); fetchPayroll(); }
      else { toast("error", data.error ?? "Update failed"); }
    } catch { toast("error", "Something went wrong"); }
    setSaving(false);
  };

  const openRun = async () => {
    setShowRun(true);
    setRunError("");
    setRunForm((f) => ({ ...f, month: new Date().toISOString().slice(0, 7) }));
    if (employees.length === 0) {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) setEmployees(data.data);
      } catch {}
    }
  };

  const handleRunSubmit = async () => {
    if (!runForm.employeeId || !runForm.month || runForm.grossSalary === "") {
      setRunError("Employee, month and gross salary are required");
      return;
    }
    setRunError("");
    setRunning(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: runForm.employeeId,
          month: runForm.month,
          grossSalary: Number(runForm.grossSalary),
          totalDeductions: runForm.totalDeductions === "" ? 0 : Number(runForm.totalDeductions),
          paymentStatus: runForm.paymentStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Payroll record created");
        setShowRun(false);
        await fetchPayroll();
      } else {
        toast("error", data.error ?? "Failed to create payroll");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setRunning(false);
  };

  return (
    <div className="flex flex-col gap-gutter">
      <PageHeader title="Payroll Control" subtitle="Manage and process the current pay period.">
        <Button variant="secondary" onClick={() => toast("success", "Export coming soon")}>
          <Icon name="download" className="text-[18px]" /> Export
        </Button>
        <Button arrow onClick={openRun}>
          <Icon name="play_arrow" className="text-[18px]" /> Run Payroll
        </Button>
      </PageHeader>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <div className="bg-surface-pure p-8 border border-border-light rounded-lg flex flex-col justify-between">
          <div>
            <p className="text-label-md text-secondary uppercase mb-2">Total Gross Pay</p>
            <h2 className="font-headline text-headline-lg text-primary">{INR.format(totalGross)}</h2>
          </div>
          <div className="mt-6 flex items-center gap-2 text-surface-tint text-body-sm">
            <Icon name="trending_up" className="text-[16px]" /><span>Current cycle</span>
          </div>
        </div>
        <div className="bg-surface-pure p-8 border border-border-light rounded-lg flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-label-md text-secondary uppercase mb-2">Total Net Pay</p>
            <h2 className="font-headline text-headline-lg text-primary">{INR.format(totalNet)}</h2>
          </div>
          <div className="mt-6 flex items-center gap-2 text-surface-tint text-body-sm relative z-10">
            <Icon name="payments" className="text-[16px]" /><span>{filtered.length} employees</span>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none">
            <svg fill="none" height="120" viewBox="0 0 100 100" width="120" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="40" stroke="black" strokeWidth="8" />
              <circle cx="50" cy="50" r="20" stroke="black" strokeWidth="8" />
            </svg>
          </div>
        </div>
        <div className="bg-surface-pure p-8 border border-border-light rounded-lg flex flex-col justify-between">
          <div>
            <p className="text-label-md text-secondary uppercase mb-2">Taxes &amp; Deductions</p>
            <h2 className="font-headline text-headline-lg text-primary">{INR.format(totalDeductions)}</h2>
          </div>
          <div className="mt-6 flex items-center gap-2 text-surface-tint text-body-sm">
            <Icon name="account_balance" className="text-[16px]" /><span>Federal, State, Benefits</span>
          </div>
        </div>
      </section>

      <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="w-full md:w-96" />

      {loading ? (
        <div className="bg-surface-pure border border-border-light rounded-lg p-6 animate-pulse h-40" />
      ) : filtered.length === 0 ? (
        <div className="bg-surface-pure border border-border-light rounded-lg">
          <EmptyState icon="payments" title="No payroll records" description="Payroll entries will show up here once they're set up." />
        </div>
      ) : (
        <section className="bg-surface-pure border border-border-light rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-light bg-surface-subtle">
                {["Employee", "Department", "Base Salary", "Bonuses", "Deductions", "Net Pay", ""].map((h, i) => (
                  <th key={i} className={`py-4 px-6 text-label-md text-secondary uppercase tracking-wider ${i >= 2 && i <= 5 ? "text-right" : ""} ${i === 5 ? "text-primary font-bold" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-body-md">
              {filtered.map((record) => {
                const empName = `${record.employee?.firstName ?? ""} ${record.employee?.lastName ?? ""}`;
                return (
                  <tr key={record.id} className="hover:bg-surface-container transition-colors cursor-pointer" onClick={() => openEdit(record)}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Avatar src={record.employee?.profilePicture} name={empName} size="sm" />
                        <span className="font-semibold text-primary">{empName}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-on-surface-variant">{record.employee?.department || "—"}</td>
                    <td className="py-4 px-6 text-right">{INR.format(record.basicSalary)}</td>
                    <td className="py-4 px-6 text-right">{INR.format(record.allowances)}</td>
                    <td className="py-4 px-6 text-right text-secondary">-{INR.format(record.deductions)}</td>
                    <td className="py-4 px-6 text-right font-bold text-primary">{INR.format(record.netSalary)}</td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={(e) => { e.stopPropagation(); openEdit(record); }} className="text-outline hover:text-primary transition-colors">
                        <Icon name="edit" className="text-[20px]" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <Modal isOpen={showRun} onClose={() => setShowRun(false)} title="Run Payroll"
        footer={<><Button variant="ghost" onClick={() => setShowRun(false)}>Cancel</Button><Button arrow onClick={handleRunSubmit} loading={running}>Create Record</Button></>}>
        <div className="space-y-4">
          {runError && <div className="bg-error-container text-on-error-container text-sm rounded px-4 py-3">{runError}</div>}
          <Select label="Employee" value={runForm.employeeId} onChange={(e) => {
            const selected = employees.find((emp) => (emp.user?.employeeId ?? "") === e.target.value);
            setRunForm({
              ...runForm,
              employeeId: e.target.value,
              grossSalary: selected?.basicSalary != null ? String(selected.basicSalary) : "",
              totalDeductions: selected?.deductions != null ? String(selected.deductions) : "0",
            });
          }}>
            <option value="">Select employee…</option>
            {employees.map((emp) => {
              const id = emp.user?.employeeId ?? "";
              return <option key={id} value={id}>{`${emp.firstName} ${emp.lastName} (${id})`}</option>;
            })}
          </Select>
          <Input type="month" label="Payroll Month" value={runForm.month} onChange={(e) => setRunForm({ ...runForm, month: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Gross Salary" value={runForm.grossSalary} onChange={(e) => setRunForm({ ...runForm, grossSalary: e.target.value })} />
            <Input type="number" label="Total Deductions" value={runForm.totalDeductions} onChange={(e) => setRunForm({ ...runForm, totalDeductions: e.target.value })} />
          </div>
          <Select label="Payment Status" value={runForm.paymentStatus} onChange={(e) => setRunForm({ ...runForm, paymentStatus: e.target.value })}>
            <option value="PAID">Paid</option>
            <option value="PENDING">Pending</option>
          </Select>
        </div>
      </Modal>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title={`Edit Payroll — ${editing?.employee?.firstName} ${editing?.employee?.lastName}`}
        footer={<><Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button><Button arrow onClick={handleSave} loading={saving}>Save Changes</Button></>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input type="number" label="Base Pay" value={String(editForm.basicSalary)} onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) || 0 })} />
            <Input type="number" label="HRA" value={String(editForm.hra)} onChange={(e) => setEditForm({ ...editForm, hra: Number(e.target.value) || 0 })} />
            <Input type="number" label="Allowances" value={String(editForm.allowances)} onChange={(e) => setEditForm({ ...editForm, allowances: Number(e.target.value) || 0 })} />
            <Input type="number" label="Deductions" value={String(editForm.deductions)} onChange={(e) => setEditForm({ ...editForm, deductions: Number(e.target.value) || 0 })} />
          </div>
          <div className="bg-surface-container-low border border-border-light rounded-lg p-4 flex items-center justify-between">
            <span className="font-headline text-body-lg font-semibold text-primary">Net Pay</span>
            <span className="font-headline text-headline-md font-bold text-primary">{INR.format(liveNet)}</span>
          </div>
        </div>
      </Modal>
    </div>
  );
}
