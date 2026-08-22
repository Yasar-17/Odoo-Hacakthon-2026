"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

interface EmployeeRow {
  id: string;
  firstName: string;
  lastName: string;
  department?: string | null;
  designation?: string | null;
  employmentType?: string | null;
  dateOfJoining: string;
  profilePicture?: string | null;
  basicSalary?: number | null;
  hra?: number | null;
  allowances?: number | null;
  deductions?: number | null;
  dateOfBirth?: string | null;
  phone?: string | null;
  address?: string | null;
  gender?: string | null;
  user?: { employeeId: string; email: string; role: string };
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";
}

const PAGE_SIZE = 10;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function EmployeeDetail({ employeeId, onBack }: { employeeId: string; onBack: () => void }) {
  const { toast } = useToast();
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Personal");
  const [saving, setSaving] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tabs = ["Personal", "Job", "Salary", "Documents"] as const;
  type Tab = (typeof tabs)[number];

  const form = useRef({
    firstName: "", lastName: "", phone: "", dateOfBirth: "", address: "", gender: "",
    department: "", designation: "", employmentType: "", dateOfJoining: "",
    basicSalary: 0, hra: 0, allowances: 0, deductions: 0,
    profilePicture: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [empRes, attRes] = await Promise.all([
      fetch("/api/employees").then((r) => r.json()).catch(() => ({ success: false })),
      fetch(`/api/attendance?date=${today}`).then((r) => r.json()).catch(() => ({ success: false })),
    ]);
    if (empRes.success) {
      const list: EmployeeRow[] = Array.isArray(empRes.data) ? empRes.data : [];
      const found = list.find((e) => e.user?.employeeId === employeeId);
      if (found) {
        setEmployee(found);
        form.current = {
          firstName: found.firstName,
          lastName: found.lastName,
          phone: found.phone ?? "",
          dateOfBirth: found.dateOfBirth ? new Date(found.dateOfBirth).toISOString().split("T")[0] : "",
          address: found.address ?? "",
          gender: found.gender ?? "",
          department: found.department ?? "",
          designation: found.designation ?? "",
          employmentType: found.employmentType ?? "",
          dateOfJoining: found.dateOfJoining ? new Date(found.dateOfJoining).toISOString().split("T")[0] : "",
          basicSalary: found.basicSalary ?? 0,
          hra: found.hra ?? 0,
          allowances: found.allowances ?? 0,
          deductions: found.deductions ?? 0,
          profilePicture: found.profilePicture ?? "",
        };
      }
    }
    if (attRes.success) setTodayAttendance(Array.isArray(attRes.data) ? attRes.data : []);
    setLoading(false);
  }, [employeeId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { form.current.profilePicture = reader.result as string; };
    reader.readAsDataURL(file);
  };

  const handleSave = async (fields: string[]) => {
    if (!employee) return;
    setSaving(true);
    const payload: Record<string, unknown> = { employeeId: employee.user?.employeeId };
    fields.forEach((f) => { if (f in form.current) payload[f] = (form.current as Record<string, unknown>)[f]; });
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Changes saved");
        fetchData();
      } else {
        toast("error", data.error ?? "Save failed");
      }
    } catch { toast("error", "Something went wrong"); }
    setSaving(false);
  };

  const netPay =
    (form.current.basicSalary ?? 0) + (form.current.hra ?? 0) + (form.current.allowances ?? 0) - (form.current.deductions ?? 0);

  const isOnLeave = todayAttendance.some((a) => a.status === "LEAVE" && a.employeeId === employee?.id);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-surface-200 rounded w-48" />
          <div className="h-10 bg-surface-200 rounded w-32" />
        </div>
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6 h-96" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center py-20 text-surface-400">Employee not found</div>;
  }

  const fullName = `${form.current.firstName} ${form.current.lastName}`;

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={onBack} className="inline-flex items-center gap-1">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Back to Employees
      </Button>

      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-surface-200 flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="relative w-[120px] h-[120px] shrink-0 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <Avatar src={form.current.profilePicture} name={fullName} size="lg" className="!w-[120px] !h-[120px] !text-3xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFilePick} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-surface-900">{fullName}</h1>
                <p className="text-sm text-surface-500 mt-0.5">{form.current.designation || "—"}</p>
              </div>
              <StatusBadge status={isOnLeave ? "ON_LEAVE" : "ACTIVE"} />
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
              <div><p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Employee ID</p><p className="text-sm font-mono">{employee.user?.employeeId}</p></div>
              <div><p className="text-xs text-surface-400 uppercase tracking-wide font-medium">Department</p><p className="text-sm font-medium text-surface-900">{form.current.department || "—"}</p></div>
            </div>
          </div>
        </div>

        <div className="border-b border-surface-200 px-6">
          <nav className="flex gap-6 overflow-x-auto">
            {["Personal", "Job", "Salary", "Documents"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab as Tab)} className={`py-3.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${activeTab === tab ? "border-primary-700 text-surface-900 font-semibold" : "border-transparent text-surface-500 hover:text-surface-700"}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Personal */}
          {activeTab === "Personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
              <Input label="First Name" value={form.current.firstName} onChange={(e) => { form.current.firstName = e.target.value; }} />
              <Input label="Last Name" value={form.current.lastName} onChange={(e) => { form.current.lastName = e.target.value; }} />
              <Input label="Email" value={employee.user?.email || ""} disabled />
              <Input type="tel" label="Phone" value={form.current.phone} onChange={(e) => { form.current.phone = e.target.value; }} />
              <Input type="date" label="Date of Birth" value={form.current.dateOfBirth} onChange={(e) => { form.current.dateOfBirth = e.target.value; }} />
              <div className="md:col-span-2">
                <label className="block text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">Address</label>
                <textarea rows={3} value={form.current.address} onChange={(e) => { form.current.address = e.target.value; }} className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-600" placeholder="Street, City, State, PIN" />
              </div>
            </div>
          )}

          {/* Job */}
          {activeTab === "Job" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
              <Input label="Designation" value={form.current.designation} onChange={(e) => { form.current.designation = e.target.value; }} />
              <Input label="Department" value={form.current.department} onChange={(e) => { form.current.department = e.target.value; }} />
              <Input label="Employment Type" value={form.current.employmentType} onChange={(e) => { form.current.employmentType = e.target.value; }} />
              <Input type="date" label="Joining Date" value={form.current.dateOfJoining} disabled />
            </div>
          )}

          {/* Salary */}
          {activeTab === "Salary" && (
            <div className="max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <Input type="number" label="Base Pay" value={String(form.current.basicSalary)} onChange={(e) => { form.current.basicSalary = Number(e.target.value) || 0; }} />
                <Input type="number" label="HRA" value={String(form.current.hra)} onChange={(e) => { form.current.hra = Number(e.target.value) || 0; }} />
                <Input type="number" label="Allowances" value={String(form.current.allowances)} onChange={(e) => { form.current.allowances = Number(e.target.value) || 0; }} />
                <Input type="number" label="Deductions" value={String(form.current.deductions)} onChange={(e) => { form.current.deductions = Number(e.target.value) || 0; }} />
              </div>
              <div className="bg-surface-50 border border-surface-200 rounded-lg p-4 flex items-center justify-between">
                <span className="font-semibold text-surface-900">Net Pay</span>
                <span className="text-lg font-bold font-mono text-success-text">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(netPay)}</span>
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === "Documents" && (
            <div className="max-w-3xl">
              <p className="text-sm text-surface-400 text-center py-16">No documents uploaded yet</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-surface-200 mt-6">
            <Button variant="secondary" onClick={() => handleSave(["profilePicture"])} loading={saving}>
              Save Photo
            </Button>
            <Button variant="secondary" onClick={() => handleSave(["phone", "address", "dateOfBirth", "gender"])} loading={saving}>
              Save Personal
            </Button>
            <Button variant="secondary" onClick={() => handleSave(["department", "designation", "employmentType"])} loading={saving}>
              Save Job
            </Button>
            <Button onClick={() => handleSave(["basicSalary", "hra", "allowances", "deductions"])} loading={saving}>
              Save Salary
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminEmployeesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [sortKey, setSortKey] = useState<"name" | "join">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ firstName: "", lastName: "", email: "", employeeId: "", department: "", designation: "", role: "EMPLOYEE" });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("id");
    if (p) setDetailId(p);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const [empRes, attRes] = await Promise.all([
      fetch("/api/employees").then((r) => r.json()).catch(() => ({ success: false })),
      fetch(`/api/attendance?date=${today}`).then((r) => r.json()).catch(() => ({ success: false })),
    ]);
    if (empRes.success) setEmployees(Array.isArray(empRes.data) ? empRes.data : []);
    if (attRes.success) setTodayAttendance(Array.isArray(attRes.data) ? attRes.data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => setPage(0), [search, deptFilter, roleFilter, sortKey, sortDir]);

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[], [employees]);

  const filtered = useMemo(() => {
    let list = employees.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`.toLowerCase();
      const eid = (e.user?.employeeId ?? "").toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase()) || eid.includes(search.toLowerCase());
      const matchesDept = deptFilter === "ALL" || e.department === deptFilter;
      const matchesRole = roleFilter === "ALL" || e.user?.role === roleFilter;
      return matchesSearch && matchesDept && matchesRole;
    });
    list.sort((a, b) => {
      const av = sortKey === "name" ? `${a.firstName} ${a.lastName}` : a.dateOfJoining;
      const bv = sortKey === "name" ? `${b.firstName} ${b.lastName}` : b.dateOfJoining;
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [employees, search, deptFilter, roleFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleAddSubmit = async () => {
    if (!addForm.firstName || !addForm.lastName || !addForm.email || !addForm.employeeId) {
      setAddError("All fields are required");
      return;
    }
    setAddLoading(true);
    setAddError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: addForm.employeeId,
          email: addForm.email,
          password: "Dayflow@123",
          role: addForm.role,
          firstName: addForm.firstName,
          lastName: addForm.lastName,
          department: addForm.department,
          designation: addForm.designation,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Employee created — temp password: Dayflow@123");
        setShowAddModal(false);
        setAddForm({ firstName: "", lastName: "", email: "", employeeId: "", department: "", designation: "", role: "EMPLOYEE" });
        fetchData();
      } else {
        setAddError(data.error ?? "Creation failed");
      }
    } catch { setAddError("Something went wrong"); }
    setAddLoading(false);
  };

  if (detailId) {
    return <EmployeeDetail employeeId={detailId} onBack={() => { router.push("/admin/employees"); }} />;
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-surface-200 rounded w-48" />
          <div className="h-10 bg-surface-200 rounded w-32" />
        </div>
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-5 animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Search by name or Employee ID…" value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600" />
          </div>
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"><option value="ALL">All Departments</option>{departments.map((d) => <option key={d} value={d}>{d}</option>)}</select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"><option value="ALL">All Roles</option><option value="EMPLOYEE">Employee</option><option value="ADMIN">Admin</option></select>
        </div>
        <Button onClick={() => setShowAddModal(true)}>Add Employee</Button>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-200 bg-surface-50">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Photo</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500 cursor-pointer select-none" onClick={() => { setSortKey("name"); setSortDir((d) => d === "asc" ? "desc" : "asc"); }}>
                  Name <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} /></svg>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Department</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500 cursor-pointer select-none" onClick={() => { setSortKey("join"); setSortDir((d) => d === "asc" ? "desc" : "asc"); }}>
                  Join Date <svg className="inline w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sortDir === "asc" ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} /></svg>
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wider text-surface-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center text-surface-400">No employees found</td></tr>
              )}
              {filtered.map((emp) => {
                const isOnLeave = todayAttendance.some((a) => a.status === "LEAVE" && a.employeeId === emp.id);
                const name = `${emp.firstName} ${emp.lastName}`;
                return (
                  <tr key={emp.id} onClick={() => setDetailId(emp.user?.employeeId ?? "")} className="border-b border-surface-100 last:border-0 hover:bg-surface-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5"><Avatar src={emp.profilePicture} name={name} size="sm" /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3"><Avatar src={emp.profilePicture} name={name} size="sm" /><div><p className="font-medium text-surface-900">{name}</p><p className="text-xs text-surface-400 font-mono">{emp.user?.employeeId}</p></div></div>
                    </td>
                    <td className="px-5 py-3.5 text-surface-600">{emp.department || "—"}</td>
                    <td className="px-5 py-3.5 text-surface-600">{emp.designation || "—"}</td>
                    <td className="px-5 py-3.5 font-mono text-surface-600">{fmtDate(emp.dateOfJoining)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={isOnLeave ? "ON_LEAVE" : "ACTIVE"} /></td>
                    <td className="px-5 py-3.5 text-right"><button onClick={(e) => { e.stopPropagation(); setDetailId(emp.user?.employeeId ?? ""); }} className="w-8 h-8 inline-flex items-center justify-center rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors" title="View"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-surface-200">
            <span className="text-xs text-surface-400">Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
            <div className="flex gap-2"><Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button></div>
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Employee">
        <div className="space-y-4">
          {addError && <div className="bg-danger-light border border-red-200 text-danger-text text-sm rounded-lg px-4 py-3">{addError}</div>}
          <div className="grid grid-cols-2 gap-3"><Input label="First Name" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} /><Input label="Last Name" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} /></div>
          <Input type="email" label="Email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
          <Input label="Employee ID" value={addForm.employeeId} onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })} />
          <Input label="Department" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} />
          <Input label="Job Title" value={addForm.designation} onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })} />
          <div><label className="block text-sm font-medium text-surface-700 mb-1">Role</label><select value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })} className="w-full px-3 py-2.5 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-600"><option value="EMPLOYEE">Employee</option><option value="ADMIN">Admin</option></select></div>
          <div className="flex justify-end gap-3 pt-2"><Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button><Button onClick={handleAddSubmit} loading={addLoading}>Create Employee</Button></div>
        </div>
      </Modal>
    </div>
  );
}