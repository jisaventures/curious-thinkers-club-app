import { grantPack, replayUnmatched } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoGrants } from "@/lib/demo/view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function GrantsPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; saved?: string }>;
}) {
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const email = (query.email ?? "").trim().toLowerCase();
  const loaded = isDemoMode()
    ? demoGrants(email)
    : await (async () => {
        const { data: packs } = await supabase.from("packs").select("id, title").order("title");
        const account = email
          ? (await supabase.from("accounts").select("id, email, display_name").ilike("email", email).maybeSingle()).data
          : null;
        const owned = account
          ? (await supabase.from("pack_ownership").select("pack_id, source, granted_at").eq("account_id", account.id)).data
          : [];
        const { data: events } = await supabase
          .from("shopify_events")
          .select("id, email, status, detail, created_at, product_ids")
          .order("created_at", { ascending: false })
          .limit(12);
        return { packs: packs ?? [], account, owned: owned ?? [], events: events ?? [] };
      })();
  const { packs, account, owned, events } = loaded;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#1e4d3a]">Grant a pack</h1>
        <p className="text-sm text-[#5e7266]">
          One grant unlocks the pack for every child on that account. Shopify order webhooks will do this later.
        </p>
        {query.error && <p className="mt-2 text-sm font-bold text-[#8a4b3a]">{query.error}</p>}
        {query.saved && <p className="mt-2 text-sm font-bold text-[#1e4d3a]">Saved.</p>}
      </div>
      <form className="flex flex-col gap-2 sm:flex-row" action="/admin/grants">
        <Input name="email" type="email" defaultValue={email} placeholder="sam@demo.curiousthinkersclub.test" aria-label="Account email" />
        <Button type="submit" variant="outline">Find account</Button>
      </form>
      {email && !account && <p className="text-sm">No account for {email}.</p>}
      {account && (
        <form action={grantPack} className="space-y-3 rounded-[22px] bg-white p-4">
          <p className="font-extrabold">{account.display_name} · {account.email}</p>
          <input type="hidden" name="email" value={account.email} />
          <Label htmlFor="packId">Pack</Label>
          <select id="packId" name="packId" className="h-12 w-full rounded-2xl border border-[#eadfce] bg-white px-3">
            {(packs ?? []).map((pack) => (
              <option key={pack.id} value={pack.id}>{pack.title}</option>
            ))}
          </select>
          <Button type="submit">Grant to this account</Button>
          <ul className="text-sm text-[#5e7266]">
            {(owned ?? []).map((row) => {
              const title = packs?.find((pack) => pack.id === row.pack_id)?.title ?? "Pack";
              return <li key={row.pack_id}>{title} · {row.source}</li>;
            })}
            {(owned ?? []).length === 0 && <li>No packs yet.</li>}
          </ul>
        </form>
      )}
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-[#1e4d3a]">Shop orders</h2>
          <form action={replayUnmatched}>
            <Button type="submit" variant="outline" size="sm">Retry unmatched</Button>
          </form>
        </div>
        <ul className="space-y-2">
          {(events ?? []).map((event) => (
            <li key={event.id} className="rounded-2xl bg-white px-3 py-2 text-sm">
              <span className="font-extrabold">{event.status}</span> · {event.email || "no email"} · {(event.product_ids ?? []).join(", ") || "no products"}
              {event.detail && <span className="block text-xs text-[#5e7266]">{event.detail}</span>}
            </li>
          ))}
          {(events ?? []).length === 0 && <li className="text-sm text-[#5e7266]">No webhook events yet.</li>}
        </ul>
      </section>
    </div>
  );
}
