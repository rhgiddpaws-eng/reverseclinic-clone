import { AdminAccountSettings } from "@/components/admin/admin-account-settings";
import { requireAdminPageSession } from "@/lib/reverse-admin";

export default async function AdminSettingsPage() {
  const { user } = await requireAdminPageSession();

  return <AdminAccountSettings currentUser={user} />;
}
