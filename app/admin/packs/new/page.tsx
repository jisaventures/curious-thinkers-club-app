import { createPack } from "@/app/admin/actions";
import { PackForm } from "@/components/admin/pack-form";

export default async function NewPackPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl text-[#1e4d3a]">New quest</h1>
      {error && <p className="text-sm font-bold text-[#8a4b3a]">{error}</p>}
      <PackForm action={createPack} />
    </div>
  );
}
