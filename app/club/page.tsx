import { DashboardView } from "@/components/club/dashboard-view";
import { loadDashboard } from "@/lib/club/data";

export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const data = await loadDashboard();
  const { notice } = await searchParams;
  return <DashboardView data={data} notice={notice} />;
}
