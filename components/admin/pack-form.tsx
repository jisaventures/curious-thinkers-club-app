import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COVER_TONES, type CoverTone } from "@/lib/validators";

export type PackFields = {
  id?: string;
  title: string;
  slug: string;
  theme: string;
  age_min: number;
  age_max: number;
  duration_minutes: number;
  duration_label: string;
  blurb: string;
  cover_tone: CoverTone;
  shopify_product_id: string | null;
  price_pence: number;
  certificate_bonus_points: number;
  published: boolean;
};

export function PackForm({
  pack,
  action,
}: {
  pack?: PackFields;
  action: (formData: FormData) => void | Promise<void>;
}) {
  return (
    <form action={action} className="grid gap-3 rounded-[22px] bg-white p-4 sm:grid-cols-2">
      {pack?.id && <input type="hidden" name="packId" value={pack.id} />}
      <Field label="Title" name="title" defaultValue={pack?.title} required className="sm:col-span-2" />
      <Field label="Slug" name="slug" defaultValue={pack?.slug} required />
      <Field label="Theme" name="theme" defaultValue={pack?.theme ?? "history"} required />
      <Field label="Age from" name="ageMin" type="number" defaultValue={String(pack?.age_min ?? 4)} required />
      <Field label="Age to" name="ageMax" type="number" defaultValue={String(pack?.age_max ?? 8)} required />
      <Field label="Minutes" name="durationMinutes" type="number" defaultValue={String(pack?.duration_minutes ?? 120)} required />
      <Field label="Duration label" name="durationLabel" defaultValue={pack?.duration_label ?? "About 2 hours"} required />
      <label className="space-y-1 sm:col-span-2">
        <Label htmlFor="blurb">Blurb</Label>
        <Textarea id="blurb" name="blurb" required defaultValue={pack?.blurb} maxLength={180} />
      </label>
      <label className="space-y-1">
        <Label htmlFor="coverTone">Cover</Label>
        <select id="coverTone" name="coverTone" defaultValue={pack?.cover_tone ?? "bottle"} className="h-12 w-full rounded-2xl border border-[#eadfce] bg-white px-3">
          {COVER_TONES.map((tone) => (
            <option key={tone} value={tone}>{tone}</option>
          ))}
        </select>
      </label>
      <Field label="Shopify product ID" name="shopifyProductId" defaultValue={pack?.shopify_product_id ?? ""} />
      <Field label="Price (£)" name="price" defaultValue={((pack?.price_pence ?? 899) / 100).toFixed(2)} required />
      <Field label="Certificate points" name="certificateBonusPoints" type="number" defaultValue={String(pack?.certificate_bonus_points ?? 50)} required />
      <label className="flex items-center gap-2 text-sm font-bold sm:col-span-2">
        <input type="checkbox" name="published" defaultChecked={pack?.published ?? false} className="size-5 accent-[#1e4d3a]" />
        Published in the club
      </label>
      <Button type="submit" className="sm:col-span-2">{pack ? "Save pack" : "Create pack"}</Button>
    </form>
  );
}

function Field({
  label,
  name,
  className,
  ...props
}: { label: string; name: string; className?: string } & React.ComponentProps<"input">) {
  return (
    <label className={`space-y-1 ${className ?? ""}`}>
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </label>
  );
}
