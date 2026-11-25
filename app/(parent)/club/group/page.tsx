import { GroupView } from "@/components/club/group-view";
import { loadDashboard } from "@/lib/club/data";

export default async function GroupPage() {
  const data = await loadDashboard();
  return <GroupView data={data} />;
}
