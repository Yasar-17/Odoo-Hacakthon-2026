"use client";

import { useEffect, useState } from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";

export default function PayrollPage() {
  const [payroll, setPayroll] = useState<Record<string, unknown>[]>([]);

  useEffect(() => {
    fetch("/api/payroll").then((r) => r.json()).then((d) => { if (d.success) setPayroll(d.data || []); });
  }, []);

  const formatCurrency = (v: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v);

  return (
    <div className="flex flex-col gap-gutter">
      <PageHeader title="Payroll" subtitle="View your payslips and salary breakdown." />

      {payroll.length === 0 ? (
        <div className="bg-surface-pure rounded-xl border border-border-light">
          <EmptyState icon="payments" title="No payroll records found" description="Your payslips will appear here once payroll is processed." />
        </div>
      ) : (
        payroll.map((p, i) => (
          <div key={i} className="bg-surface-pure rounded-xl p-container-padding ambient-shadow border border-surface-variant">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline text-headline-md text-primary">
                {new Date(0, p.month as number - 1).toLocaleString("en-US", { month: "long" })} {p.year as number}
              </h2>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-md uppercase ${p.status === "PAID" ? "bg-success-light text-success-text" : "bg-warning-light text-warning-text"}`}>
                {p.status as string}
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-gutter">
              {[
                { label: "Basic Salary", value: formatCurrency(p.basicSalary as number) },
                { label: "HRA", value: formatCurrency(p.hra as number) },
                { label: "Allowances", value: formatCurrency(p.allowances as number) },
                { label: "Deductions", value: `-${formatCurrency(p.deductions as number)}`, danger: true },
                { label: "Net Salary", value: formatCurrency(p.netSalary as number), bold: true },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-label-md text-secondary uppercase mb-1">{item.label}</p>
                  <p className={`font-headline text-body-lg ${item.bold ? "font-bold text-primary" : item.danger ? "text-danger-text" : "text-primary"}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
