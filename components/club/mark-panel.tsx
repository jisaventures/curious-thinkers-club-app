"use client";

import { useMemo, useState } from "react";
import { markStepForChildren } from "@/app/club/actions";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { shortName } from "@/lib/format";
import type { AvatarKey } from "@/lib/validators";

export type MarkChild = {
  id: string;
  nickname: string;
  age_years: number;
  avatar_key: AvatarKey;
  avatar_bg?: string | null;
  avatar_face?: string | null;
  avatar_hair_style?: string | null;
  avatar_hair_colour?: string | null;
  avatar_glasses?: boolean | null;
  avatar_hat?: string | null;
  gender?: "boy" | "girl" | "unspecified" | null;
  avatar_skin?: string | null;
  avatar_eyes?: string | null;
  avatar_shirt?: string | null;
  avatar_options?: string | null;
  tickable: boolean;
  detail: string;
};

export function MarkPanel({
  stepId,
  points,
  learners,
  defaultTicked,
  onAdvance,
  onRevert,
}: {
  stepId: string;
  points: number;
  learners: MarkChild[];
  defaultTicked: string[];
  onAdvance?: (childIds: string[]) => void;
  onRevert?: () => void;
}) {
  const [ticked, setTicked] = useState<string[]>(defaultTicked);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const chosen = useMemo(
    () => learners.filter((child) => ticked.includes(child.id) && child.tickable),
    [learners, ticked],
  );
  const label =
    chosen.length === 1
      ? `Mark ${shortName(chosen[0].nickname)} complete · +${points} points`
      : `Mark complete · +${points} points`;

  async function submit() {
    if (chosen.length === 0) {
      setMessage("Tick the children who finished this step.");
      return;
    }
    const childIds = chosen.map((child) => child.id);
    onAdvance?.(childIds);
    setPending(true);
    const result = await markStepForChildren({ stepId, childIds });
    setPending(false);
    if (!result.ok) {
      onRevert?.();
      setMessage(result.message ?? "Something went wrong.");
      return;
    }
    const names = result.names.map(shortName).join(" and ");
    setMessage(
      result.certificate
        ? `${names} finished the quest. Certificate and bonus points added.`
        : `${names} earned ${result.points} points.`,
    );
  }

  return (
    <div className="mt-4">
      <h3 className="font-display text-lg text-[#1e4d3a]">Mark complete</h3>
      <p className="mt-1 text-sm text-[#5e7266]">
        Tick each child who finished this shared video. Anyone not ticked stays on their own step and can come back later.
      </p>
      <ul className="mt-3 space-y-2">
        {learners.map((child) => (
          <li key={child.id} className="flex items-center gap-3 rounded-2xl bg-[#fbf7f1] px-3 py-2">
            <Checkbox
              checked={child.tickable && ticked.includes(child.id)}
              disabled={!child.tickable}
              onCheckedChange={(value) => {
                setTicked((current) =>
                  value === true ? [...new Set([...current, child.id])] : current.filter((id) => id !== child.id),
                );
              }}
              aria-label={`Mark ${child.nickname} complete`}
            />
            <Avatar
              avatar={child.avatar_key}
              colour={child.avatar_bg}
              face={child.avatar_face}
              hairStyle={child.avatar_hair_style}
              hairColour={child.avatar_hair_colour}
              glasses={child.avatar_glasses}
              hat={child.avatar_hat}
              gender={child.gender === "girl" ? "girl" : "boy"}
              skin={child.avatar_skin}
              eyeColour={child.avatar_eyes}
              shirt={child.avatar_shirt}
              options={child.avatar_options}
              className="h-12 w-9"
            />
            <div className="min-w-0">
              <p className="text-sm font-extrabold">
                {child.nickname}, {child.age_years}
              </p>
              <p className="text-xs text-[#5e7266]">{child.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      {message && <p className="mt-3 text-sm font-bold text-[#1e4d3a]">{message}</p>}
      {learners.some((child) => child.tickable) && (
        <Button type="button" onClick={submit} disabled={pending} className="mt-3 w-full" size="lg">
          {pending ? "Saving…" : label}
        </Button>
      )}
    </div>
  );
}
