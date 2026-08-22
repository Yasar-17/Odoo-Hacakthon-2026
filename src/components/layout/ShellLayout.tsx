"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { ToastProvider } from "@/components/ui/Toast";

export default function ShellLayout({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-surface-50">
        <Sidebar isAdmin={isAdmin} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <TopBar onHamburgerClick={() => setMobileOpen(true)} />
        <main className="lg:ml-sidebar p-4 md:p-page-desktop min-w-0">
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}
