"use client";

import { useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface EmployeeData {
  firstName: string;
  lastName: string;
  email?: string;
  employeeId?: string;
  department?: string | null;
  designation?: string | null;
  dateOfBirth?: string | null;
  dateOfJoining: string;
  employmentType?: string | null;
  phone?: string | null;
  address?: string | null;
  profilePicture?: string | null;
  basicSalary?: number | null;
  hra?: number | null;
  allowances?: number | null;
  deductions?: number | null;
  documents?: string | null;
}

interface DocItem {
  name: string;
  uploadedAt: string;
  type: string;
}

const tabs = ["Personal Details", "Job Details", "Salary Structure", "Documents"] as const;
type Tab = (typeof tabs)[number];

function formatINR(v: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-0.5">{label}</p>
      <p className="text-sm font-medium text-surface-900">{value || "—"}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">{label}</label>
      <div className="px-3 py-2 bg-surface-100 border border-surface-200 rounded-lg text-sm text-surface-600">
        {value || "—"}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [employee, setEmployee] = useState<EmployeeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("Personal Details");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ phone: "", address: "", profilePicture: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setEmployee(d.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const startEdit = () => {
    setForm({
      phone: employee?.phone ?? "",
      address: employee?.address ?? "",
      profilePicture: employee?.profilePicture ?? "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone,
          address: form.address,
          profilePicture: form.profilePicture,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmployee(data.data);
        setEditing(false);
        toast("success", "Profile updated successfully");
      } else {
        toast("error", data.error ?? "Failed to update profile");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setSaving(false);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (editing) {
        setForm((f) => ({ ...f, profilePicture: dataUrl }));
      } else {
        // Upload immediately even outside edit mode
        (async () => {
          setSaving(true);
          try {
            const res = await fetch("/api/employees", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ profilePicture: dataUrl }),
            });
            const data = await res.json();
            if (data.success) {
              setEmployee(data.data);
              toast("success", "Profile photo updated");
            } else {
              toast("error", data.error ?? "Upload failed");
            }
          } catch {
            toast("error", "Upload failed");
          }
          setSaving(false);
        })();
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6 animate-pulse flex items-center gap-5">
          <div className="w-[120px] h-[120px] rounded-full bg-surface-200 shrink-0" />
          <div className="space-y-3 flex-1">
            <div className="h-6 bg-surface-200 rounded w-1/3" />
            <div className="h-4 bg-surface-100 rounded w-1/4" />
            <div className="h-3 bg-surface-100 rounded w-1/2" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6 animate-pulse">
          <div className="h-10 bg-surface-100 rounded w-full max-w-md mb-6" />
          <div className="grid grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => <div key={n} className="h-14 bg-surface-100 rounded-lg" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm py-20 text-center">
        <p className="text-sm text-surface-400">Could not load your profile.</p>
      </div>
    );
  }

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const netPay =
    (employee.basicSalary ?? 0) + (employee.hra ?? 0) + (employee.allowances ?? 0) - (employee.deductions ?? 0);

  // Documents: schema stores a JSON string; fall back to empty list.
  let documents: DocItem[] = [];
  if (employee.documents) {
    try {
      documents = JSON.parse(employee.documents as unknown as string) as DocItem[];
    } catch {
      documents = [];
    }
  }

  const salaryRows = [
    { label: "Base Pay", value: employee.basicSalary ?? 0 },
    { label: "Allowances", value: employee.allowances ?? 0 },
    { label: "Deductions", value: -(employee.deductions ?? 0), negative: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          {/* Photo */}
          <div
            className="relative w-[120px] h-[120px] shrink-0 cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar src={editing ? form.profilePicture : employee.profilePicture} name={fullName} size="lg" className="!w-[120px] !h-[120px] !text-3xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFilePick} />

          {/* Name + details */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-surface-900">{fullName}</h1>
            <p className="text-sm text-surface-500 mt-0.5">{employee.designation || "—"}</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
              <Detail label="Employee ID" value={<span className="font-mono">{employee.employeeId}</span>} />
              <Detail label="Department" value={employee.department} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 sm:self-start">
            {editing ? (
              <>
                <Button onClick={handleSave} loading={saving}>Save</Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </>
            ) : (
              <Button variant="secondary" onClick={startEdit}>Edit</Button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-surface-200 shadow-sm">
        <div className="border-b border-surface-200 px-6">
          <nav className="flex gap-6 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  activeTab === tab
                    ? "border-primary-700 text-surface-900 font-semibold"
                    : "border-transparent text-surface-500 hover:text-surface-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* PERSONAL DETAILS */}
          {activeTab === "Personal Details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              <ReadOnlyField label="Full Name" value={fullName} />
              <ReadOnlyField label="Email" value={employee.email ?? ""} />
              <ReadOnlyField label="Date of Birth" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""} />

              {editing ? (
                <>
                  <div>
                    <label className="block text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+91 ..."
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs text-surface-400 uppercase tracking-wide font-medium mb-1">Address</label>
                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Street, City, State, PIN"
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-primary-600 resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <ReadOnlyField label="Phone" value={employee.phone ?? ""} />
                  <ReadOnlyField label="Address" value={employee.address ?? ""} />
                </>
              )}
            </div>
          )}

          {/* JOB DETAILS */}
          {activeTab === "Job Details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              <Detail label="Role / Designation" value={employee.designation} />
              <Detail label="Department" value={employee.department} />
              <Detail label="Employment Type" value={employee.employmentType ? employee.employmentType.replace("_", "-") : null} />
              <Detail label="Joining Date" value={new Date(employee.dateOfJoining).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
              <div className="md:col-span-2">
                <p className="text-xs text-surface-400 uppercase tracking-wide font-medium mb-1.5">Reporting Manager</p>
                <div className="flex items-center gap-2.5">
                  <Avatar name="Rajesh Kumar" size="sm" />
                  <span className="text-sm font-medium text-surface-900">Rajesh Kumar</span>
                  <span className="text-xs text-surface-400">HR Manager</span>
                </div>
              </div>
            </div>
          )}

          {/* SALARY STRUCTURE */}
          {activeTab === "Salary Structure" && (
            <div className="max-w-xl">
              <table className="w-full text-sm">
                <tbody>
                  {salaryRows.map((row) => (
                    <tr key={row.label} className="border-b border-surface-100">
                      <td className={`py-3 ${row.negative ? "text-danger-text" : "text-surface-600"}`}>{row.label}</td>
                      <td className={`py-3 text-right font-mono ${row.negative ? "text-danger-text" : "text-surface-900"}`}>
                        {formatINR(row.value)}
                      </td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-surface-200">
                    <td className="pt-4 font-semibold text-surface-900">Net Pay</td>
                    <td className="pt-4 text-right font-mono font-bold text-lg text-success-text">{formatINR(netPay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* DOCUMENTS */}
          {activeTab === "Documents" && (
            <div className="max-w-3xl">
              {documents.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-300 mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-surface-400">No documents uploaded yet</p>
                  <p className="text-xs text-surface-300 mt-1">ID proofs and contracts shared by HR will appear here</p>
                </div>
              ) : (
                <ul>
                  {documents.map((doc, i) => (
                    <li key={i} className={`flex items-center gap-3 py-3.5 ${i < documents.length - 1 ? "border-b border-surface-100" : ""}`}>
                      <div className="w-9 h-9 rounded-lg bg-info-light text-info-text flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-surface-900 truncate">{doc.name}</p>
                        <p className="text-xs text-surface-400">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                      </div>
                      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-surface-400 hover:text-surface-700 hover:bg-surface-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
