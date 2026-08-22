"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface-900 text-white">
      <nav className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">D</span>
          </div>
          <span className="text-2xl font-bold text-white">Dayflow</span>
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

      <main className="max-w-5xl mx-auto px-8 pt-16 pb-24">
        <section className="relative overflow-hidden rounded-2xl border border-surface-700 mb-8">
          <div className="absolute inset-0 dot-pattern opacity-20" />
          <div className="absolute inset-0 grid-pattern opacity-30" />
          <div className="relative z-10 text-center py-24 px-8">
            <span className="inline-block px-4 py-1.5 text-xs font-semibold text-primary-400 bg-primary-900/40 rounded-full mb-6 border border-primary-700/40">
              HRMS for modern teams
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6">
              Manage your workforce
              <br />
              <span className="text-primary-400">with clarity and ease</span>
            </h1>
            <p className="text-lg text-surface-400 max-w-2xl mx-auto mb-10">
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
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-surface-700">
          <div className="absolute inset-0 noise-bg bg-surface-800" />
          <div className="absolute inset-0 dot-pattern opacity-10" />
          <div className="relative z-10 text-center py-20 px-8">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Ready to simplify your HR workflow?
            </h2>
            <p className="text-surface-400 text-lg max-w-xl mx-auto mb-8">
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

      <footer className="text-center py-6 text-sm text-surface-500 border-t border-surface-800">
        Dayflow HRMS &mdash; Built for hackathons
      </footer>
    </div>
  );
}
