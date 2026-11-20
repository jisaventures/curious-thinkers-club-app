import { savePrize, saveReward } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoRewards } from "@/lib/demo/view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default async function RewardsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const { codes, prizes } = isDemoMode()
    ? demoRewards()
    : await (async () => {
        const [{ data: codeRows }, { data: prizeRows }] = await Promise.all([
          supabase.from("reward_codes").select("*").order("min_points"),
          supabase.from("prizes").select("*").order("sort_order"),
        ]);
        return { codes: codeRows ?? [], prizes: prizeRows ?? [] };
      })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl text-[#1e4d3a]">Rewards</h1>
        <p className="text-sm text-[#5e7266]">
          These codes are placeholders for the shop. They are not live Shopify discounts until Josh creates the matching codes there.
        </p>
        {query.error && <p className="mt-2 text-sm font-bold text-[#8a4b3a]">{query.error}</p>}
        {query.saved && <p className="mt-2 text-sm font-bold text-[#1e4d3a]">Saved.</p>}
      </div>
      <div className="grid gap-3">
        {codes.map((code) => (
          <form key={code.id} action={saveReward} className="grid gap-2 rounded-[22px] bg-white p-4 sm:grid-cols-2">
            <input type="hidden" name="rewardId" value={code.id} />
            <Input name="code" defaultValue={code.code} required />
            <Input name="minPoints" type="number" defaultValue={code.min_points} required />
            <Input name="headline" defaultValue={code.headline} required className="sm:col-span-2" />
            <Textarea name="description" defaultValue={code.description} required className="sm:col-span-2" />
            <label className="flex items-center gap-2 text-sm font-bold">
              <input type="checkbox" name="active" defaultChecked={code.active} className="size-5 accent-[#1e4d3a]" />
              Active
            </label>
            <Button type="submit" size="sm">Save code</Button>
          </form>
        ))}
      </div>
      <form action={saveReward} className="grid gap-2 rounded-[22px] border border-dashed border-[#e0d2ba] p-4 sm:grid-cols-2">
        <h2 className="font-display text-xl sm:col-span-2">New code</h2>
        <Input name="code" placeholder="CURIOUS15" required />
        <Input name="minPoints" type="number" placeholder="300" required />
        <Input name="headline" placeholder="You've unlocked 15% off" required className="sm:col-span-2" />
        <Textarea name="description" placeholder="A little thank you." required className="sm:col-span-2" />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="active" defaultChecked className="size-5 accent-[#1e4d3a]" />
          Active
        </label>
        <Button type="submit">Add code</Button>
      </form>
      <section className="space-y-2">
        <h2 className="font-display text-2xl text-[#1e4d3a]">Prizes</h2>
        <ul className="space-y-1 text-sm">
          {prizes.map((prize) => (
            <li key={prize.id} className="rounded-2xl bg-white px-3 py-2">
              <span className="font-extrabold">{prize.title}</span>
              <span className="block text-xs text-[#5e7266]">{prize.detail}</span>
            </li>
          ))}
        </ul>
        <form action={savePrize} className="grid gap-2 sm:grid-cols-2">
          <Input name="title" placeholder="Prize" required />
          <Input name="detail" placeholder="How it arrives" required />
          <Button type="submit" className="sm:col-span-2">Add prize</Button>
        </form>
      </section>
    </div>
  );
}
