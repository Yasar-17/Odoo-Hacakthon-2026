"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

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
        <h1 className="text-2xl font-bold text-surface-900">Attendance Records</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <Card>
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
                  <td colSpan={5} className="py-8 text-center text-surface-400">
                    No attendance records for this date.
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
