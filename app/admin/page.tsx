import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoAdminCounts } from "@/lib/demo/view";

export default async function AdminHome() {
  await requireAdmin();
  const counts = isDemoMode()
    ? demoAdminCounts()
    : await (async () => {
        const { supabase } = await requireAdmin();
        const [packs, pending, accounts] = await Promise.all([
          supabase.from("packs").select("id", { count: "exact", head: true }),
          supabase.from("submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
          supabase.from("accounts").select("id", { count: "exact", head: true }),
        ]);
        return {
          packs: packs.count ?? 0,
          pending: pending.count ?? 0,
          accounts: accounts.count ?? 0,
        };
      })();

  const cards = [
    ["Quests", counts.packs, "/admin/packs"],
    ["Waiting for approval", counts.pending, "/admin/submissions"],
    ["Accounts", counts.accounts, "/admin/grants"],
  ];

  return (
    <div>
      <h1 className="font-display text-3xl text-[#1e4d3a]">Club admin</h1>
      <p className="mt-1 text-sm text-[#5e7266]">Quests, moderation, reward codes and manual grants.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {cards.map(([label, count, href]) => (
          <Link key={String(href)} href={String(href)} className="rounded-[22px] bg-white p-4">
            <p className="text-sm font-bold text-[#5e7266]">{label}</p>
            <p className="font-display text-4xl text-[#1e4d3a]">{count}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
