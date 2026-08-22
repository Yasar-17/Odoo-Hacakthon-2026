"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "signin" | "signup";

const passwordRules = [
  { test: (p: string) => p.length >= 8, label: "At least 8 characters" },
  { test: (p: string) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p: string) => /[0-9]/.test(p), label: "One number" },
  { test: (p: string) => /[!@#$%^&*]/.test(p), label: "One symbol (!@#$%^&*)" },
];

export default function AuthScreen({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [transitioning, setTransitioning] = useState(false);
  const [visibleMode, setVisibleMode] = useState<Mode>(initialMode);

  const switchMode = (newMode: Mode) => {
    if (newMode === mode) return;
    setTransitioning(true);
    setTimeout(() => {
      setMode(newMode);
      setVisibleMode(newMode);
      setTransitioning(false);
    }, 200);
  };

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  const [signUpForm, setSignUpForm] = useState({
    employeeId: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "EMPLOYEE",
  });
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [signUpApiError, setSignUpApiError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  const updateSignUp = (field: string, value: string) => {
    setSignUpForm((prev) => ({ ...prev, [field]: value }));
    setSignUpErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateSignUp = () => {
    const errs: Record<string, string> = {};
    if (!signUpForm.employeeId) errs.employeeId = "Required";
    if (!signUpForm.email) errs.email = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpForm.email)) errs.email = "Invalid email";
    if (!signUpForm.password) errs.password = "Required";
    else {
      const fail = passwordRules.find((r) => !r.test(signUpForm.password));
      if (fail) errs.password = fail.label;
    }
    if (!signUpForm.confirmPassword) errs.confirmPassword = "Required";
    else if (signUpForm.password !== signUpForm.confirmPassword) errs.confirmPassword = "No match";
    setSignUpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError("");
    if (!signInEmail || !signInPassword) {
      setSignInError("Please fill in all fields");
      return;
    }
    setSignInLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      const data = await res.json();
      if (!data.success) {
        setSignInError(data.error || "Invalid credentials");
        return;
      }
      router.push(data.data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch {
      setSignInError("Something went wrong. Please try again.");
    } finally {
      setSignInLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpApiError("");
    if (!validateSignUp()) return;
    setSignUpLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: signUpForm.employeeId,
          email: signUpForm.email,
          password: signUpForm.password,
          role: signUpForm.role,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setSignUpApiError(data.error || "Signup failed");
        return;
      }
      setTransitioning(true);
      setTimeout(() => {
        setMode("signin");
        setVisibleMode("signin");
        setSignInEmail(signUpForm.email);
        setTransitioning(false);
      }, 200);
    } catch {
      setSignUpApiError("Something went wrong. Please try again.");
    } finally {
      setSignUpLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel */}
      <div className="relative w-[45%] bg-[#0a0a0a] flex flex-col justify-between p-10 overflow-hidden">
        {/* Geometric pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="geo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M0 20 L20 0 L40 20 L20 40Z" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo)" />
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <span className="text-xl font-bold text-white">Dayflow</span>
        </div>

        {/* Quote */}
        <div className="relative z-10 my-auto">
          <svg className="w-10 h-10 text-surface-600 mb-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z" />
          </svg>
          <p className="text-[32px] leading-snug font-semibold text-white mb-6">
            Dayflow tracks every check-in, flags every leave conflict, and keeps payroll{" "}
            <span className="text-surface-500">accurate without the back-and-forth.</span>
          </p>
          <p className="font-mono text-xs uppercase tracking-wider text-surface-500">
            HR Officer &bull; Enterprise Team
          </p>
        </div>

        {/* Stats */}
        <div className="relative z-10">
          <p className="font-mono text-xs text-surface-600">
            500+ employees managed &bull; 50+ companies &bull; 99% attendance accuracy
          </p>
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-[55%] bg-[#f8f8f8] flex items-center justify-center p-10">
        <div className="w-full max-w-[420px]">
          {/* Tab Toggle */}
          <div className="flex bg-surface-200 rounded-lg p-1 mb-10">
            <button
              onClick={() => switchMode("signin")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                mode === "signin"
                  ? "bg-white text-surface-900 shadow-sm"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all ${
                mode === "signup"
                  ? "bg-white text-surface-900 shadow-sm"
                  : "text-surface-500 hover:text-surface-700"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Forms with transition */}
          <div
            className={`transition-all duration-200 ease-in-out ${
              transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
            }`}
          >
            {/* Sign In Form */}
            {visibleMode === "signin" && (
            <div>
              <h1 className="text-2xl font-bold text-surface-900 mb-1">Welcome back</h1>
              <p className="text-surface-500 text-sm mb-8">Sign in to your account</p>

              <form onSubmit={handleSignIn} className="space-y-5">
                {signInError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {signInError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={signInEmail}
                      onChange={(e) => { setSignInEmail(e.target.value); setSignInError(""); }}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900 transition-colors bg-white ${
                        signInError ? "border-red-300" : "border-surface-300"
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-surface-700">Password</label>
                    <button type="button" className="text-xs text-surface-500 hover:text-surface-700">Forgot?</button>
                  </div>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => { setSignInPassword(e.target.value); setSignInError(""); }}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900 transition-colors bg-white ${
                        signInError ? "border-red-300" : "border-surface-300"
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signInLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-colors"
                >
                  {signInLoading ? "Signing in..." : "Sign In"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>

              <p className="text-center text-sm text-surface-500 mt-8">
                Don&apos;t have an account?{" "}
                <button onClick={() => switchMode("signup")} className="text-surface-900 font-semibold hover:underline">
                  Sign up
                </button>
              </p>
            </div>
          )}

          {/* Sign Up Form */}
          {visibleMode === "signup" && (
            <div>
              <h1 className="text-2xl font-bold text-surface-900 mb-1">Create your account</h1>
              <p className="text-surface-500 text-sm mb-8">Get started with Dayflow</p>

              <form onSubmit={handleSignUp} className="space-y-5">
                {signUpApiError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                    {signUpApiError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    placeholder="EMP001"
                    value={signUpForm.employeeId}
                    onChange={(e) => updateSignUp("employeeId", e.target.value)}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900 transition-colors bg-white ${
                      signUpErrors.employeeId ? "border-red-300" : "border-surface-300"
                    }`}
                  />
                  {signUpErrors.employeeId && <p className="text-xs text-red-600 mt-1">{signUpErrors.employeeId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      value={signUpForm.email}
                      onChange={(e) => updateSignUp("email", e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900 transition-colors bg-white ${
                        signUpErrors.email ? "border-red-300" : "border-surface-300"
                      }`}
                    />
                  </div>
                  <p className="text-xs text-surface-400 mt-1">Verification email will be sent</p>
                  {signUpErrors.email && <p className="text-xs text-red-600 mt-1">{signUpErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Password</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      placeholder="Create a password"
                      value={signUpForm.password}
                      onChange={(e) => updateSignUp("password", e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900 transition-colors bg-white ${
                        signUpErrors.password ? "border-red-300" : "border-surface-300"
                      }`}
                    />
                  </div>
                  {signUpErrors.password && <p className="text-xs text-red-600 mt-1">{signUpErrors.password}</p>}
                  {signUpForm.password && (
                    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                      {passwordRules.map((rule) => (
                        <p key={rule.label} className={`text-xs ${rule.test(signUpForm.password) ? "text-accent-600" : "text-surface-400"}`}>
                          {rule.test(signUpForm.password) ? "✓" : "○"} {rule.label}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpForm.confirmPassword}
                      onChange={(e) => updateSignUp("confirmPassword", e.target.value)}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-surface-900 focus:border-surface-900 transition-colors bg-white ${
                        signUpErrors.confirmPassword ? "border-red-300" : "border-surface-300"
                      }`}
                    />
                  </div>
                  {signUpErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{signUpErrors.confirmPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1.5">Role</label>
                  <div className="flex gap-3">
                    {["EMPLOYEE", "ADMIN"].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => updateSignUp("role", r)}
                        className={`flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                          signUpForm.role === r
                            ? "bg-surface-900 text-white border-surface-900"
                            : "bg-white text-surface-600 border-surface-300 hover:border-surface-400"
                        }`}
                      >
                        {r === "ADMIN" ? "HR / Admin" : "Employee"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signUpLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-surface-900 text-white rounded-lg text-sm font-medium hover:bg-surface-800 disabled:opacity-50 transition-colors"
                >
                  {signUpLoading ? "Creating account..." : "Sign Up"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>

              <p className="text-center text-sm text-surface-500 mt-8">
                Already have an account?{" "}
                <button onClick={() => switchMode("signin")} className="text-surface-900 font-semibold hover:underline">
                  Sign in
                </button>
              </p>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
