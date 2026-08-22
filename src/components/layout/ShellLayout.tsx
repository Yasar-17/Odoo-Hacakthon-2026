"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { ToastProvider } from "@/components/ui/Toast";

export default function ShellLayout({ children, isAdmin = false }: { children: React.ReactNode; isAdmin?: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ToastProvider>
      <div className="min-h-screen bg-background">
        <Sidebar isAdmin={isAdmin} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <TopBar onHamburgerClick={() => setMobileOpen(true)} isAdmin={isAdmin} />
        <main className="lg:ml-sidebar min-w-0">
          <div className="max-w-[1440px] mx-auto px-margin-mobile md:px-gutter lg:px-container-padding py-stack-md lg:py-section-gap flex flex-col gap-section-gap">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}
