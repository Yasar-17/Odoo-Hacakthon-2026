import ShellLayout from "@/components/layout/ShellLayout";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ShellLayout isAdmin>{children}</ShellLayout>;
}
