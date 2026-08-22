"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="text-2xl font-bold text-surface-900">Dayflow</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/signin" className="btn-cta !text-sm !py-2 !px-5 !my-0">
            Log in
          </Link>
          <Link href="/signup" className="btn-cta !text-sm !py-2 !px-5 !my-0">
            Sign up
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-8 pt-20 pb-32">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 text-xs font-semibold text-primary-700 bg-primary-100 rounded-full mb-6">
            HRMS for modern teams
          </span>
          <h1 className="text-5xl font-extrabold text-surface-900 leading-tight mb-6">
            Manage your workforce
            <br />
            <span className="text-primary-600">with clarity and ease</span>
          </h1>
          <p className="text-lg text-surface-500 max-w-2xl mx-auto mb-10">
            Dayflow streamlines attendance tracking, leave management, and payroll
            processing — so your HR team can focus on what matters.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="btn-cta">
              Get started free
            </Link>
            <Link href="/signin" className="btn-cta">
              Log in
            </Link>
          </div>
        </div>

        {/* CTA Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-surface-200">
          <div className="absolute inset-0 dot-pattern bg-surface-50 opacity-60" />
          <div className="absolute inset-0 grid-pattern" />
          <div className="relative z-10 text-center py-20 px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold text-surface-900 mb-4">
              Ready to simplify your HR workflow?
            </h2>
            <p className="text-surface-500 text-lg max-w-xl mx-auto mb-8">
              Join teams that trust Dayflow for attendance, leave, and payroll management.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/signup" className="btn-cta">
                Start for free
              </Link>
              <Link href="/signin" className="btn-cta">
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="text-center py-6 text-sm text-surface-400 border-t border-surface-100">
        Dayflow HRMS &mdash; Built for hackathons
      </footer>
    </div>
  );
}
