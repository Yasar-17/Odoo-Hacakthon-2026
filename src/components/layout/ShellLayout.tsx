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
        <main className="lg:ml-sidebar pt-[64px] p-4 md:p-6">
          <div className="animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
