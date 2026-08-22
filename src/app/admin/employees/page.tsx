"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmployees(Array.isArray(d.data) ? d.data : []);
      });
  }, []);

  const filtered = employees.filter((e) => {
    const name = `${e.firstName} ${e.lastName}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Employees</h1>

      <Card>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-3 px-4 font-medium text-surface-600">Employee ID</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Name</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Department</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Designation</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Email</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Phone</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp, i) => {
                const user = emp.user as Record<string, unknown> | undefined;
                return (
                  <tr key={i} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 font-mono text-xs">{user?.employeeId as string}</td>
                    <td className="py-3 px-4 font-medium">
                      {emp.firstName as string} {emp.lastName as string}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="info">{(emp.department as string) || "-"}</Badge>
                    </td>
                    <td className="py-3 px-4">{(emp.designation as string) || "-"}</td>
                    <td className="py-3 px-4 text-surface-500">{user?.email as string}</td>
                    <td className="py-3 px-4 text-surface-500">{(emp.phone as string) || "-"}</td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-surface-400">
                    No employees found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
