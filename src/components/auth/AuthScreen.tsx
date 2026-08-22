"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";

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

  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  const [signInError, setSignInError] = useState("");
  const [signInLoading, setSignInLoading] = useState(false);

  const [signUpForm, setSignUpForm] = useState({
    employeeId: "", email: "", password: "", confirmPassword: "",
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
    if (!signInEmail || !signInPassword) { setSignInError("Please fill in all fields"); return; }
    setSignInLoading(true);
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: signInEmail, password: signInPassword }),
      });
      const data = await res.json();
      if (!data.success) { setSignInError(data.error || "Invalid credentials"); return; }
      router.push(data.data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch { setSignInError("Something went wrong. Please try again."); }
    finally { setSignInLoading(false); }
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
        body: JSON.stringify({ employeeId: signUpForm.employeeId, email: signUpForm.email, password: signUpForm.password }),
      });
      const data = await res.json();
      if (!data.success) { setSignUpApiError(data.error || "Signup failed"); return; }
      setMode("signin"); setSignInEmail(signUpForm.email);
    } catch { setSignUpApiError("Something went wrong. Please try again."); }
    finally { setSignUpLoading(false); }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden lg:flex w-[45%] bg-[#0a0a0a] flex-col justify-between p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }} />
        <div className="relative z-10 flex items-center gap-2.5 animate-fade-in">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-black font-bold text-base font-headline">D</span>
          </div>
          <span className="text-xl font-bold text-white font-headline">Dayflow</span>
        </div>
        <div className="relative z-10 my-auto animate-fade-in-up">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
            <Icon name="format_quote" filled className="text-[24px] text-white/60" />
          </div>
          <p className="text-[34px] leading-[1.3] font-semibold text-white mb-6 font-headline tracking-tight">
            Track every check-in, flag every conflict, and keep payroll{" "}
            <span className="text-white/50">accurate without the back-and-forth.</span>
          </p>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-white/40">HR Officer &bull; Enterprise Team</p>
        </div>
        <div className="relative z-10 flex gap-8 animate-fade-in">
          {[{value:"500+",label:"Employees"},{value:"50+",label:"Companies"},{value:"99%",label:"Accuracy"}].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold text-white font-headline">{s.value}</p>
              <p className="text-xs uppercase tracking-wider text-white/40 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-[#f8f8f8] flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[420px] animate-fade-in-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-base font-headline">D</span>
            </div>
            <span className="text-xl font-bold text-black font-headline">Dayflow</span>
          </div>

          <div className="flex bg-surface-container-low rounded-xl p-1 mb-8">
            <button onClick={() => setMode("signin")} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode==="signin"?"bg-white text-primary shadow-sm":"text-secondary hover:text-primary"}`}>Sign In</button>
            <button onClick={() => setMode("signup")} className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode==="signup"?"bg-white text-primary shadow-sm":"text-secondary hover:text-primary"}`}>Sign Up</button>
          </div>

          {mode === "signin" && (
            <div>
              <h1 className="text-[28px] font-bold text-primary font-headline tracking-tight mb-1">Welcome back</h1>
              <p className="text-secondary text-sm mb-8">Sign in to your account</p>
              <form onSubmit={handleSignIn} className="space-y-5">
                {signInError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 animate-scale-in">
                    <Icon name="error" filled className="text-[18px] shrink-0" />{signInError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Email</label>
                  <div className="relative">
                    <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none" />
                    <input type="email" placeholder="you@company.com" value={signInEmail} onChange={(e)=>{setSignInEmail(e.target.value);setSignInError("");}} className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white ${signInError?"border-red-300":"border-border-light"}`} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-medium text-secondary">Password</label>
                    <button type="button" className="text-xs text-secondary hover:text-primary transition-colors">Forgot?</button>
                  </div>
                  <div className="relative">
                    <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none" />
                    <input type="password" placeholder="Enter your password" value={signInPassword} onChange={(e)=>{setSignInPassword(e.target.value);setSignInError("");}} className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white ${signInError?"border-red-300":"border-border-light"}`} />
                  </div>
                </div>
                <button type="submit" disabled={signInLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm hover:shadow-md">
                  {signInLoading?"Signing in...":"Sign In"}{!signInLoading&&<Icon name="arrow_forward" className="text-[18px]" />}
                </button>
              </form>
              <p className="text-center text-sm text-secondary mt-8">Don&apos;t have an account? <button onClick={()=>setMode("signup")} className="text-primary font-semibold hover:underline">Sign up</button></p>
            </div>
          )}

          {mode === "signup" && (
            <div>
              <h1 className="text-[28px] font-bold text-primary font-headline tracking-tight mb-1">Create your account</h1>
              <p className="text-secondary text-sm mb-8">Get started with Dayflow</p>
              <form onSubmit={handleSignUp} className="space-y-5">
                {signUpApiError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 animate-scale-in">
                    <Icon name="error" filled className="text-[18px] shrink-0" />{signUpApiError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Employee ID</label>
                  <div className="relative">
                    <Icon name="badge" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none" />
                    <input type="text" placeholder="EMP001" value={signUpForm.employeeId} onChange={(e)=>updateSignUp("employeeId",e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white ${signUpErrors.employeeId?"border-red-300":"border-border-light"}`} />
                  </div>
                  {signUpErrors.employeeId && <p className="text-xs text-red-600 mt-1">{signUpErrors.employeeId}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Email</label>
                  <div className="relative">
                    <Icon name="mail" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none" />
                    <input type="email" placeholder="you@company.com" value={signUpForm.email} onChange={(e)=>updateSignUp("email",e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white ${signUpErrors.email?"border-red-300":"border-border-light"}`} />
                  </div>
                  {signUpErrors.email && <p className="text-xs text-red-600 mt-1">{signUpErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Password</label>
                  <div className="relative">
                    <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none" />
                    <input type="password" placeholder="Create a password" value={signUpForm.password} onChange={(e)=>updateSignUp("password",e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white ${signUpErrors.password?"border-red-300":"border-border-light"}`} />
                  </div>
                  {signUpErrors.password && <p className="text-xs text-red-600 mt-1">{signUpErrors.password}</p>}
                  {signUpForm.password && (
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                      {passwordRules.map((rule) => (
                        <p key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.test(signUpForm.password) ? "text-success-text" : "text-on-tertiary-container"}`}>
                          <Icon name={rule.test(signUpForm.password) ? "check_circle" : "radio_button_unchecked"} filled={rule.test(signUpForm.password)} className="text-[14px]" />
                          {rule.label}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Icon name="lock" className="absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline pointer-events-none" />
                    <input type="password" placeholder="Confirm your password" value={signUpForm.confirmPassword} onChange={(e)=>updateSignUp("confirmPassword",e.target.value)} className={`w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all bg-white ${signUpErrors.confirmPassword?"border-red-300":"border-border-light"}`} />
                  </div>
                  {signUpErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{signUpErrors.confirmPassword}</p>}
                </div>
                <button type="submit" disabled={signUpLoading} className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-container disabled:opacity-50 transition-all active:scale-[0.98] shadow-sm hover:shadow-md">
                  {signUpLoading?"Creating account...":"Sign Up"}{!signUpLoading&&<Icon name="arrow_forward" className="text-[18px]" />}
                </button>
              </form>
              <p className="text-center text-sm text-secondary mt-8">Already have an account? <button onClick={()=>setMode("signin")} className="text-primary font-semibold hover:underline">Sign in</button></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
