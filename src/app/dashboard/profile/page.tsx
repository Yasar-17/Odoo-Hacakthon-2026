"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

interface EmployeeData {
  firstName: string; lastName: string; email?: string; employeeId?: string;
  department?: string | null; designation?: string | null; dateOfBirth?: string | null;
  dateOfJoining: string; employmentType?: string | null; phone?: string | null;
  address?: string | null; profilePicture?: string | null; basicSalary?: number | null;
  hra?: number | null; allowances?: number | null; deductions?: number | null;
}

interface DocumentItem {
  documentId: string;
  documentType: string;
  documentName: string;
  documentUrl: string;
  uploadedAt: string | null;
}

const tabs = ["Personal Details", "Job Details", "Salary Structure", "Documents"] as const;
type Tab = (typeof tabs)[number];

function formatINR(v: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v); }

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-label-md text-on-tertiary-container uppercase tracking-wider mb-1">{label}</p>
      <p className="text-body-sm font-semibold text-primary">{value || "—"}</p>
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-label-md uppercase tracking-wider text-secondary mb-2">{label}</label>
      <div className="px-4 py-3 bg-surface-container-low border border-border-light rounded text-body-sm text-on-surface-variant">{value || "—"}</div>
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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [docForm, setDocForm] = useState({ documentType: "ID_PROOF", documentName: "", documentUrl: "" });
  const [docSaving, setDocSaving] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setDocsLoading(true);
    try {
      const res = await fetch("/api/employees/documents");
      if (res.status === 401) { window.location.href = "/signin"; return; }
      const data = await res.json();
      if (data.success) setDocuments(data.data ?? []);
    } catch {
      setDocuments([]);
    }
    setDocsLoading(false);
  }, []);

  useEffect(() => {
    fetch("/api/employees").then((r) => r.json()).then((d) => { if (d.success) setEmployee(d.data); setLoading(false); }).catch(() => setLoading(false));
    fetchDocuments();
  }, [fetchDocuments]);

  const startEdit = () => { setForm({ phone: employee?.phone ?? "", address: employee?.address ?? "", profilePicture: employee?.profilePicture ?? "" }); setEditing(true); };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/employees", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (data.success) { setEmployee(data.data); setEditing(false); toast("success", "Profile updated successfully"); }
      else { toast("error", data.error ?? "Failed to update profile"); }
    } catch { toast("error", "Something went wrong"); }
    setSaving(false);
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (editing) { setForm((f) => ({ ...f, profilePicture: dataUrl })); }
      else {
        (async () => {
          setSaving(true);
          try {
            const res = await fetch("/api/employees", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profilePicture: dataUrl }) });
            const data = await res.json();
            if (data.success) { setEmployee(data.data); toast("success", "Profile photo updated"); }
            else { toast("error", data.error ?? "Upload failed"); }
          } catch { toast("error", "Upload failed"); }
          setSaving(false);
        })();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocForm((f) => ({ ...f, documentName: f.documentName || file.name, documentUrl: "" }));
    const reader = new FileReader();
    reader.onload = () => setDocForm((f) => ({ ...f, documentUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleAddDoc = async () => {
    if (!docForm.documentType.trim() || !docForm.documentName.trim() || !docForm.documentUrl.trim()) {
      toast("error", "Type, name and file/URL are required");
      return;
    }
    setDocSaving(true);
    try {
      const res = await fetch("/api/employees/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(docForm),
      });
      const data = await res.json();
      if (data.success) {
        toast("success", "Document added");
        setShowAddDoc(false);
        setDocForm({ documentType: docForm.documentType, documentName: "", documentUrl: "" });
        await fetchDocuments();
      } else {
        toast("error", data.error ?? "Failed to add document");
      }
    } catch {
      toast("error", "Something went wrong");
    }
    setDocSaving(false);
  };

  const handleDeleteDoc = async (documentId: string) => {
    try {
      const res = await fetch(`/api/employees/documents?documentId=${documentId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast("success", "Document deleted");
        await fetchDocuments();
      } else {
        toast("error", data.error ?? "Failed to delete document");
      }
    } catch {
      toast("error", "Something went wrong");
    }
  };

  if (loading) return <div className="bg-surface-pure rounded-xl border border-border-light p-6 animate-pulse h-96" />;
  if (!employee) return <EmptyState icon="person_off" title="Could not load your profile" description="Please try refreshing the page." />;

  const fullName = `${employee.firstName} ${employee.lastName}`;
  const netPay = (employee.basicSalary ?? 0) + (employee.hra ?? 0) + (employee.allowances ?? 0) - (employee.deductions ?? 0);
  const salaryRows = [
    { label: "Base Pay", value: employee.basicSalary ?? 0 },
    { label: "Allowances", value: employee.allowances ?? 0 },
    { label: "Deductions", value: -(employee.deductions ?? 0), negative: true },
  ];

  return (
    <div className="flex flex-col gap-gutter">
      <div className="bg-surface-pure rounded-xl p-container-padding ambient-shadow border border-surface-variant">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="relative w-[120px] h-[120px] shrink-0 cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
            <Avatar src={editing ? form.profilePicture : employee.profilePicture} name={fullName} size="lg" className="!w-[120px] !h-[120px] !text-3xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Icon name="photo_camera" className="text-[32px] text-white" />
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFilePick} />
          <div className="flex-1 min-w-0">
            <h1 className="font-headline text-headline-lg text-primary">{fullName}</h1>
            <p className="text-body-lg text-secondary mt-1">{employee.designation || "—"}</p>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4">
              <Detail label="Employee ID" value={<span className="font-mono">{employee.employeeId}</span>} />
              <Detail label="Department" value={employee.department} />
            </div>
          </div>
          <div className="flex gap-2 sm:self-start">
            {editing ? (<><Button arrow onClick={handleSave} loading={saving}>Save</Button><Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></>) : (<Button variant="secondary" onClick={startEdit}>Edit</Button>)}
          </div>
        </div>
      </div>

      <div className="bg-surface-pure rounded-xl border border-border-light ambient-shadow">
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
          {activeTab === "Personal Details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              <ReadOnlyField label="Full Name" value={fullName} />
              <ReadOnlyField label="Email" value={employee.email ?? ""} />
              <ReadOnlyField label="Date of Birth" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""} />
              {editing ? (
                <>
                  <Input type="tel" label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 ..." />
                  <div className="md:col-span-2">
                    <label className="block text-label-md uppercase tracking-wider text-secondary mb-2">Address</label>
                    <textarea rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, City, State, PIN"
                      className="w-full bg-surface-pure border border-border-light px-4 py-3 rounded font-body-md text-body-md text-primary resize-none focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                  </div>
                </>
              ) : (<><ReadOnlyField label="Phone" value={employee.phone ?? ""} /><ReadOnlyField label="Address" value={employee.address ?? ""} /></>)}
            </div>
          )}
          {activeTab === "Job Details" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
              <Detail label="Role / Designation" value={employee.designation} />
              <Detail label="Department" value={employee.department} />
              <Detail label="Employment Type" value={employee.employmentType ? employee.employmentType.replace("_", "-") : null} />
              <Detail label="Joining Date" value={new Date(employee.dateOfJoining).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} />
              <div className="md:col-span-2">
                <p className="text-label-md text-on-tertiary-container uppercase tracking-wider mb-1.5">Reporting Manager</p>
                <div className="flex items-center gap-2.5">
                  <Avatar name="Rajesh Kumar" size="sm" />
                  <span className="text-body-sm font-semibold text-primary">Rajesh Kumar</span>
                  <span className="text-label-md text-secondary uppercase">HR Manager</span>
                </div>
              </div>
            </div>
          )}
          {activeTab === "Salary Structure" && (
            <div className="max-w-xl">
              <table className="w-full text-left">
                <tbody>
                  {salaryRows.map((row) => (
                    <tr key={row.label} className="border-b border-border-light">
                      <td className={`py-3 ${row.negative ? "text-danger-text" : "text-on-surface-variant"}`}>{row.label}</td>
                      <td className={`py-3 text-right font-mono ${row.negative ? "text-danger-text" : "text-primary"}`}>{formatINR(row.value)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-border-bold">
                    <td className="pt-4 font-headline font-semibold text-primary">Net Pay</td>
                    <td className="pt-4 text-right font-headline font-bold text-headline-md text-primary">{formatINR(netPay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
          {activeTab === "Documents" && (
            <div className="max-w-3xl">
              <div className="flex justify-end mb-4">
                <Button size="sm" onClick={() => setShowAddDoc(true)}>
                  <Icon name="upload_file" className="text-[18px]" /> Add Document
                </Button>
              </div>
              {docsLoading ? (
                <div className="py-10 text-center text-body-sm text-secondary animate-pulse">Loading documents…</div>
              ) : documents.length === 0 ? (
                <EmptyState icon="folder" title="No documents uploaded yet" description="ID proofs and contracts shared by HR will appear here." />
              ) : (
                <ul>
                  {documents.map((doc, i) => (
                    <li key={doc.documentId} className={`flex items-center gap-3 py-3.5 ${i < documents.length - 1 ? "border-b border-border-light" : ""}`}>
                      <div className="w-9 h-9 rounded-lg bg-surface-container-low text-primary flex items-center justify-center shrink-0">
                        <Icon name="description" className="text-[20px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-md font-medium text-primary truncate">{doc.documentName}</p>
                        <p className="text-label-md text-on-surface-variant">
                          {doc.documentType}
                          {doc.uploadedAt ? ` · Uploaded ${new Date(doc.uploadedAt).toLocaleDateString()}` : ""}
                        </p>
                      </div>
                      {doc.documentUrl && !doc.documentUrl.startsWith("data:") && (
                        <a href={doc.documentUrl} target="_blank" rel="noreferrer" title="Download"
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-surface-container-low transition-colors">
                          <Icon name="download" className="text-[18px]" />
                        </a>
                      )}
                      <button onClick={() => handleDeleteDoc(doc.documentId)} title="Delete"
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-secondary hover:text-error hover:bg-surface-container-low transition-colors">
                        <Icon name="delete" className="text-[18px]" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showAddDoc} onClose={() => setShowAddDoc(false)} title="Add Document"
        footer={<><Button variant="ghost" onClick={() => setShowAddDoc(false)}>Cancel</Button><Button arrow onClick={handleAddDoc} loading={docSaving}>Add</Button></>}>
        <div className="space-y-4">
          <Input label="Document Type" value={docForm.documentType} onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })} placeholder="ID_PROOF, CONTRACT…" />
          <Input label="Document Name" value={docForm.documentName} onChange={(e) => setDocForm({ ...docForm, documentName: e.target.value })} placeholder="passport.pdf" />
          <div>
            <label className="block text-label-md uppercase tracking-wider text-secondary mb-2">File or URL</label>
            <input type="file" onChange={handleDocFilePick}
              className="w-full text-body-sm text-secondary file:mr-3 file:px-4 file:py-2 file:rounded file:border-0 file:bg-surface-container-low file:text-primary file:cursor-pointer" />
            {!docForm.documentUrl && (
              <input type="url" value={docForm.documentUrl} onChange={(e) => setDocForm({ ...docForm, documentUrl: e.target.value })}
                placeholder="or paste a document URL"
                className="mt-2 w-full bg-surface-pure border border-border-light px-4 py-2.5 rounded text-body-sm text-primary focus:outline-none focus:border-primary transition-colors" />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
