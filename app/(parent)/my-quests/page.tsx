import { MyPacksPage } from "@/components/club/my-packs-page";
import { loadDashboard } from "@/lib/club/data";

export default async function Page() {
  const data = await loadDashboard();
  return <MyPacksPage packs={data.home.ownedPacks} />;
}
