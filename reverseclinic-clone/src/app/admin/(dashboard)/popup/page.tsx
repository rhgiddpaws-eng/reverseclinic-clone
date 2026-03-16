import { PopupAdminEditor } from "@/components/admin/popup-admin-editor";
import { listPopupBanners } from "@/lib/reverse-db";
import { requireAdminPageSession } from "@/lib/reverse-admin";

export default async function AdminPopupPage() {
  const { tenantId } = await requireAdminPageSession();
  const banners = listPopupBanners(tenantId);

  return <PopupAdminEditor initialBanners={banners} />;
}
