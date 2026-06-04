import DashboardShellNew from "@/components/shared/DashboardShellNew";
import { ToastProvider } from "@/components/ui/Toast";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <DashboardShellNew>{children}</DashboardShellNew>
    </ToastProvider>
  );
}
