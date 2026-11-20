import { notFound } from "next/navigation";
import { addStep, deletePack, deleteStep, moveStep, updatePack, updateStep } from "@/app/admin/actions";
import { PackForm, type PackFields } from "@/components/admin/pack-form";
import { requireAdmin } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoPackEditor } from "@/lib/demo/view";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CoverTone } from "@/lib/validators";

export default async function EditPackPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const loaded = isDemoMode()
    ? demoPackEditor(id)
    : await (async () => {
        const { data: pack } = await supabase.from("packs").select("*").eq("id", id).maybeSingle();
        if (!pack) return null;
        const { data: steps } = await supabase.from("steps").select("*").eq("pack_id", id).order("position");
        return { pack, steps: steps ?? [] };
      })();
  if (!loaded) notFound();
  const { pack, steps } = loaded;
  const fields = pack as PackFields;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-3xl text-[#1e4d3a]">{pack.title}</h1>
      {query.error && <p className="text-sm font-bold text-[#8a4b3a]">{query.error}</p>}
      {query.saved && <p className="text-sm font-bold text-[#1e4d3a]">Saved.</p>}
      <PackForm pack={{ ...fields, cover_tone: fields.cover_tone as CoverTone }} action={updatePack} />
      <form action={deletePack}>
        <input type="hidden" name="packId" value={id} />
        <Button type="submit" variant="outline">Delete pack</Button>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-2xl text-[#1e4d3a]">Steps</h2>
        <p className="text-sm text-[#5e7266]">
          Video links can be YouTube, Vimeo, or a private Supabase storage file. Real lessons should not sit in a public folder.
        </p>
        {(steps ?? []).map((step, index) => (
          <form key={step.id} action={updateStep} className="space-y-2 rounded-[22px] bg-white p-4">
            <input type="hidden" name="packId" value={id} />
            <input type="hidden" name="stepId" value={step.id} />
            <p className="text-xs font-extrabold text-[#5e7266]">Step {step.position}</p>
            <Input name="title" defaultValue={step.title} required />
            <Textarea name="description" defaultValue={step.description} required />
            <Input name="videoUrl" defaultValue={step.video_url ?? ""} placeholder="https:// or storage://pack-videos/..." />
            <input name="videoFile" type="file" accept="video/mp4,video/webm" className="text-sm" />
            <Input name="printableRef" defaultValue={step.printable_ref ?? ""} placeholder="Print page 1 — Title" />
            <div className="grid grid-cols-2 gap-2">
              <Input name="estimatedMinutes" type="number" defaultValue={step.estimated_minutes} />
              <Input name="points" type="number" defaultValue={step.points} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" size="sm">Save step</Button>
              <button formAction={moveStep} name="direction" value="up" disabled={index === 0} className="rounded-full border px-3 py-2 text-sm font-extrabold disabled:opacity-40">
                Up
              </button>
              <button formAction={moveStep} name="direction" value="down" disabled={index === (steps?.length ?? 0) - 1} className="rounded-full border px-3 py-2 text-sm font-extrabold disabled:opacity-40">
                Down
              </button>
              <button formAction={deleteStep} className="rounded-full px-3 py-2 text-sm font-extrabold text-[#8a4b3a]">
                Delete
              </button>
            </div>
          </form>
        ))}
        <form action={addStep} className="space-y-2 rounded-[22px] border border-dashed border-[#e0d2ba] bg-[#fffaf2] p-4">
          <input type="hidden" name="packId" value={id} />
          <h3 className="font-display text-xl">Add a step</h3>
          <Input name="title" placeholder="Title" required />
          <Textarea name="description" placeholder="What the family does" required />
          <Input name="videoUrl" placeholder="YouTube, Vimeo or storage link" />
          <input name="videoFile" type="file" accept="video/mp4,video/webm" className="text-sm" />
          <Input name="printableRef" placeholder="Print page 1 — Title" />
          <div className="grid grid-cols-2 gap-2">
            <Input name="estimatedMinutes" type="number" defaultValue={15} />
            <Input name="points" type="number" defaultValue={10} />
          </div>
          <Button type="submit">Add step</Button>
        </form>
      </section>
    </div>
  );
}
