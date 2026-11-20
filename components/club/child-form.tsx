"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addChild, deleteChild, updateChild } from "@/app/club/actions";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVATARS, type AvatarKey } from "@/lib/validators";

export function ChildForm({
  mode,
  child,
}: {
  mode: "add" | "edit";
  child?: { id: string; nickname: string; age_years: number; avatar_key: AvatarKey };
}) {
  const router = useRouter();
  const [avatar, setAvatar] = useState<AvatarKey>(child?.avatar_key ?? "explorer");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    formData.set("avatarKey", avatar);
    const result = mode === "add" ? await addChild(formData) : await updateChild(formData);
    setPending(false);
    if (result && "error" in result && result.error) {
      setMessage(result.error);
      return;
    }
    setMessage(mode === "add" ? "Added to the club." : "Saved.");
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-4">
      {child && <input type="hidden" name="childId" value={child.id} />}
      <div className="space-y-2">
        <Label htmlFor={`nick-${child?.id ?? "new"}`}>Nickname</Label>
        <Input
          id={`nick-${child?.id ?? "new"}`}
          name="nickname"
          required
          maxLength={24}
          defaultValue={child?.nickname}
          placeholder="Pirate Pip"
          autoComplete="off"
        />
        <p className="text-xs text-[#5e7266]">A nickname only. No surname, and no photo of them.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`age-${child?.id ?? "new"}`}>Age</Label>
        <Input
          id={`age-${child?.id ?? "new"}`}
          name="ageYears"
          type="number"
          min={2}
          max={15}
          required
          defaultValue={child?.age_years ?? 6}
        />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-extrabold text-[#1e4d3a]">Avatar</p>
        <div className="grid grid-cols-5 gap-2">
          {AVATARS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setAvatar(key)}
              className={`rounded-2xl p-1 ${avatar === key ? "bg-[#e7f5e1] ring-2 ring-[#1e4d3a]" : "hover:bg-[#f6f1e6]"}`}
              aria-label={key}
              aria-pressed={avatar === key}
            >
              <Avatar avatar={key} className="mx-auto size-12" />
            </button>
          ))}
        </div>
      </div>
      {message && <p className="text-sm font-bold text-[#1e4d3a]">{message}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving…" : mode === "add" ? "Add child" : "Save"}
      </Button>
    </form>
  );
}

export function RemoveChildButton({ childId, nickname }: { childId: string; nickname: string }) {
  const [sure, setSure] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!sure) {
    return (
      <button type="button" onClick={() => setSure(true)} className="text-sm font-bold text-[#8a4b3a] underline">
        Remove {nickname}
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        const result = await deleteChild(formData);
        if (result && "error" in result && result.error) setMessage(result.error);
      }}
      className="space-y-2"
    >
      <input type="hidden" name="childId" value={childId} />
      <p className="text-sm text-[#5e7266]">This removes their progress from the club. It cannot be undone.</p>
      {message && <p className="text-sm font-bold">{message}</p>}
      <Button type="submit" variant="outline" size="sm">
        Yes, remove
      </Button>
    </form>
  );
}
