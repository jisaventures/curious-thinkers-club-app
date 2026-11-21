import Link from "next/link";
import { CopyCode } from "@/components/club/share-work";
import { Avatar } from "@/components/brand/avatar";
import { loadDashboard } from "@/lib/club/data";
import { formatMonth, ordinal, shortName } from "@/lib/format";

export default async function RewardsPage() {
  const data = await loadDashboard();
  const month = formatMonth();
  const focus = data.focus;
  const points = focus ? (data.pointsByChild[focus.id] ?? data.points) : data.points;
  return (
    <div className="space-y-6">
      <div>
        <Link href="/club" className="text-sm font-extrabold text-[#306A51] no-underline hover:underline">
          Back to club
        </Link>
        <h1 className="mt-2 font-display text-3xl text-[#17352A]">Rewards</h1>
        <p className="mt-1 text-[#3d5348]">Points, prizes and shop codes live here, away from the everyday club page.</p>
      </div>
      <section className="rounded-[24px] bg-[#1b4332] p-5 text-white">
        <p className="text-sm font-bold text-[#d7eccf]">{focus ? `${shortName(focus.nickname)}'s points` : "Points"}</p>
        <p className="font-display text-5xl text-[#f5c542]">{points}</p>
        <p className="text-sm">Level {data.level.current.name}</p>
        {data.level.next && (
          <p className="mt-2 text-sm text-[#d7eccf]">
            {data.level.toGo} points to {data.level.next.name}
          </p>
        )}
      </section>
      <section className="rounded-[24px] bg-white p-5">
        <h2 className="font-display text-2xl text-[#17352A]">This month&apos;s leaderboard</h2>
        <p className="text-sm text-[#5e7266]">{month}</p>
        <ol className="mt-3 space-y-2">
          {data.leaderboard.slice(0, 8).map((row) => (
            <li key={`${row.rank}-${row.nickname}`} className="flex items-center gap-3">
              <Avatar avatar={row.avatar_key} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-[#17352A]">{row.nickname}</p>
                <p className="text-xs text-[#5e7266]">Age {row.age_years}</p>
              </div>
              <p className="font-display text-lg">{row.points}</p>
              <p className="w-8 text-right text-sm text-[#5e7266]">{ordinal(row.rank)}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="rounded-[24px] bg-white p-5">
        <h2 className="font-display text-2xl text-[#17352A]">Prizes</h2>
        <ul className="mt-3 space-y-2 text-sm text-[#3d5348]">
          {data.prizes.map((prize) => (
            <li key={prize.id}>
              <span className="font-bold text-[#17352A]">{prize.title}</span>
              <span className="block text-[#5e7266]">{prize.detail}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-[24px] bg-[#fff6dc] p-5">
        <h2 className="font-display text-2xl text-[#17352A]">Shop codes</h2>
        {data.unlockedReward ? (
          <div className="mt-3">
            <p className="font-bold text-[#17352A]">{data.unlockedReward.headline}</p>
            <p className="mt-1 text-sm text-[#5e7266]">{data.unlockedReward.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <p className="rounded-xl border border-dashed border-[#e0c56a] bg-white px-3 py-2 font-display tracking-widest">{data.unlockedReward.code}</p>
              <CopyCode code={data.unlockedReward.code} />
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-[#5e7266]">
            {data.nextReward ? `${data.nextReward.min_points - points} points until the next code.` : "Codes appear here when a reward is reached."}
          </p>
        )}
      </section>
    </div>
  );
}
