import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminPageSession } from "@/lib/reverse-admin";

export default async function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await requireAdminPageSession();

  return <AdminShell user={user}>{children}</AdminShell>;
}
