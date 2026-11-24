import { saveDashboardBanner } from "@/app/admin/actions";
import { BannerEditor } from "@/components/admin/banner-editor";
import { isDemoMode } from "@/lib/demo/mode";
import { demoDb } from "@/lib/demo/store";
import { bannerFromRow, defaultPromo } from "@/lib/club/promo";
import { requireAdmin } from "@/lib/auth/session";

export default async function DashboardBannerPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const query = await searchParams;
  const banner = isDemoMode() ? demoDb().dashboardBanner : await loadBanner();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl text-[#17352A]">Dashboard banner</h1>
        <p className="text-sm text-[#5e7266]">This promo sits under the pack tabs. Leave the dates empty to keep it up all the time.</p>
        {query.error && <p className="mt-2 text-sm font-bold text-[#8a4b3a]">{query.error}</p>}
        {query.saved && <p className="mt-2 text-sm font-bold text-[#306A51]">Saved.</p>}
      </div>
      <BannerEditor banner={banner} action={saveDashboardBanner} />
    </div>
  );
}

async function loadBanner() {
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("dashboard_banners").select("*").eq("id", "club-kit").maybeSingle();
  return bannerFromRow(data) ?? defaultPromo;
}
