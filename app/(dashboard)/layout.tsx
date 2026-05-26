// import RouteGuard from "@/components/shared/RouteGuard";
// import DashboardShell from "@/components/shared/DashboardShell";

// export default function DashboardLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     // <RouteGuard>
//       <DashboardShell>{children}</DashboardShell>
//     // </RouteGuard>
//   );
// }

import DashboardShellNew from "@/components/shared/DashboardShellNew";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShellNew>{children}</DashboardShellNew>;
}
