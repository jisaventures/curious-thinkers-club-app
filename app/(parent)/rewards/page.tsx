import Link from "next/link";

export default function RewardsPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/club" className="text-sm font-extrabold text-[#306A51] no-underline hover:underline">
        Back to dashboard
      </Link>
      <h1 className="font-display text-3xl text-[#17352A]">Rewards</h1>
      <p className="text-[#3d5348]">Rewards are on the way. This page is a placeholder until the rewards area is ready.</p>
    </div>
  );
}
