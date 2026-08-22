"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
}

type View = "daily" | "weekly";

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeek(d: Date) {
  const s = new Date(d);
  s.setDate(s.getDate() - s.getDay());
  s.setHours(0, 0, 0, 0);
  return s;
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function hoursBetween(checkIn: string | null, checkOut: string | null): number {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return ms > 0 ? ms / 3_600_000 : 0;
}

function formatHours(h: number) {
  if (h <= 0) return "—";
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

export default function AttendancePage() {
  const { toast } = useToast();
  const [view, setView] = useState<View>("daily");
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params =
      view === "daily"
        ? `date=${selectedDate}`
        : `week=${toISODate(weekStart)}`;
    try {
      const res = await fetch(`/api/attendance?${params}`);
      const data = await res.json();
      setRecords(data.success ? data.data ?? [] : []);
    } catch {
      setRecords([]);
    }
    setLoading(false);
  }, [view, selectedDate, weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const todayISO = toISODate(new Date());
  const todayRecord = records.find((r) => r.date.split("T")[0] === todayISO)
    ?? records.find((r) => r.date.split("T")[0] === selectedDate);
  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    });
  }, [weekStart]);

  const weeklyRows = useMemo(
    () =>
      weekDays.map((d) => {
        const iso = toISODate(d);
        const rec = records.find((r) => r.date.split("T")[0] === iso);
        return {
          date: d,
          record: rec,
          hours: rec ? hoursBetween(rec.checkIn, rec.checkOut) : 0,
        };
      }),
    [weekDays, records]
  );

  const totalWeeklyHours = weeklyRows.reduce((sum, r) => sum + r.hours, 0);

  const handleCheckInOut = async () => {
    setActionLoading(true);
    const action = hasCheckedIn ? "checkout" : "checkin";
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", action === "checkin" ? "Checked in successfully" : "Checked out successfully");
        await fetchData();
      } else {
        toast("error", data.error ?? "Something went wrong");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setActionLoading(false);
  };

  const shiftWeek = (dir: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + dir * 7);
    setWeekStart(d);
  };

  const weekRangeLabel = () => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${weekStart.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const isTodaySelected = view === "daily" && selectedDate === todayISO;

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Segmented toggle */}
        <div className="inline-flex bg-surface-200 rounded-lg p-1 w-fit">
          {(["daily", "weekly"] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md capitalize transition-all ${
                view === v ? "bg-white text-surface-900 shadow-sm" : "text-surface-500 hover:text-surface-700"
              }`}
            >
              {v === "daily" ? "Daily" : "Weekly"}
            </button>
          ))}
        </div>

        {/* Right side selector */}
        {view === "daily" ? (
          <input
            type="date"
            value={selectedDate}
            max={todayISO}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
          />
        ) : (
          <div className="inline-flex items-center gap-1 bg-white border border-surface-300 rounded-lg px-1 py-1">
            <button
              onClick={() => shiftWeek(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-100 text-surface-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm font-medium text-surface-700 min-w-[170px] text-center">{weekRangeLabel()}</span>
            <button
              onClick={() => shiftWeek(1)}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-100 text-surface-500 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Check-in/out block — daily view only */}
      {view === "daily" && (
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm py-10 px-6 flex flex-col items-center text-center">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${hasCheckedIn ? "bg-success-light text-success-text" : "bg-primary-50 text-primary-700"}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          {isTodaySelected ? (
            <>
              {hasCheckedOut ? (
                <Button variant="secondary" size="lg" disabled>
                  Day Complete
                </Button>
              ) : hasCheckedIn ? (
                <Button
                  onClick={handleCheckInOut}
                  loading={actionLoading}
                  size="lg"
                  variant="ghost"
                  className="!border-2 !border-danger/40 !text-danger-text hover:!bg-danger-light !rounded-lg font-semibold"
                >
                  Check Out
                </Button>
              ) : (
                <Button onClick={handleCheckInOut} loading={actionLoading} size="lg">
                  Check In
                </Button>
              )}

              <p className="mt-4 text-sm text-surface-500">
                {hasCheckedIn && todayRecord?.checkIn
                  ? `Checked in at ${formatTime(todayRecord.checkIn)}`
                  : "You haven't checked in yet today"}
                {hasCheckedIn && hasCheckedOut && todayRecord?.checkOut
                  ? ` · Checked out at ${formatTime(todayRecord.checkOut)}`
                  : ""}
              </p>
            </>
          ) : (
            <p className="text-sm text-surface-400">Check-in is only available for today.</p>
          )}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-sm text-surface-400">Loading…</div>
        ) : records.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-center px-6">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-300 mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-surface-400">No attendance records yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Check-in</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Check-out</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {view === "daily"
                  ? records.map((rec) => (
                      <tr key={rec.id} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 transition-colors">
                        <td className="px-5 py-3.5 text-surface-900">
                          {new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-surface-600">{formatTime(rec.checkIn)}</td>
                        <td className="px-5 py-3.5 font-mono text-surface-600">{formatTime(rec.checkOut)}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={rec.status} /></td>
                        <td className="px-5 py-3.5 text-right font-mono text-surface-900">
                          {formatHours(hoursBetween(rec.checkIn, rec.checkOut))}
                        </td>
                      </tr>
                    ))
                  : weeklyRows.map(({ date, record, hours }) => (
                      <tr key={toISODate(date)} className="border-b border-surface-100 hover:bg-surface-50 transition-colors">
                        <td className="px-5 py-3.5 text-surface-900">
                          {date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                          {toISODate(date) === todayISO && (
                            <span className="ml-2 text-xs text-primary-700 font-medium">Today</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-surface-600">{formatTime(record?.checkIn ?? null)}</td>
                        <td className="px-5 py-3.5 font-mono text-surface-600">{formatTime(record?.checkOut ?? null)}</td>
                        <td className="px-5 py-3.5">
                          {record ? <StatusBadge status={record.status} /> : <span className="text-surface-300">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-surface-900">{formatHours(hours)}</td>
                      </tr>
                    ))}
                {view === "weekly" && (
                  <tr className="bg-surface-50">
                    <td colSpan={4} className="px-5 py-3.5 font-semibold text-surface-900">Total this week</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-surface-900">{formatHours(totalWeeklyHours)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
