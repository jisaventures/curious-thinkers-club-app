import { LeaderboardView } from "@/components/club/leaderboard-view";
import { loadLeaderboard } from "@/lib/club/leaderboard-data";

export default async function LeaderboardPage() {
  const data = await loadLeaderboard();
  return <LeaderboardView data={data} />;
}
