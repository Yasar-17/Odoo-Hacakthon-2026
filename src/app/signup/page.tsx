"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[!@#$%^&*]/.test(p), label: "One special character (!@#$%^&*)" },
];

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    employeeId: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!form.employeeId) errs.employeeId = "Employee ID is required";
    if (!form.email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format";
    if (!form.firstName) errs.firstName = "First name is required";
    if (!form.lastName) errs.lastName = "Last name is required";

    if (!form.password) errs.password = "Password is required";
    else {
      const failedRule = passwordRules.find((r) => !r.test(form.password));
      if (failedRule) errs.password = failedRule.label;
    }

    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: form.employeeId,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setApiError(data.error || "Signup failed");
        return;
      }

      router.push("/signin");
    } catch {
      setApiError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-surface-200 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-600 rounded-xl mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-surface-900">Dayflow</h1>
            <p className="text-surface-500 text-sm mt-1">Create your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {apiError}
              </div>
            )}

            <Input
              label="Employee ID"
              placeholder="EMP001"
              value={form.employeeId}
              onChange={(e) => update("employeeId", e.target.value)}
              error={errors.employeeId}
            />

            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="John"
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                error={errors.firstName}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                error={errors.lastName}
              />
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />

            {form.password && (
              <div className="space-y-1">
                {passwordRules.map((rule) => (
                  <p
                    key={rule.label}
                    className={`text-xs ${rule.test(form.password) ? "text-accent-600" : "text-surface-400"}`}
                  >
                    {rule.test(form.password) ? "✓" : "○"} {rule.label}
                  </p>
                ))}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full">
              Sign Up
            </Button>
          </form>

          <p className="text-center text-sm text-surface-500 mt-6">
            Already have an account?{" "}
            <Link href="/signin" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
