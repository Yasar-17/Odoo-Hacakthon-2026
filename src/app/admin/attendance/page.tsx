"use client";

import { useEffect, useState } from "react";
import Badge from "@/components/ui/Badge";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetch(`/api/attendance?date=${date}`).then((r) => r.json()).then((d) => { if (d.success) setRecords(d.data || []); });
  }, [date]);

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
      </PageHeader>

      {records.length === 0 ? (
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
    </div>
  );
}
