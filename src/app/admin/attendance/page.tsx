"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetch(`/api/attendance?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setRecords(d.data || []);
      });
  }, [date]);

  const statusVariant = (s: string) => {
    if (s === "PRESENT") return "success" as const;
    if (s === "ABSENT") return "danger" as const;
    if (s === "HALF_DAY") return "warning" as const;
    return "info" as const;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-surface-900 tracking-tight">Attendance Records</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900"
        />
      </div>

      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200">
                <th className="text-left py-3 px-4 font-medium text-surface-600">Employee</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Check In</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Check Out</th>
                <th className="text-left py-3 px-4 font-medium text-surface-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-2">
                    <EmptyState
                      icon={
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      }
                      title="No attendance records"
                      description="Nobody has checked in for this date yet."
                    />
                  </td>
                </tr>
              ) : (
                records.map((rec, i) => {
                  const emp = rec.employee as Record<string, unknown> | undefined;
                  return (
                    <tr key={i} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="py-3 px-4 font-medium">
                        {emp?.firstName as string} {emp?.lastName as string}
                      </td>
                      <td className="py-3 px-4">
                        {new Date(rec.date as string).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {rec.checkIn ? new Date(rec.checkIn as string).toLocaleTimeString() : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {rec.checkOut ? new Date(rec.checkOut as string).toLocaleTimeString() : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={statusVariant(rec.status as string)}>{rec.status as string}</Badge>
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
