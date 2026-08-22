"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import StatCard from "@/components/ui/StatCard";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface PayrollRecord {
  id: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  month: number;
  year: number;
  status: string;
  employee?: {
    firstName: string;
    lastName: string;
    department?: string | null;
    profilePicture?: string | null;
    user?: { employeeId: string };
  };
}

const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export default function AdminPayrollPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [showEdit, setShowEdit] = useState(false);
  const [editing, setEditing] = useState<PayrollRecord | null>(null);
  const [editForm, setEditForm] = useState({ basicSalary: 0, hra: 0, allowances: 0, deductions: 0 });
  const [saving, setSaving] = useState(false);

  const fetchPayroll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll");
      const data = await res.json();
      if (data.success) setRecords(data.data ?? []);
    } catch {
      setRecords([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);

  const departments = useMemo(
    () => Array.from(new Set(records.map((r) => r.employee?.department).filter(Boolean))) as string[],
    [records],
  );

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const name = `${r.employee?.firstName ?? ""} ${r.employee?.lastName ?? ""}`.toLowerCase();
      const eid = (r.employee?.user?.employeeId ?? "").toLowerCase();
      const matchesSearch = search === "" || name.includes(search.toLowerCase()) || eid.includes(search.toLowerCase());
      const matchesDept = deptFilter === "ALL" || r.employee?.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [records, search, deptFilter]);

  const totalPayroll = useMemo(() => filtered.reduce((sum, r) => sum + r.netSalary, 0), [filtered]);
  const avgSalary = filtered.length > 0 ? Math.round(totalPayroll / filtered.length) : 0;

  const openEdit = (record: PayrollRecord) => {
    setEditing(record);
    setEditForm({
      basicSalary: record.basicSalary,
      hra: record.hra,
      allowances: record.allowances,
      deductions: record.deductions,
    });
    setShowEdit(true);
  };

  const liveNet = editForm.basicSalary + editForm.hra + editForm.allowances - editForm.deductions;

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          basicSalary: editForm.basicSalary,
          hra: editForm.hra,
          allowances: editForm.allowances,
          deductions: editForm.deductions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Payroll updated");
        setShowEdit(false);
        fetchPayroll();
      } else {
        toast("error", data.error ?? "Update failed");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setSaving(false);
  };

  const handleExport = () => {
    toast("success", "Export coming soon");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">Payroll</h1>
        <Button variant="secondary" onClick={handleExport}>
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={<svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          iconBg="bg-primary-100"
          value={INR.format(totalPayroll)}
          label="Total Monthly Payroll"
        />
        <StatCard
          icon={<svg className="w-5 h-5 text-success-text" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          iconBg="bg-success-light"
          value={INR.format(avgSalary)}
          label="Average Salary"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative w-full sm:w-64">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
          />
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
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-surface-400 animate-pulse">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-300 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-sm text-surface-400">
              No payroll records
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
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Department</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Base Pay</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Allowances</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Deductions</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Net Pay</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record) => {
                  const empName = `${record.employee?.firstName ?? ""} ${record.employee?.lastName ?? ""}`;
                  return (
                    <tr key={record.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar src={record.employee?.profilePicture} name={empName} size="sm" />
                          <div>
                            <p className="font-medium text-surface-900">{empName}</p>
                            <p className="text-xs text-surface-400 font-mono">{record.employee?.user?.employeeId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-surface-600">{record.employee?.department || "\u2014"}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-surface-600">{INR.format(record.basicSalary)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-surface-600">{INR.format(record.allowances)}</td>
                      <td className="px-5 py-3.5 text-right font-mono text-danger-text">{INR.format(record.deductions)}</td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-surface-900">{INR.format(record.netSalary)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => openEdit(record)}
                          className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-surface-300 bg-surface-50 font-semibold">
                  <td colSpan={2} className="px-5 py-3 text-sm text-surface-700">Totals</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-surface-700">{INR.format(filtered.reduce((s, r) => s + r.basicSalary, 0))}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-surface-700">{INR.format(filtered.reduce((s, r) => s + r.allowances, 0))}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-danger-text">{INR.format(filtered.reduce((s, r) => s + r.deductions, 0))}</td>
                  <td className="px-5 py-3 text-right font-mono text-sm text-surface-900">{INR.format(totalPayroll)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title={`Edit Payroll \u2014 ${editing?.employee?.firstName} ${editing?.employee?.lastName}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">Base Pay</label>
              <input
                type="number"
                value={editForm.basicSalary}
                onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              />
            </div>
            <div>
              <label className="block text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">HRA</label>
              <input
                type="number"
                value={editForm.hra}
                onChange={(e) => setEditForm({ ...editForm, hra: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              />
            </div>
            <div>
              <label className="block text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">Allowances</label>
              <input
                type="number"
                value={editForm.allowances}
                onChange={(e) => setEditForm({ ...editForm, allowances: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              />
            </div>
            <div>
              <label className="block text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">Deductions</label>
              <input
                type="number"
                value={editForm.deductions}
                onChange={(e) => setEditForm({ ...editForm, deductions: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
              />
            </div>
          </div>
          <div className="bg-surface-50 border border-surface-200 rounded-lg p-4 flex items-center justify-between">
            <span className="font-semibold text-surface-900">Net Pay</span>
            <span className="text-lg font-bold font-mono text-success-text">{INR.format(liveNet)}</span>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
