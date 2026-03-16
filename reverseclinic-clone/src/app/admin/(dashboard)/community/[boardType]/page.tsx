import { notFound } from "next/navigation";
import { CommunityAdminEditor } from "@/components/admin/community-admin-editor";
import { parseCommunityBoardType } from "@/lib/reverse-community";
import { listCommunityItems } from "@/lib/reverse-db";
import { requireAdminPageSession } from "@/lib/reverse-admin";

type CommunityPageContext = {
  params: Promise<{
    boardType: string;
  }>;
};

export default async function AdminCommunityPage(context: CommunityPageContext) {
  const { boardType } = await context.params;
  const parsedBoardType = parseCommunityBoardType(boardType);
  if (!parsedBoardType) {
    notFound();
  }

  const { tenantId } = await requireAdminPageSession();
  const items = listCommunityItems(tenantId, parsedBoardType);

  return <CommunityAdminEditor boardType={parsedBoardType} initialItems={items} />;
}
