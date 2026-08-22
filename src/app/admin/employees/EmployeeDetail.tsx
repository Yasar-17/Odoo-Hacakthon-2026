"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface EmployeeRow {
  id: string; firstName: string; lastName: string;
  department?: string | null; designation?: string | null;
  employmentType?: string | null; dateOfJoining: string;
  profilePicture?: string | null; basicSalary?: number | null;
  hra?: number | null; allowances?: number | null; deductions?: number | null;
  dateOfBirth?: string | null; phone?: string | null; address?: string | null;
  gender?: string | null; user?: { employeeId: string; email: string; role: string };
}

const tabs = ["Personal", "Job", "Salary", "Documents"] as const;
type Tab = (typeof tabs)[number];

export default function EmployeeDetail({ employeeId, onBack }: { employeeId: string; onBack: () => void }) {
  const { toast } = useToast();
  const [employee, setEmployee] = useState<EmployeeRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Personal");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useRef({
    firstName: "", lastName: "", phone: "", dateOfBirth: "", address: "", gender: "",
    department: "", designation: "", employmentType: "", dateOfJoining: "",
    basicSalary: 0, hra: 0, allowances: 0, deductions: 0, profilePicture: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const empRes = await fetch("/api/employees").then((r) => r.json()).catch(() => ({ success: false }));
    if (empRes.success) {
      const list: EmployeeRow[] = Array.isArray(empRes.data) ? empRes.data : [];
      const found = list.find((e) => e.user?.employeeId === employeeId);
      if (found) {
        setEmployee(found);
        form.current = {
          firstName: found.firstName, lastName: found.lastName, phone: found.phone ?? "",
          dateOfBirth: found.dateOfBirth ? new Date(found.dateOfBirth).toISOString().split("T")[0] : "",
          address: found.address ?? "", gender: found.gender ?? "",
          department: found.department ?? "", designation: found.designation ?? "",
          employmentType: found.employmentType ?? "",
          dateOfJoining: found.dateOfJoining ? new Date(found.dateOfJoining).toISOString().split("T")[0] : "",
          basicSalary: found.basicSalary ?? 0, hra: found.hra ?? 0,
          allowances: found.allowances ?? 0, deductions: found.deductions ?? 0,
          profilePicture: found.profilePicture ?? "",
        };
      }
    }
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
      const res = await fetch("/api/employees", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) { toast("success", "Changes saved"); fetchData(); }
      else { toast("error", data.error ?? "Save failed"); }
    } catch { toast("error", "Something went wrong"); }
    setSaving(false);
  };

  const netPay = (form.current.basicSalary ?? 0) + (form.current.hra ?? 0) + (form.current.allowances ?? 0) - (form.current.deductions ?? 0);
  const fullName = `${form.current.firstName} ${form.current.lastName}`;
  const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

  if (loading) return <div className="bg-surface-pure rounded-xl border border-border-light p-6 animate-pulse h-96" />;
  if (!employee) return <EmptyState icon="person_off" title="Employee not found" description="This employee may have been removed." />;

  return (
    <div className="flex flex-col gap-gutter">
      <button onClick={onBack} className="flex items-center gap-2 text-secondary hover:text-primary transition-colors w-fit">
        <Icon name="arrow_back" className="text-[20px]" />
        <span className="text-label-md uppercase">Back to Employees</span>
      </button>

      <div className="bg-surface-pure rounded-xl border border-border-light ambient-shadow overflow-hidden">
        <div className="p-container-padding border-b border-border-light flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="relative w-[120px] h-[120px] shrink-0 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <Avatar src={form.current.profilePicture} name={fullName} size="lg" className="!w-[120px] !h-[120px] !text-3xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Icon name="photo_camera" className="text-[32px] text-white" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFilePick} />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-headline text-headline-lg text-primary">{fullName}</h1>
                <p className="text-body-lg text-secondary mt-1">{form.current.designation || "—"}</p>
              </div>
              <StatusBadge status="ACTIVE" />
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
              <div>
                <p className="text-label-md text-on-tertiary-container uppercase tracking-wider mb-1">Employee ID</p>
                <p className="text-body-sm font-mono">{employee.user?.employeeId}</p>
              </div>
              <div>
                <p className="text-label-md text-on-tertiary-container uppercase tracking-wider mb-1">Department</p>
                <p className="text-body-sm font-semibold text-primary">{form.current.department || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-b border-border-light px-container-padding">
          <nav className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`py-4 text-body-sm whitespace-nowrap border-b-2 -mb-px transition-colors font-semibold ${activeTab === tab ? "border-primary text-primary" : "border-transparent text-secondary hover:text-primary"}`}>
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-container-padding">
          {activeTab === "Personal" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
              <Input label="First Name" value={form.current.firstName} onChange={(e) => { form.current.firstName = e.target.value; }} />
              <Input label="Last Name" value={form.current.lastName} onChange={(e) => { form.current.lastName = e.target.value; }} />
              <Input label="Email" value={employee.user?.email || ""} disabled />
              <Input type="tel" label="Phone" value={form.current.phone} onChange={(e) => { form.current.phone = e.target.value; }} />
              <Input type="date" label="Date of Birth" value={form.current.dateOfBirth} onChange={(e) => { form.current.dateOfBirth = e.target.value; }} />
              <div className="md:col-span-2">
                <label className="block text-label-md uppercase tracking-wider text-secondary mb-2">Address</label>
                <textarea rows={3} value={form.current.address} onChange={(e) => { form.current.address = e.target.value; }}
                  className="w-full bg-surface-pure border border-border-light px-4 py-3 rounded font-body-md text-body-md text-primary resize-none focus:outline-none focus:border-border-bold focus:ring-0 transition-colors"
                  placeholder="Street, City, State, PIN" />
              </div>
            </div>
          )}
          {activeTab === "Job" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
              <Input label="Designation" value={form.current.designation} onChange={(e) => { form.current.designation = e.target.value; }} />
              <Input label="Department" value={form.current.department} onChange={(e) => { form.current.department = e.target.value; }} />
              <Input label="Employment Type" value={form.current.employmentType} onChange={(e) => { form.current.employmentType = e.target.value; }} />
              <Input type="date" label="Joining Date" value={form.current.dateOfJoining} disabled />
            </div>
          )}
          {activeTab === "Salary" && (
            <div className="max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                <Input type="number" label="Base Pay" value={String(form.current.basicSalary)} onChange={(e) => { form.current.basicSalary = Number(e.target.value) || 0; }} />
                <Input type="number" label="HRA" value={String(form.current.hra)} onChange={(e) => { form.current.hra = Number(e.target.value) || 0; }} />
                <Input type="number" label="Allowances" value={String(form.current.allowances)} onChange={(e) => { form.current.allowances = Number(e.target.value) || 0; }} />
                <Input type="number" label="Deductions" value={String(form.current.deductions)} onChange={(e) => { form.current.deductions = Number(e.target.value) || 0; }} />
              </div>
              <div className="bg-surface-container-low border border-border-light rounded-lg p-4 flex items-center justify-between">
                <span className="font-headline text-body-lg font-semibold text-primary">Net Pay</span>
                <span className="font-headline text-headline-md font-bold text-primary">{INR.format(netPay)}</span>
              </div>
            </div>
          )}
          {activeTab === "Documents" && (
            <EmptyState icon="folder" title="No documents uploaded yet" description="ID proofs and contracts will appear here." />
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-6 border-t border-border-light mt-6">
            <Button variant="secondary" onClick={() => handleSave(["profilePicture"])} loading={saving}>Save Photo</Button>
            <Button variant="secondary" onClick={() => handleSave(["phone", "address", "dateOfBirth", "gender"])} loading={saving}>Save Personal</Button>
            <Button variant="secondary" onClick={() => handleSave(["department", "designation", "employmentType"])} loading={saving}>Save Job</Button>
            <Button arrow onClick={() => handleSave(["basicSalary", "hra", "allowances", "deductions"])} loading={saving}>Save Salary</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
