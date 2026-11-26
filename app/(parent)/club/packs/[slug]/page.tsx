import { PackView } from "@/components/club/pack-view";
import { loadPackPage } from "@/lib/club/data";

export default async function PackPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string; child?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const data = await loadPackPage(slug, query.mode, query.child);
  return <PackView data={data} />;
}
