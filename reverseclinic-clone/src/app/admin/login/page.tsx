import { redirect } from "next/navigation";
import { AdminLoginPage } from "@/components/admin/admin-login-page";
import { getAdminPageSession } from "@/lib/reverse-admin";

export default async function AdminLoginRoute() {
  const { user } = await getAdminPageSession();
  if (user) {
    redirect("/admin");
  }

  return <AdminLoginPage />;
}
