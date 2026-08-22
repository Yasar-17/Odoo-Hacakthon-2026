"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetch("/api/payroll")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setPayroll(d.data || []);
      });
  }, []);

  const formatCurrency = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Payroll</h1>

      {payroll.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-surface-400">No payroll records found.</div>
        </Card>
      ) : (
        payroll.map((p, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-surface-900">
                {new Date(0, p.month as number - 1).toLocaleString("en-US", { month: "long" })} {p.year as number}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full ${p.status === "PAID" ? "bg-accent-100 text-accent-700" : "bg-amber-100 text-amber-700"}`}>
                {p.status as string}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <div className="text-sm text-surface-500">Basic Salary</div>
                <div className="text-lg font-medium text-surface-900">{formatCurrency(p.basicSalary as number)}</div>
              </div>
              <div>
                <div className="text-sm text-surface-500">HRA</div>
                <div className="text-lg font-medium text-surface-900">{formatCurrency(p.hra as number)}</div>
              </div>
              <div>
                <div className="text-sm text-surface-500">Allowances</div>
                <div className="text-lg font-medium text-surface-900">{formatCurrency(p.allowances as number)}</div>
              </div>
              <div>
                <div className="text-sm text-surface-500">Deductions</div>
                <div className="text-lg font-medium text-red-600">-{formatCurrency(p.deductions as number)}</div>
              </div>
              <div>
                <div className="text-sm text-surface-500">Net Salary</div>
                <div className="text-lg font-bold text-primary-600">{formatCurrency(p.netSalary as number)}</div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
