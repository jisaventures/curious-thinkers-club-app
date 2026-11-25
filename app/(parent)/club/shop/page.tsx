import Link from "next/link";
import { BookCover } from "@/components/club/book-cover";
import { Button } from "@/components/ui/button";
import { loadDashboard } from "@/lib/club/data";
import { shopUrl } from "@/lib/env";
import { formatPounds } from "@/lib/format";

export default async function ShopPage() {
  const data = await loadDashboard();
  const shop = shopUrl();
  const locked = data.packs.filter((pack) => !pack.owned);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/club" className="text-sm font-extrabold text-[#306A51] no-underline hover:underline">
            Back to club
          </Link>
          <h1 className="mt-2 font-display text-3xl text-[#17352A]">Shop quests</h1>
          <p className="mt-1 text-[#3d5348]">Quests you have not unlocked yet.</p>
        </div>
        <Button asChild variant="mustard" size="md">
          <a href={shop}>Open the shop</a>
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {locked.map((pack) => (
          <article id={pack.slug} key={pack.id} className="flex gap-4 rounded-[22px] bg-white p-4">
            <BookCover tone={pack.cover_tone} title={pack.title} locked />
            <div className="min-w-0">
              <h2 className="font-display text-xl text-[#17352A]">{pack.title}</h2>
              <p className="mt-1 text-sm text-[#5e7266]">{pack.blurb}</p>
              <p className="mt-2 text-sm font-bold text-[#306A51]">{formatPounds(pack.price_pence)}</p>
              <a href={shop} className="mt-2 inline-block text-sm font-extrabold text-[#306A51] underline">
                View in shop
              </a>
            </div>
          </article>
        ))}
        {locked.length === 0 && <p className="text-[#5e7266]">Every published quest is already on this account.</p>}
      </div>
    </div>
  );
}
