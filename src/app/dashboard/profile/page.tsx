"use client";

import { useEffect, useState } from "react";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ProfilePage() {
  const [employee, setEmployee] = useState<Record<string, unknown> | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ address: "", phone: "", profilePicture: "" });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/employees")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setEmployee(d.data);
          setForm({
            address: d.data.address || "",
            phone: d.data.phone || "",
            profilePicture: d.data.profilePicture || "",
          });
        }
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setEmployee(data.data);
        setEditing(false);
        setMessage("Profile updated successfully");
      } else {
        setMessage(data.error || "Failed to update");
      }
    } catch {
      setMessage("Failed to update profile");
    }
    setSaving(false);
  };

  if (!employee) {
    return <div className="animate-spin w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mt-20" />;
  }

  const user = employee.user as Record<string, unknown> | undefined;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-surface-900">My Profile</h1>
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button>
        )}
      </div>

      {message && (
        <div className={`p-3 rounded-lg text-sm ${message.includes("success") ? "bg-accent-50 text-accent-700" : "bg-red-50 text-red-700"}`}>
          {message}
        </div>
      )}

      <Card>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Personal Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-500">First Name</label>
            <p className="text-surface-900">{employee.firstName as string}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-500">Last Name</label>
            <p className="text-surface-900">{employee.lastName as string}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-500">Email</label>
            <p className="text-surface-900">{user?.email as string}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-500">Employee ID</label>
            <p className="text-surface-900">{user?.employeeId as string}</p>
          </div>
          <div className="col-span-2">
            {editing ? (
              <Input
                label="Phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            ) : (
              <>
                <label className="block text-sm font-medium text-surface-500">Phone</label>
                <p className="text-surface-900">{(employee.phone as string) || "-"}</p>
              </>
            )}
          </div>
          <div className="col-span-2">
            {editing ? (
              <Input
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            ) : (
              <>
                <label className="block text-sm font-medium text-surface-500">Address</label>
                <p className="text-surface-900">{(employee.address as string) || "-"}</p>
              </>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Job Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-500">Department</label>
            <p className="text-surface-900">{(employee.department as string) || "-"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-500">Designation</label>
            <p className="text-surface-900">{(employee.designation as string) || "-"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-500">Employment Type</label>
            <p className="text-surface-900">{(employee.employmentType as string) || "-"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-500">Date of Joining</label>
            <p className="text-surface-900">{new Date(employee.dateOfJoining as string).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {editing && (
        <div className="flex gap-3">
          <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      )}
    </div>
  );
}
