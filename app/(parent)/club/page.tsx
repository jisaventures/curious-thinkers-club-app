import { DashboardView } from "@/components/club/dashboard-view";
import { loadDashboard } from "@/lib/club/data";
import { loadLeaderboard } from "@/lib/club/leaderboard-data";
import { globalBoardRows } from "@/lib/leaderboard";

export default async function ClubPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const [{ notice }, data, board] = await Promise.all([searchParams, loadDashboard(), loadLeaderboard()]);
  return <DashboardView data={data} notice={notice} leaderboard={globalBoardRows(board.people)} />;
}
