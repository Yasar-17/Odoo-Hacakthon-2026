"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";

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
      <h1 className="text-xl font-bold text-surface-900 tracking-tight">Payroll</h1>

      {payroll.length === 0 ? (
        <Card>
          <EmptyState
            icon={
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            }
            title="No payroll records found"
            description="Your payslips will appear here once payroll is processed."
          />
        </Card>
      ) : (
        payroll.map((p, i) => (
          <Card key={i}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-surface-900">
                {new Date(0, p.month as number - 1).toLocaleString("en-US", { month: "long" })} {p.year as number}
              </h2>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${p.status === "PAID" ? "bg-success-light text-success-text" : "bg-warning-light text-warning-text"}`}>
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
                <div className="text-lg font-medium text-danger-text">-{formatCurrency(p.deductions as number)}</div>
              </div>
              <div>
                <div className="text-sm text-surface-500">Net Salary</div>
                <div className="text-lg font-bold text-surface-900">{formatCurrency(p.netSalary as number)}</div>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
