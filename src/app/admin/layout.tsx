"use client";

import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar />
      <div className="flex">
        <Sidebar isAdmin />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
