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
          <Link
            href="/signin"
            className="px-5 py-2 text-sm font-medium text-surface-700 hover:text-primary-600 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
          >
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
            <Link
              href="/signup"
              className="px-8 py-3 text-base font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/25"
            >
              Get started free
            </Link>
            <Link
              href="/signin"
              className="px-8 py-3 text-base font-semibold text-surface-700 bg-white border border-surface-300 rounded-lg hover:bg-surface-50 transition-colors"
            >
              Log in
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "Attendance",
              desc: "Daily and weekly tracking with check-in/check-out, live status, and admin overview.",
              icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
            },
            {
              title: "Leave Management",
              desc: "Employees apply, admins approve — all with status tracking and comments.",
              icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
            },
            {
              title: "Payroll",
              desc: "Structured salary breakdowns, editable by admins, read-only for employees.",
              icon: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl border border-surface-200 p-8 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-11 h-11 bg-primary-50 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-surface-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-surface-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-6 text-sm text-surface-400 border-t border-surface-100">
        Dayflow HRMS &mdash; Built for hackathons
      </footer>
    </div>
  );
}
