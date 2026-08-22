"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface AttendanceRecord { id: string; date: string; checkIn: string | null; checkOut: string | null; status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE"; }
type View = "daily" | "weekly";

function toISODate(d: Date) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function startOfWeek(d: Date) { const s = new Date(d); s.setDate(s.getDate() - s.getDay()); s.setHours(0, 0, 0, 0); return s; }
function formatTime(iso: string | null) { if (!iso) return "—"; return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }); }
function hoursBetween(ci: string | null, co: string | null): number { if (!ci || !co) return 0; const ms = new Date(co).getTime() - new Date(ci).getTime(); return ms > 0 ? ms / 3_600_000 : 0; }
function formatHours(h: number) { if (h <= 0) return "—"; const hrs = Math.floor(h); const mins = Math.round((h - hrs) * 60); return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`; }

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
    const params = view === "daily" ? `date=${selectedDate}` : `week=${toISODate(weekStart)}`;
    try { const res = await fetch(`/api/attendance?${params}`); const data = await res.json(); setRecords(data.success ? data.data ?? [] : []); }
    catch { setRecords([]); }
    setLoading(false);
  }, [view, selectedDate, weekStart]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const todayISO = toISODate(new Date());
  const todayRecord = records.find((r) => r.date.split("T")[0] === todayISO) ?? records.find((r) => r.date.split("T")[0] === selectedDate);
  const hasCheckedIn = !!todayRecord?.checkIn;
  const hasCheckedOut = !!todayRecord?.checkOut;

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d; }), [weekStart]);
  const weeklyRows = useMemo(() => weekDays.map((d) => { const iso = toISODate(d); const rec = records.find((r) => r.date.split("T")[0] === iso); return { date: d, record: rec, hours: rec ? hoursBetween(rec.checkIn, rec.checkOut) : 0 }; }), [weekDays, records]);
  const totalWeeklyHours = weeklyRows.reduce((sum, r) => sum + r.hours, 0);

  const handleCheckInOut = async () => {
    setActionLoading(true);
    const action = hasCheckedIn ? "checkout" : "checkin";
    try {
      const res = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const data = await res.json();
      if (data.success) { toast("success", action === "checkin" ? "Checked in successfully" : "Checked out successfully"); await fetchData(); }
      else { toast("error", data.error ?? "Something went wrong"); }
    } catch { toast("error", "Something went wrong"); }
    setActionLoading(false);
  };

  const shiftWeek = (dir: number) => { const d = new Date(weekStart); d.setDate(d.getDate() + dir * 7); setWeekStart(d); };
  const weekRangeLabel = () => { const end = new Date(weekStart); end.setDate(weekStart.getDate() + 6); const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }; return `${weekStart.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`; };
  const isTodaySelected = view === "daily" && selectedDate === todayISO;

  return (
    <div className="flex flex-col gap-gutter">
      <PageHeader title="Attendance" subtitle="Track your daily check-ins and weekly hours.">
        <div className="inline-flex bg-surface-container-low rounded-lg p-1">
          {(["daily", "weekly"] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`px-4 py-2 text-label-md uppercase tracking-wider rounded-md transition-all ${view === v ? "bg-primary text-on-primary" : "text-secondary hover:text-primary"}`}>{v === "daily" ? "Daily" : "Weekly"}</button>
          ))}
        </div>
      </PageHeader>

      {view === "daily" && (
        <>
          <div className="flex justify-end">
            <input type="date" value={selectedDate} max={todayISO} onChange={(e) => setSelectedDate(e.target.value)}
              className="px-4 py-2.5 bg-surface-pure border border-border-light rounded-lg text-body-sm text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
          </div>

          <div className="bg-surface-pure rounded-xl p-container-padding ambient-shadow border border-surface-variant flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${hasCheckedIn ? "bg-success-light text-success-text" : "bg-secondary-container text-on-secondary-container"}`}>
              <Icon name="event_available" filled className="text-[28px]" />
            </div>
            {isTodaySelected ? (
              <>
                {hasCheckedOut ? (
                  <Button variant="secondary" size="lg" disabled>Day Complete</Button>
                ) : hasCheckedIn ? (
                  <Button onClick={handleCheckInOut} loading={actionLoading} size="lg" variant="secondary" className="!border-error !text-danger-text hover:!bg-error-light">Check Out</Button>
                ) : (
                  <Button onClick={handleCheckInOut} loading={actionLoading} size="lg" arrow>Check In</Button>
                )}
                <p className="mt-4 text-body-sm text-secondary">
                  {hasCheckedIn && todayRecord?.checkIn ? `Checked in at ${formatTime(todayRecord.checkIn)}` : "You haven't checked in yet today"}
                  {hasCheckedIn && hasCheckedOut && todayRecord?.checkOut ? ` · Checked out at ${formatTime(todayRecord.checkOut)}` : ""}
                </p>
              </>
            ) : <p className="text-body-sm text-secondary">Check-in is only available for today.</p>}
          </div>
        </>
      )}

      {view === "weekly" && (
        <div className="flex justify-end">
          <div className="inline-flex items-center gap-1 bg-surface-pure border border-border-light rounded-lg px-1 py-1">
            <button onClick={() => shiftWeek(-1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-low text-secondary transition-colors"><Icon name="chevron_left" className="text-[20px]" /></button>
            <span className="text-body-sm font-medium text-primary min-w-[170px] text-center">{weekRangeLabel()}</span>
            <button onClick={() => shiftWeek(1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-container-low text-secondary transition-colors"><Icon name="chevron_right" className="text-[20px]" /></button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-surface-pure rounded-xl border border-border-light p-6 animate-pulse h-40" />
      ) : records.length === 0 && view === "daily" ? (
        <div className="bg-surface-pure rounded-xl border border-border-light">
          <EmptyState icon="event_available" title="No attendance records yet" description="Your check-ins will appear here once you start logging time." />
        </div>
      ) : (
        <section className="bg-surface-pure border border-border-light rounded-lg overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-light bg-surface-subtle">
                {["Date", "Check-in", "Check-out", "Status", "Hours Worked"].map((h, i) => (
                  <th key={i} className={`py-4 px-6 text-label-md text-secondary uppercase tracking-wider ${i === 4 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light text-body-md">
              {view === "daily" ? records.map((rec) => (
                <tr key={rec.id} className="hover:bg-surface-container transition-colors">
                  <td className="py-4 px-6 font-semibold text-primary">{new Date(rec.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</td>
                  <td className="py-4 px-6 text-on-surface-variant">{formatTime(rec.checkIn)}</td>
                  <td className="py-4 px-6 text-on-surface-variant">{formatTime(rec.checkOut)}</td>
                  <td className="py-4 px-6"><StatusBadge status={rec.status} /></td>
                  <td className="py-4 px-6 text-right font-semibold text-primary">{formatHours(hoursBetween(rec.checkIn, rec.checkOut))}</td>
                </tr>
              )) : (
                <>
                  {weeklyRows.map(({ date, record, hours }) => (
                    <tr key={toISODate(date)} className="hover:bg-surface-container transition-colors">
                      <td className="py-4 px-6 font-semibold text-primary">
                        {date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                        {toISODate(date) === todayISO && <span className="ml-2 text-label-md text-primary uppercase">Today</span>}
                      </td>
                      <td className="py-4 px-6 text-on-surface-variant">{formatTime(record?.checkIn ?? null)}</td>
                      <td className="py-4 px-6 text-on-surface-variant">{formatTime(record?.checkOut ?? null)}</td>
                      <td className="py-4 px-6">{record ? <StatusBadge status={record.status} /> : <span className="text-outline">—</span>}</td>
                      <td className="py-4 px-6 text-right font-semibold text-primary">{formatHours(hours)}</td>
                    </tr>
                  ))}
                  <tr className="bg-surface-subtle">
                    <td colSpan={4} className="py-4 px-6 font-headline font-semibold text-primary">Total this week</td>
                    <td className="py-4 px-6 text-right font-headline font-bold text-primary">{formatHours(totalWeeklyHours)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
