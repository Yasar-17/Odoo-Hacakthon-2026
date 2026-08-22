"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import PageHeader from "@/components/ui/PageHeader";
import SearchInput from "@/components/ui/SearchInput";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import EmployeeDetail from "./EmployeeDetail";
import { useToast } from "@/components/ui/Toast";

interface EmployeeRow {
  id: string; firstName: string; lastName: string;
  department?: string | null; designation?: string | null;
  dateOfJoining: string; profilePicture?: string | null;
  user?: { employeeId: string; email: string; role: string };
}

interface AttendanceRecord { id: string; employeeId: string; date: string; status: string; }

const PAGE_SIZE = 9;

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  useEffect(() => setPage(0), [search, deptFilter]);

  const departments = useMemo(() => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))) as string[], [employees]);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const name = `${e.firstName} ${e.lastName}`.toLowerCase();
      const eid = (e.user?.employeeId ?? "").toLowerCase();
      const matchesSearch = name.includes(search.toLowerCase()) || eid.includes(search.toLowerCase());
      const matchesDept = deptFilter === "ALL" || e.department === deptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, search, deptFilter]);

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
        body: JSON.stringify({ ...addForm, password: "Dayflow@123" }),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Employee created — temp password: Dayflow@123");
        setShowAddModal(false);
        setAddForm({ firstName: "", lastName: "", email: "", employeeId: "", department: "", designation: "", role: "EMPLOYEE" });
        fetchData();
      } else { setAddError(data.error ?? "Creation failed"); }
    } catch { setAddError("Something went wrong"); }
    setAddLoading(false);
  };

  if (detailId) return <EmployeeDetail employeeId={detailId} onBack={() => { router.push("/admin/employees"); }} />;

  if (loading) {
    return (
      <div className="flex flex-col gap-gutter">
        <div className="h-10 bg-surface-container rounded animate-pulse w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
          {[1, 2, 3, 4, 5, 6].map((n) => <div key={n} className="bg-surface-pure rounded-xl border border-border-light p-6 animate-pulse h-56" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-gutter">
      <PageHeader title="Employee Directory" subtitle="Manage and view all active team members across departments.">
        <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." className="w-full md:w-64" />
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="!py-2.5">
          <option value="ALL">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </Select>
        <Button arrow onClick={() => setShowAddModal(true)}>Add Employee</Button>
      </PageHeader>

      {paged.length === 0 ? (
        <div className="bg-surface-pure rounded-xl border border-border-light">
          <EmptyState icon="group_off" title="No employees found" description="Try adjusting your search or filters." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
            {paged.map((emp) => {
              const name = `${emp.firstName} ${emp.lastName}`;
              const isOnLeave = todayAttendance.some((a) => a.status === "LEAVE" && a.employeeId === emp.id);
              return (
                <div key={emp.id} onClick={() => setDetailId(emp.user?.employeeId ?? "")}
                  className={`bg-surface-pure rounded-xl p-container-padding ambient-shadow ambient-shadow-hover border border-surface-variant flex flex-col gap-5 cursor-pointer transition-all ${isOnLeave ? "opacity-80" : ""}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar src={emp.profilePicture} name={name} size="lg" />
                        <div className={`absolute bottom-0 right-0 w-4 h-4 ${isOnLeave ? "bg-outline" : "bg-primary"} border-2 border-white rounded-full`} />
                      </div>
                      <div>
                        <h3 className="font-headline text-headline-md text-primary">{name}</h3>
                        <p className="text-body-sm text-secondary font-medium">{emp.designation || "—"}</p>
                      </div>
                    </div>
                    <button className="text-outline hover:text-primary transition-colors" onClick={(e) => { e.stopPropagation(); setDetailId(emp.user?.employeeId ?? ""); }}>
                      <Icon name="more_vert" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light">
                    <div>
                      <p className="text-label-md text-on-tertiary-container uppercase tracking-wider mb-1">Department</p>
                      <p className="text-body-sm text-on-surface">{emp.department || "—"}</p>
                    </div>
                    <div>
                      <p className="text-label-md text-on-tertiary-container uppercase tracking-wider mb-1">Joined</p>
                      <p className="text-body-sm text-on-surface">{fmtDate(emp.dateOfJoining)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-border-light mt-auto">
                    <StatusBadge status={isOnLeave ? "ON_LEAVE" : "ACTIVE"} />
                    <div className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-secondary hover:bg-primary hover:text-on-primary transition-colors">
                        <Icon name="mail" className="text-[18px]" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between pt-6 border-t border-outline-variant">
              <p className="text-body-sm text-secondary">Showing {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length} employees</p>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Employee"
        footer={<><Button variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button><Button arrow onClick={handleAddSubmit} loading={addLoading}>Create</Button></>}>
        <div className="space-y-4">
          {addError && <div className="bg-error-container text-on-error-container text-sm rounded px-4 py-3">{addError}</div>}
          <div className="grid grid-cols-2 gap-3">
            <Input label="First Name" value={addForm.firstName} onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })} />
            <Input label="Last Name" value={addForm.lastName} onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })} />
          </div>
          <Input type="email" label="Email" value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
          <Input label="Employee ID" value={addForm.employeeId} onChange={(e) => setAddForm({ ...addForm, employeeId: e.target.value })} />
          <Input label="Department" value={addForm.department} onChange={(e) => setAddForm({ ...addForm, department: e.target.value })} />
          <Input label="Job Title" value={addForm.designation} onChange={(e) => setAddForm({ ...addForm, designation: e.target.value })} />
          <Select label="Role" value={addForm.role} onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}>
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </div>
      </Modal>
    </div>
  );
}
