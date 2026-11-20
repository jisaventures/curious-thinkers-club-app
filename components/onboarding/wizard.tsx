"use client";

import { useEffect, useMemo, useState } from "react";
import { checkNickname, completeOnboarding } from "@/app/onboarding/actions";
import { FamilyAvatar } from "@/components/brand/family-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCESSORY_COLOURS, AVATAR_COLOURS, CLOTHES_COLOURS, EYE_COLOURS, HAIR_COLOURS, HAT_COLOURS, SKIN_COLOURS } from "@/lib/avatar-style";
import {
  AVATAAARS_ACCESSORIES,
  AVATAAARS_EYES,
  AVATAAARS_HAT_TOPS,
  AVATAAARS_MOUTHS,
  AVATAAARS_TOPS,
  boyAvatar,
  girlAvatar,
  optionLabel,
  type AvatarBuild,
} from "@/lib/avataaars-options";
import { isRudeNickname, suggestNickname } from "@/lib/nicknames";
import { Check, Mars, Venus } from "lucide-react";

type Gender = "boy" | "girl" | "unspecified";

type ChildDraft = {
  firstName: string;
  nickname: string;
  ageYears: string;
  gender: Gender | "";
  avatar: AvatarBuild;
  avatarSaved: boolean;
  nicknameMessage: string;
};

type Screen = "welcome" | "terms" | "family" | "details" | "avatar";

const emptyChild = (): ChildDraft => ({
  firstName: "",
  nickname: "",
  ageYears: "",
  gender: "",
  avatar: boyAvatar(),
  avatarSaved: false,
  nicknameMessage: "",
});

export function OnboardingWizard({ shopFirstName }: { shopFirstName: string | null }) {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [terms, setTerms] = useState(true);
  const [count, setCount] = useState(1);
  const [children, setChildren] = useState<ChildDraft[]>([emptyChild()]);
  const [editing, setEditing] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const child = children[editing];
  const progress = screen === "welcome" ? 0 : screen === "terms" ? 1 : 2;

  const siblingNames = useMemo(
    () => children.filter((_, index) => index !== editing).map((item) => item.nickname),
    [children, editing],
  );

  function resize(nextCount: number) {
    setCount(nextCount);
    setChildren((current) => {
      const next = current.slice(0, nextCount);
      while (next.length < nextCount) next.push(emptyChild());
      return next;
    });
  }

  function patchChild(patch: Partial<ChildDraft>, index = editing) {
    setChildren((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function assignNickname(avoid: string[] = [], cancelled: () => boolean = () => false) {
    const taken = [...siblingNames, ...avoid];
    let suggestion = suggestNickname("", taken);
    let problem = await nicknameProblem(suggestion);
    for (let attempt = 0; attempt < 4 && problem; attempt += 1) {
      taken.push(suggestion);
      suggestion = suggestNickname("", taken);
      problem = await nicknameProblem(suggestion);
    }
    if (cancelled()) return;
    patchChild({ nickname: suggestion, nicknameMessage: problem });
  }

  function regenerateNickname() {
    void assignNickname(child?.nickname ? [child.nickname] : []);
  }

  async function nicknameProblem(value: string) {
    const local = value.trim();
    if (!local) return "Making a nickname…";
    if (siblingNames.some((name) => name.trim() && name.toLowerCase() === local.toLowerCase())) {
      return "Another child in this family already has that nickname.";
    }
    if (isRudeNickname(local)) return "Choose a kinder nickname.";
    const result = await checkNickname(local, child?.firstName ?? "");
    return result.ok ? "" : result.message;
  }

  async function openAvatar() {
    if (!child) return;
    const problem = await nicknameProblem(child.nickname);
    patchChild({ nicknameMessage: problem });
    if (problem) return;
    if (!detailsReady({ ...child, nicknameMessage: "" })) {
      setMessage("Add a first name, an age from 2 to 15, and a gender.");
      return;
    }
    setMessage(null);
    setScreen("avatar");
  }

  function detailsReady(item: ChildDraft) {
    return (
      item.firstName.trim().length > 0 &&
      item.nickname.trim().length > 0 &&
      !item.nicknameMessage &&
      !isRudeNickname(item.nickname) &&
      Number(item.ageYears) >= 2 &&
      Number(item.ageYears) <= 15 &&
      item.gender !== ""
    );
  }

  function childComplete(item: ChildDraft) {
    return detailsReady(item) && item.avatarSaved;
  }

  const family = children.slice(0, count);
  const allComplete = family.every(childComplete);

  useEffect(() => {
    if (screen !== "details" || children[editing]?.nickname) return;
    let cancelled = false;
    void assignNickname([], () => cancelled);
    return () => {
      cancelled = true;
    };
    // Generate once when this child's editor opens. Re-generate is a separate button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, editing]);

  async function finish() {
    setPending(true);
    setMessage(null);
    const result = await completeOnboarding({
      adult: true,
      children: children.slice(0, count).map((item) => ({
        firstName: item.firstName.trim(),
        nickname: item.nickname.trim(),
        ageYears: Number(item.ageYears),
        gender: item.gender as Gender,
        avatar: item.avatar,
      })),
    }).catch((error: { digest?: string; message?: string }) => {
      if (typeof error?.digest === "string" && error.digest.startsWith("NEXT_REDIRECT")) throw error;
      return { ok: false as const, message: "Something went wrong. Please try again." };
    });
    if (result && !result.ok) {
      setMessage(result.message);
      setPending(false);
    }
  }

  return (
    <div className="flex w-full flex-1 flex-col">
      <ol className="mb-5 flex gap-2" aria-label="Onboarding progress">
        {["Welcome", "Terms", "Children"].map((label, index) => (
          <li key={label} className={`h-1.5 flex-1 rounded-full ${index <= progress ? "bg-[#1e4d3a]" : "bg-[#eadfce]"}`}>
            <span className="sr-only">{label}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-1 flex-col [justify-content:safe_center]">

      {screen === "welcome" && (
        <section className="mx-auto max-w-2xl rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Welcome</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-[#1e4d3a] sm:text-5xl">
            Welcome{shopFirstName ? ` ${shopFirstName}` : ""}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#3d5348]">
            {shopFirstName
              ? "Your first name comes from your Curious Thinkers shop account."
              : "Your first name will come from your Curious Thinkers shop account when that account is created."}
          </p>
          <Button type="button" className="mt-6 w-full" size="lg" onClick={() => setScreen("terms")}>
            Get started
          </Button>
        </section>
      )}

      {screen === "terms" && (
        <section className="mx-auto max-w-2xl rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Before the club</p>
          <h1 className="mt-2 font-display text-4xl text-[#1e4d3a]">Terms and conditions</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5e7266]">
            This club must be managed by a parent or guardian. Children do not get their own login. The full terms will be published later.
          </p>
          <label className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f6efe2] p-3 text-sm leading-snug">
            <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-0.5 size-5 accent-[#1e4d3a]" />
            <span>
              I agree to the{" "}
              <a href="/terms" className="font-extrabold text-[#1e4d3a] underline">
                terms and conditions
              </a>
              .
            </span>
          </label>
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setScreen("welcome")}>
              Back
            </Button>
            <Button type="button" className="flex-1" disabled={!terms} onClick={() => setScreen("family")}>
              Continue
            </Button>
          </div>
        </section>
      )}

      {screen === "family" && (
        <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Your family</p>
          <h1 className="mt-2 font-display text-4xl text-[#1e4d3a]">How many children are in the family?</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5e7266]">
            You can add up to 5 children on this account. You don&apos;t have to add everyone now. More can be added later, still up to 5.
          </p>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={count === value}
                onClick={() => resize(value)}
                className={`h-14 rounded-2xl font-display text-2xl ${count === value ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
              >
                {value}
              </button>
            ))}
          </div>
          <ul className="mt-5 grid gap-3 md:grid-cols-5">
            {family.map((item, index) => {
              const complete = childComplete(item);
              const label = item.firstName.trim() || `Child ${index + 1}`;
              return (
                <li
                  key={index}
                  className={`flex min-h-0 flex-col items-center justify-between gap-2 rounded-3xl p-3 text-center md:aspect-square ${complete ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
                >
                  <p className="w-full truncate text-sm font-extrabold">{label}</p>
                  {complete ? (
                    <span className="grid size-11 place-items-center rounded-full bg-white text-[#1e4d3a]" aria-hidden="true">
                      <Check className="size-6" strokeWidth={3} />
                    </span>
                  ) : (
                    <span className="grid size-11 place-items-center rounded-full bg-white font-display text-lg text-[#1e4d3a]">{index + 1}</span>
                  )}
                  {complete ? <p className="text-sm font-extrabold text-white">Complete</p> : <span className="text-xs font-bold text-[#8a4b3a]">Not finished</span>}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setEditing(index);
                      setMessage(null);
                      setScreen("details");
                    }}
                  >
                    Edit
                  </Button>
                </li>
              );
            })}
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-[#5e7266]">Every child needs a name and an avatar before you can continue.</p>
          {message && <p className="mt-4 text-sm font-bold text-[#8a4b3a]">{message}</p>}
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setScreen("terms")}>
              Back
            </Button>
            <Button type="button" className="flex-1" size="lg" disabled={!allComplete || !terms || pending} onClick={() => void finish()}>
              {pending ? "Starting…" : "Get started"}
            </Button>
          </div>
        </section>
      )}

      {screen === "details" && child && (
        <section className="mx-auto max-w-2xl rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">
            Child {editing + 1} of {count}
          </p>
          <h1 className="mt-2 font-display text-4xl text-[#1e4d3a]">{child.firstName.trim() || `Child ${editing + 1}`}</h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name only</Label>
              <Input id="firstName" value={child.firstName} onChange={(event) => patchChild({ firstName: event.target.value })} maxLength={40} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" inputMode="numeric" value={child.ageYears} onChange={(event) => patchChild({ ageYears: event.target.value })} placeholder="2–15" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input id="nickname" value={child.nickname} readOnly aria-readonly="true" />
            <Button type="button" variant="outline" onClick={regenerateNickname}>
              Re-generate nickname
            </Button>
            <p className="text-xs leading-relaxed text-[#5e7266]">
              A playful nickname is made for them. Re-generate it if you want a different one.
            </p>
            {child.nicknameMessage && <p className="text-sm font-bold text-[#8a4b3a]">{child.nicknameMessage}</p>}
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-extrabold text-[#1e4d3a]">Gender</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(
                [
                  ["boy", "Boy"],
                  ["girl", "Girl"],
                  ["unspecified", "Prefer not to say"],
                ] as const
              ).map(([gender, label]) => (
                <button
                  key={gender}
                  type="button"
                  aria-pressed={child.gender === gender}
                  onClick={() => {
                    const base = gender === "girl" ? girlAvatar() : boyAvatar();
                    patchChild({
                      gender,
                      avatar: { ...child.avatar, top: base.top, clothing: base.clothing, eyebrows: "defaultNatural", facialHair: "none" },
                    });
                  }}
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-2 text-sm font-extrabold ${gender === "unspecified" ? "col-span-2" : ""} ${child.gender === gender ? (gender === "boy" ? "bg-[#3d6fbf] text-white" : gender === "girl" ? "bg-[#e36aa2] text-white" : "bg-[#1e4d3a] text-white") : "bg-[#f6efe2] text-[#1e4d3a]"}`}
                >
                  {gender === "boy" && <Mars className="size-5" aria-hidden="true" />}
                  {gender === "girl" && <Venus className="size-5" aria-hidden="true" />}
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {message && <p className="mt-4 text-sm font-bold text-[#8a4b3a]">{message}</p>}
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setScreen("family")}>
              Back
            </Button>
            <Button type="button" className="flex-1" onClick={() => void openAvatar()}>
              Create avatar
            </Button>
          </div>
        </section>
      )}

      {screen === "avatar" && child && (
        <section className="mx-auto max-w-2xl rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">
            Child {editing + 1} of {count}
          </p>
          <h1 className="mt-2 font-display text-4xl text-[#1e4d3a]">Create an avatar</h1>
          <div className="mt-5 flex justify-center rounded-[24px] bg-[#f6efe2] p-3">
            <FamilyAvatar build={child.avatar} className="h-40 w-40" title="Avatar preview" />
          </div>
          <ChoiceRow legend="Hair and hats" value={child.avatar.top} options={AVATAAARS_TOPS} onChange={(top) => patchChild({ avatar: { ...child.avatar, top } })} />
          <ColourRow legend="Hair colour" value={child.avatar.hairColor} colours={HAIR_COLOURS} onChange={(hairColor) => patchChild({ avatar: { ...child.avatar, hairColor: hairColor.replace("#", "") } })} />
          {AVATAAARS_HAT_TOPS.includes(child.avatar.top as (typeof AVATAAARS_HAT_TOPS)[number]) && (
            <ColourRow legend="Hat colour" value={child.avatar.hatColor} colours={HAT_COLOURS} onChange={(hatColor) => patchChild({ avatar: { ...child.avatar, hatColor } })} />
          )}
          <ColourRow legend="Skin" value={child.avatar.skin} colours={SKIN_COLOURS} onChange={(skin) => patchChild({ avatar: { ...child.avatar, skin: skin.replace("#", "") } })} />
          <ChoiceRow legend="Eyes" value={child.avatar.eyes} options={AVATAAARS_EYES} onChange={(eyes) => patchChild({ avatar: { ...child.avatar, eyes } })} />
          <ColourRow legend="Eye colour" value={child.avatar.eyeColor} colours={EYE_COLOURS} onChange={(eyeColor) => patchChild({ avatar: { ...child.avatar, eyeColor: eyeColor.replace("#", "") } })} />
          <ChoiceRow legend="Mouth" value={child.avatar.mouth} options={AVATAAARS_MOUTHS} onChange={(mouth) => patchChild({ avatar: { ...child.avatar, mouth } })} />
          <ChoiceRow legend="Glasses" value={child.avatar.accessory} options={AVATAAARS_ACCESSORIES} onChange={(accessory) => patchChild({ avatar: { ...child.avatar, accessory } })} />
          {child.avatar.accessory !== "none" && (
            <ColourRow legend="Glasses colour" value={child.avatar.accessoryColor} colours={ACCESSORY_COLOURS} onChange={(accessoryColor) => patchChild({ avatar: { ...child.avatar, accessoryColor } })} />
          )}
          <ColourRow
            legend="Clothes colour"
            hint="Girls wear a v-neck. Boys, and prefer not to say, wear a crew neck."
            value={child.avatar.clothesColor}
            colours={CLOTHES_COLOURS}
            onChange={(clothesColor) => patchChild({ avatar: { ...child.avatar, clothesColor } })}
          />
          <ColourRow legend="Background" value={child.avatar.background} colours={AVATAR_COLOURS} onChange={(background) => patchChild({ avatar: { ...child.avatar, background: background.replace("#", "") } })} />

          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setScreen("details")}>
              Back
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => {
                patchChild({ avatarSaved: true });
                setScreen("family");
              }}
            >
              Save avatar
            </Button>
          </div>
        </section>
      )}
      </div>
    </div>
  );
}

function ChoiceRow<T extends string>({
  legend,
  hint,
  options,
  value,
  onChange,
}: {
  legend: string;
  hint?: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-extrabold text-[#1e4d3a]">{legend}</legend>
      {hint && <p className="mt-1 text-xs text-[#5e7266]">{hint}</p>}
      <div className="mt-2 flex max-h-40 flex-wrap gap-2 overflow-y-auto">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-2 text-xs font-extrabold ${value === option ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
          >
            {option === "none" ? "None" : optionLabel(option)}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ColourRow({
  legend,
  hint,
  colours,
  value,
  onChange,
}: {
  legend: string;
  hint?: string;
  colours: readonly { id: string; label: string; hex: string }[];
  value: string;
  onChange: (hex: string) => void;
}) {
  return (
    <fieldset className="mt-5">
      <legend className="text-sm font-extrabold text-[#1e4d3a]">{legend}</legend>
      {hint && <p className="mt-1 text-xs text-[#5e7266]">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {colours.map((colour) => {
          const hex = colour.hex.replace("#", "");
          return (
            <button
              key={colour.id}
              type="button"
              aria-label={colour.label}
              aria-pressed={value.toLowerCase() === hex.toLowerCase()}
              onClick={() => onChange(hex)}
              className={`size-11 rounded-full border-2 ${value.toLowerCase() === hex.toLowerCase() ? "border-[#173528]" : "border-white"}`}
              style={{ background: colour.hex }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

