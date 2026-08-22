"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";

export default function AttendancePage() {
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAttendance = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekParam = startOfWeek.toISOString().split("T")[0];

    const url = view === "daily" ? `/api/attendance?date=${today}` : `/api/attendance?week=${weekParam}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.success) setRecords(data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchAttendance();
  }, [view]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkin" }),
    });
    fetchAttendance();
    setActionLoading(false);
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "checkout" }),
    });
    fetchAttendance();
    setActionLoading(false);
  };

  const todayRecord = records.find((r) => {
    const d = new Date(r.date as string);
    return d.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
  });

  const hasCheckedIn = todayRecord && (todayRecord.checkIn as string);
  const hasCheckedOut = todayRecord && (todayRecord.checkOut as string);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-surface-900">Attendance</h1>

      <Card>
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button variant={view === "daily" ? "primary" : "secondary"} size="sm" onClick={() => setView("daily")}>
              Daily
            </Button>
            <Button variant={view === "weekly" ? "primary" : "secondary"} size="sm" onClick={() => setView("weekly")}>
              Weekly
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleCheckIn} disabled={!!hasCheckedIn} loading={actionLoading} size="sm">
              Check In
            </Button>
            <Button variant="secondary" onClick={handleCheckOut} disabled={!hasCheckedIn || !!hasCheckedOut} loading={actionLoading} size="sm">
              Check Out
            </Button>
          </div>
        </div>

        {todayRecord && (
          <div className="mb-4 p-3 bg-surface-50 rounded-lg">
            <span className="text-sm text-surface-600">
              Today: Check-in{" "}
              {(todayRecord.checkIn as string) ? new Date(todayRecord.checkIn as string).toLocaleTimeString() : "-"} | Check-out{" "}
              {(todayRecord.checkOut as string) ? new Date(todayRecord.checkOut as string).toLocaleTimeString() : "-"} | Status:{" "}
              <Badge variant={(todayRecord.status as string) === "PRESENT" ? "success" : "danger"}>
                {todayRecord.status as string}
              </Badge>
            </span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-surface-400">Loading...</div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 text-surface-400">No attendance records found.</div>
        ) : (
          <div className="space-y-2">
            {records.map((rec, i) => {
              const date = new Date(rec.date as string);
              const ci = rec.checkIn ? new Date(rec.checkIn as string) : null;
              const co = rec.checkOut ? new Date(rec.checkOut as string) : null;
              return (
                <div key={i} className="flex items-center justify-between py-3 border-b border-surface-100 last:border-0">
                  <div className="text-sm font-medium text-surface-900">
                    {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </div>
                  <div className="text-sm text-surface-500">
                    {ci ? ci.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-"} &rarr;{" "}
                    {co ? co.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-"}
                  </div>
                  <Badge variant={(rec.status as string) === "PRESENT" ? "success" : (rec.status as string) === "ABSENT" ? "danger" : "warning"}>
                    {rec.status as string}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
