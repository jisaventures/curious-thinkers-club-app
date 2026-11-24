"use client";

import { useState } from "react";
import { PromoBanner } from "@/components/club/promo-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PromoBannerRecord } from "@/lib/club/promo";

export function BannerEditor({
  banner,
  action,
}: {
  banner: PromoBannerRecord;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [draft, setDraft] = useState(banner);
  const [previewImage, setPreviewImage] = useState(banner.imageUrl);

  function set<K extends keyof PromoBannerRecord>(key: K, value: PromoBannerRecord[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <form action={action} className="grid gap-3 rounded-[22px] bg-white p-4">
        <label className="space-y-1">
          <Label htmlFor="image">Image</Label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              setPreviewImage(URL.createObjectURL(file));
            }}
          />
        </label>
        <Field label="Badge" name="badgeText" value={draft.badgeText} onChange={(value) => set("badgeText", value)} />
        <Field label="Headline" name="headline" value={draft.headline} onChange={(value) => set("headline", value)} />
        <label className="space-y-1">
          <Label htmlFor="subtext">Subtext</Label>
          <Textarea id="subtext" name="subtext" value={draft.subtext} onChange={(event) => set("subtext", event.target.value)} required maxLength={180} />
        </label>
        <Field label="Button label" name="buttonLabel" value={draft.buttonLabel} onChange={(value) => set("buttonLabel", value)} />
        <Field label="Button link" name="buttonLink" value={draft.buttonLink} onChange={(value) => set("buttonLink", value)} />
        <Field label="Background" name="background" value={draft.background} onChange={(value) => set("background", value)} />
        <label className="space-y-1">
          <Label htmlFor="textColour">Text colour</Label>
          <input id="textColour" name="textColour" value={draft.textColour} onChange={(event) => set("textColour", event.target.value)} className="h-12 w-full rounded-2xl border border-[#eadfce] bg-white px-3" required />
        </label>
        <Field label="Show from" name="startsAt" type="datetime-local" value={localStamp(draft.startsAt)} onChange={(value) => set("startsAt", value || null)} />
        <Field label="Hide after" name="endsAt" type="datetime-local" value={localStamp(draft.endsAt)} onChange={(value) => set("endsAt", value || null)} />
        <label className="flex items-center gap-2 text-sm font-bold">
          <input type="checkbox" name="visible" checked={draft.visible} onChange={(event) => set("visible", event.target.checked)} className="size-5 accent-[#1e4d3a]" />
          Show on the dashboard
        </label>
        <Button type="submit">Save banner</Button>
      </form>
      <div>
        <p className="mb-2 text-sm font-extrabold text-[#5e7266]">Preview</p>
        {draft.visible ? (
          <PromoBanner banner={{ ...draft, imageUrl: previewImage }} />
        ) : (
          <p className="rounded-[22px] bg-white p-4 text-sm text-[#3d5348]">Hidden. My packs will move up.</p>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function localStamp(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
