"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { withdrawSubmission } from "@/app/club/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { possessive } from "@/lib/format";

export function ShareWork({
  childId,
  nickname,
  packs,
  latest,
}: {
  childId: string;
  nickname: string;
  packs: Array<{ id: string; title: string }>;
  latest: { id: string; status: string } | null;
}) {
  const router = useRouter();
  const [consent, setConsent] = useState(false);
  const [message, setMessage] = useState<string | null>(
    latest?.status === "pending" ? "Pending for approval · +25 pts if featured" : null,
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    if (!consent) {
      setMessage("Tick the consent box before uploading. We only share work a parent has agreed to.");
      return;
    }
    setPending(true);
    formData.set("consent", "true");
    const response = await fetch("/api/submissions", { method: "POST", body: formData });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    setPending(false);
    if (!response.ok) {
      setMessage(body?.error || "That photo couldn't be uploaded.");
      return;
    }
    setMessage("Pending for approval · +25 pts if featured");
    setConsent(false);
    router.refresh();
  }

  return (
    <section className="rounded-[22px] border border-[#efe2d0] bg-white p-4 shadow-sm">
      <h2 className="font-display text-xl text-[#1e4d3a]">Share your work</h2>
      <p className="mt-1 text-sm leading-relaxed text-[#5e7266]">
        Upload a photo of {possessive(nickname)} work. Approved posts earn 25 points, and we may feature them on our socials.
      </p>
      <form action={onSubmit} className="mt-3 space-y-3">
        <input type="hidden" name="childId" value={childId} />
        <label className="block">
          <span className="sr-only">Pack</span>
          <select
            name="packId"
            className="h-11 w-full rounded-2xl border border-[#eadfce] bg-white px-3 text-sm font-bold"
            defaultValue={packs[0]?.id ?? ""}
          >
            {packs.map((pack) => (
              <option key={pack.id} value={pack.id}>
                {pack.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-[#d9c7a4] bg-[#fffaf2] px-4 py-5 text-center">
          <span className="font-extrabold text-[#1e4d3a]">Upload a photo</span>
          <span className="mt-1 text-xs text-[#5e7266]">JPG, PNG or WEBP, up to 5MB. Worksheet or model only, no faces.</span>
          <input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="mt-3 max-w-full text-sm" />
        </label>
        <label className="flex items-start gap-3 text-sm leading-snug text-[#3d5348]">
          <Checkbox checked={consent} onCheckedChange={(value) => setConsent(value === true)} className="mt-0.5" />
          <span>OK to show on our socials (nickname only, no face photos on the public feed)</span>
        </label>
        <p className="text-xs text-[#5e7266]">Photos made by {nickname}</p>
        {message && <p className="text-sm font-bold text-[#1e4d3a]">{message}</p>}
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send for approval"}
        </Button>
      </form>
      {latest?.status === "pending" && (
        <form
          action={async (formData) => {
            await withdrawSubmission(formData);
            router.refresh();
          }}
          className="mt-2"
        >
          <input type="hidden" name="submissionId" value={latest.id} />
          <button className="text-sm font-bold text-[#5e7266] underline">Remove this upload</button>
        </form>
      )}
    </section>
  );
}

export function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
      }}
      className="rounded-full bg-[#1e4d3a] px-4 py-2 text-sm font-extrabold text-white"
    >
      {copied ? "Copied" : "Copy code"}
    </button>
  );
}
