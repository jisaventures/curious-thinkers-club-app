import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoPackList } from "@/lib/demo/view";
import { Button } from "@/components/ui/button";

export default async function PacksPage() {
  const { supabase } = await requireAdmin();
  const data = isDemoMode()
    ? demoPackList()
    : await (async () => {
        const { data: rows, error } = await supabase
          .from("packs")
          .select("id, title, slug, published, step_count, shopify_product_id")
          .order("created_at");
        if (error) throw new Error(error.message);
        return rows ?? [];
      })();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-3xl text-[#1e4d3a]">Packs</h1>
        <Button asChild>
          <Link href="/admin/packs/new">New pack</Link>
        </Button>
      </div>
      <div className="space-y-2">
        {data.map((pack) => (
          <Link key={pack.id} href={`/admin/packs/${pack.id}`} className="block rounded-[22px] bg-white p-4">
            <p className="font-extrabold text-[#1e4d3a]">{pack.title}</p>
            <p className="text-sm text-[#5e7266]">
              {pack.step_count} steps · {pack.published ? "Published" : "Draft"} · {pack.shopify_product_id || "No Shopify product id"}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
