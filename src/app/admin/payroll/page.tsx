"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

type PayrollItem = {
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
    user?: { employeeId: string };
  };
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);

export default function AdminPayrollPage() {
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ basicSalary: 0, hra: 0, allowances: 0, deductions: 0 });
  const [saving, setSaving] = useState(false);

  const fetchPayrolls = async () => {
    setLoading(true);
    const res = await fetch("/api/payroll");
    const data = await res.json();
    if (data.success) setPayrolls(data.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPayrolls(); }, []);

  const startEdit = (p: PayrollItem) => {
    setEditingId(p.id);
    setEditData({ basicSalary: p.basicSalary, hra: p.hra, allowances: p.allowances, deductions: p.deductions });
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    const netSalary = editData.basicSalary + editData.hra + editData.allowances - editData.deductions;
    await fetch("/api/payroll", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editData, netSalary }),
    });
    setEditingId(null);
    fetchPayrolls();
    setSaving(false);
  };

  const updateField = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: Number(value) || 0 }));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Payroll Management</h1>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-3 px-4 font-medium text-surface-600">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Period</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Basic</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">HRA</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Allow.</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Ded.</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Net</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="py-8 text-center text-surface-400">Loading...</td></tr>
              ) : payrolls.length === 0 ? (
                <tr><td colSpan={9} className="py-8 text-center text-surface-400">No payroll records found.</td></tr>
              ) : (
                payrolls.map((p) => {
                  const isEditing = editingId === p.id;
                  return (
                    <tr key={p.id} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="py-3 px-4 font-medium">{p.employee?.firstName} {p.employee?.lastName}</td>
                      <td className="py-3 px-4">{new Date(0, p.month - 1).toLocaleString("en-US", { month: "short" })} {p.year}</td>
                      {(["basicSalary", "hra", "allowances", "deductions"] as const).map((field) => (
                        <td key={field} className="py-3 px-4">
                          {isEditing ? (
                            <input type="number" className="w-20 px-2 py-1 border border-surface-300 rounded text-sm" value={editData[field]} onChange={(e) => updateField(field, e.target.value)} />
                          ) : (
                            formatINR(p[field])
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-4 font-semibold">{isEditing ? formatINR(editData.basicSalary + editData.hra + editData.allowances - editData.deductions) : formatINR(p.netSalary)}</td>
                      <td className="py-3 px-4"><Badge variant={p.status === "PAID" ? "success" : "warning"}>{p.status}</Badge></td>
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Button size="sm" onClick={() => handleSave(p.id)} loading={saving}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="secondary" onClick={() => startEdit(p)}>Edit</Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
