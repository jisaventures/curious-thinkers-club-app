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
import { Check, Mars, Venus, X } from "lucide-react";

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

type Screen = "welcome" | "family" | "details";

const stepCard = "mx-auto w-full rounded-[28px] bg-white p-5 shadow-sm sm:p-7";

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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<AvatarBuild | null>(null);

  const child = children[editing];
  const progressLabels = ["Welcome", "Create Family", ...Array.from({ length: count }, (_, index) => `Child ${index + 1} Profile`)];
  const progress = screen === "welcome" ? 0 : screen === "family" ? 1 : 2 + editing;

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

  function openAvatarModal() {
    if (!child) return;
    setAvatarDraft({ ...child.avatar });
    setAvatarOpen(true);
  }

  function saveAvatar() {
    if (!avatarDraft) return;
    patchChild({ avatar: avatarDraft, avatarSaved: true });
    setAvatarOpen(false);
  }

  async function continueProfile() {
    if (!child) return;
    const problem = await nicknameProblem(child.nickname);
    patchChild({ nicknameMessage: problem });
    if (problem) return;
    if (!detailsReady({ ...child, nicknameMessage: "" })) {
      setMessage("Add a first name, an age from 2 to 15, and a gender.");
      return;
    }
    setMessage(null);
    if (editing < count - 1) setEditing(editing + 1);
    else void finish();
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
    <div className="w-full">
      <ol className="mb-5 flex gap-2 overflow-x-auto px-1 pt-2" aria-label="Onboarding progress">
        {progressLabels.map((label, index) => {
          const done = index < progress;
          const current = index === progress;
          return (
            <li key={label} className="relative flex min-w-32 flex-1" aria-current={current ? "step" : undefined}>
              {done && (
                <p className="absolute top-0 left-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 rounded-full bg-[#d7efc8] px-2 py-0.5 text-xs font-extrabold whitespace-nowrap text-[#1e4d3a]">
                  <Check className="size-3 shrink-0" strokeWidth={3} aria-hidden="true" />
                  Complete
                </p>
              )}
              <p
                className={`flex min-h-16 w-full items-center justify-center rounded-2xl px-2 py-3 text-center text-sm leading-tight font-extrabold text-white md:text-base ${done || current ? "bg-[#1e4d3a]" : "bg-[#8eaa9b]"}`}
              >
                Step {index + 1}:<br />{label}
              </p>
            </li>
          );
        })}
      </ol>
      <div>

      {screen === "welcome" && (
        <section className={stepCard}>
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Welcome</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-[#1e4d3a] sm:text-5xl">
            Welcome{shopFirstName ? ` ${shopFirstName}` : ""}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#3d5348] lg:text-xl">
            {shopFirstName
              ? "Your first name comes from your Curious Thinkers shop account."
              : "Your first name will come from your Curious Thinkers shop account when that account is created."}
          </p>
          <p className="mt-3 text-base leading-relaxed text-[#5e7266] lg:text-xl">
            This club must be managed by a parent or guardian. Children do not get their own login. The full terms will be published later.
          </p>
          <label className="mt-4 flex items-start gap-3 rounded-2xl bg-[#f6efe2] p-3 text-base leading-snug lg:text-lg">
            <input type="checkbox" checked={terms} onChange={(event) => setTerms(event.target.checked)} className="mt-0.5 size-5 accent-[#1e4d3a]" />
            <span>
              I agree to the{" "}
              <a href="/terms" className="font-extrabold text-[#1e4d3a] underline">
                terms and conditions
              </a>
              .
            </span>
          </label>
        </section>
      )}

      {screen === "family" && (
        <section className={stepCard}>
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Your family</p>
          <h1 className="mt-2 font-display text-4xl text-[#1e4d3a]">How many children are in the family?</h1>
          <p className="mt-3 text-base leading-relaxed text-[#5e7266] lg:text-xl">
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
        </section>
      )}

      {screen === "details" && child && (
        <section className={stepCard}>
          <div className="flex flex-wrap items-baseline gap-x-3">
            <h1 className="font-display text-4xl text-[#1e4d3a] lg:text-3xl">{child.firstName.trim() || `Child ${editing + 1}`}</h1>
            <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">
              Child {editing + 1} of {count}
            </p>
          </div>
          <div className="mt-5 flex items-start gap-4 lg:mt-3">
            <button
              type="button"
              onClick={openAvatarModal}
              className="group relative size-45 shrink-0 overflow-hidden rounded-[28px] bg-[#f6efe2]"
              aria-label="Edit avatar"
            >
              <FamilyAvatar build={child.avatar} className="size-full" title="Child avatar" />
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/45" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-2 text-center text-sm font-extrabold text-white">
                Edit
              </span>
            </button>
            <div className="min-w-0 flex-1 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name only</Label>
                  <Input id="firstName" value={child.firstName} onChange={(event) => patchChild({ firstName: event.target.value })} maxLength={40} autoComplete="off" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input id="age" inputMode="numeric" value={child.ageYears} onChange={(event) => patchChild({ ageYears: event.target.value })} placeholder="2–15" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <div className="flex gap-2">
                  <Input id="nickname" value={child.nickname} readOnly aria-readonly="true" />
                  <Button type="button" variant="outline" className="shrink-0" onClick={regenerateNickname}>
                    Re-generate
                  </Button>
                </div>
                <p className="text-sm leading-relaxed text-[#5e7266] lg:text-lg">
                  A playful nickname is made for them. Re-generate it if you want a different one.
                </p>
                {child.nicknameMessage && <p className="text-sm font-bold text-[#8a4b3a]">{child.nicknameMessage}</p>}
              </div>
            </div>
          </div>

          <fieldset className="mt-5 lg:mt-2">
            <legend className="text-sm font-extrabold text-[#1e4d3a]">Gender</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-3">
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
                  className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-2 text-sm font-extrabold lg:h-10 ${child.gender === gender ? (gender === "boy" ? "bg-[#3d6fbf] text-white" : gender === "girl" ? "bg-[#e36aa2] text-white" : "bg-[#1e4d3a] text-white") : "bg-[#f6efe2] text-[#1e4d3a]"}`}
                >
                  {gender === "boy" && <Mars className="size-5" aria-hidden="true" />}
                  {gender === "girl" && <Venus className="size-5" aria-hidden="true" />}
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {message && <p className="mt-4 text-sm font-bold text-[#8a4b3a]">{message}</p>}
        </section>
      )}

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-dashed border-club/25 bg-header">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-center gap-3 px-3 py-4 sm:px-4">
          {screen !== "welcome" && (
            <Button
              type="button"
              variant="bottle"
              className="footer-action h-16 min-w-80 px-12 text-2xl uppercase tracking-wide"
              onClick={() => {
                setMessage(null);
                if (screen === "family") setScreen("welcome");
                else if (editing === 0) setScreen("family");
                else setEditing(editing - 1);
              }}
            >
              Back
            </Button>
          )}
          {screen === "welcome" && (
            <Button type="button" className="footer-action h-16 min-w-80 bg-mustard px-12 text-2xl uppercase tracking-wide hover:bg-[#d39320]" size="lg" disabled={!terms} onClick={() => setScreen("family")}>
              Get started
            </Button>
          )}
          {screen === "family" && (
            <Button
              type="button"
              className="footer-action h-16 min-w-80 bg-mustard px-12 text-2xl uppercase tracking-wide hover:bg-[#d39320]"
              size="lg"
              onClick={() => {
                setEditing(0);
                setMessage(null);
                setScreen("details");
              }}
            >
              {count === 1 ? "Add your child" : `Add ${count} children`}
            </Button>
          )}
          {screen === "details" && (
            <Button type="button" className="footer-action h-16 min-w-80 bg-mustard px-12 text-2xl uppercase tracking-wide hover:bg-[#d39320]" size="lg" disabled={pending} onClick={() => void continueProfile()}>
              {editing < count - 1 ? "Next child" : pending ? "Starting…" : "Get started"}
            </Button>
          )}
        </div>
      </footer>

      {avatarOpen && avatarDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAvatarOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-editor-title"
            className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white p-5 shadow-xl sm:p-7"
            onKeyDown={(event) => {
              if (event.key === "Escape") setAvatarOpen(false);
            }}
          >
            <button
              type="button"
              onClick={() => setAvatarOpen(false)}
              className="absolute top-4 right-4 rounded-full p-2 text-[#1e4d3a] hover:bg-[#f6efe2]"
              aria-label="Close"
            >
              <X className="size-5" />
            </button>
            <h2 id="avatar-editor-title" className="pr-10 font-display text-3xl text-[#1e4d3a]">
              Edit avatar
            </h2>
            <div className="mt-4 flex justify-center rounded-[24px] bg-[#f6efe2] p-3">
              <FamilyAvatar build={avatarDraft} className="h-36 w-36" title="Avatar preview" />
            </div>
            <ChoiceRow legend="Hair and hats" value={avatarDraft.top} options={AVATAAARS_TOPS} onChange={(top) => setAvatarDraft({ ...avatarDraft, top })} />
            <div className="grid sm:grid-cols-2 sm:gap-x-4">
              <ColourRow legend="Hair colour" value={avatarDraft.hairColor} colours={HAIR_COLOURS} onChange={(hairColor) => setAvatarDraft({ ...avatarDraft, hairColor })} />
              {AVATAAARS_HAT_TOPS.includes(avatarDraft.top as (typeof AVATAAARS_HAT_TOPS)[number]) && (
                <ColourRow legend="Hat colour" value={avatarDraft.hatColor} colours={HAT_COLOURS} onChange={(hatColor) => setAvatarDraft({ ...avatarDraft, hatColor })} />
              )}
              <ColourRow legend="Skin" value={avatarDraft.skin} colours={SKIN_COLOURS} onChange={(skin) => setAvatarDraft({ ...avatarDraft, skin })} />
              <ChoiceRow legend="Eyes" value={avatarDraft.eyes} options={AVATAAARS_EYES} onChange={(eyes) => setAvatarDraft({ ...avatarDraft, eyes })} />
              <ColourRow legend="Eye colour" value={avatarDraft.eyeColor} colours={EYE_COLOURS} onChange={(eyeColor) => setAvatarDraft({ ...avatarDraft, eyeColor })} />
              <ChoiceRow legend="Mouth" value={avatarDraft.mouth} options={AVATAAARS_MOUTHS} onChange={(mouth) => setAvatarDraft({ ...avatarDraft, mouth })} />
              <ChoiceRow legend="Glasses" value={avatarDraft.accessory} options={AVATAAARS_ACCESSORIES} onChange={(accessory) => setAvatarDraft({ ...avatarDraft, accessory })} />
              {avatarDraft.accessory !== "none" && (
                <ColourRow legend="Glasses colour" value={avatarDraft.accessoryColor} colours={ACCESSORY_COLOURS} onChange={(accessoryColor) => setAvatarDraft({ ...avatarDraft, accessoryColor })} />
              )}
              <ColourRow legend="Clothes colour" value={avatarDraft.clothesColor} colours={CLOTHES_COLOURS} onChange={(clothesColor) => setAvatarDraft({ ...avatarDraft, clothesColor })} />
              <ColourRow legend="Background" value={avatarDraft.background} colours={AVATAR_COLOURS} onChange={(background) => setAvatarDraft({ ...avatarDraft, background })} />
            </div>
            <Button type="button" className="mt-6 w-full" size="lg" onClick={saveAvatar}>
              Save
            </Button>
          </div>
        </div>
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
  className = "",
  compact = false,
}: {
  legend: string;
  hint?: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <fieldset className={`${compact ? "mt-1 flex flex-wrap items-center gap-x-2" : "mt-5"} ${className}`}>
      <legend className={`${compact ? "text-[11px]" : "text-sm"} font-extrabold text-[#1e4d3a]`}>{legend}</legend>
      {hint && <p className="mt-1 text-xs text-[#5e7266]">{hint}</p>}
      <div className={`${compact ? "gap-1" : "mt-2 gap-2"} flex flex-wrap`}>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={value === option}
            onClick={() => onChange(option)}
            className={`rounded-full font-extrabold ${compact ? "px-1.5 py-0.5 text-[10px] leading-none" : "px-3 py-2 text-xs"} ${value === option ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
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
  className = "",
  compact = false,
}: {
  legend: string;
  hint?: string;
  colours: readonly { id: string; label: string; hex: string }[];
  value: string;
  onChange: (hex: string) => void;
  className?: string;
  compact?: boolean;
}) {
  return (
    <fieldset className={`${compact ? "mt-1 flex flex-wrap items-center gap-x-2" : "mt-5"} ${className}`}>
      <legend className={`${compact ? "text-[11px]" : "text-sm"} font-extrabold text-[#1e4d3a]`}>{legend}</legend>
      {hint && <p className="basis-full text-[10px] leading-tight text-[#5e7266]">{hint}</p>}
      <div className={`${compact ? "flex-nowrap gap-1" : "mt-2 flex-wrap gap-2"} flex`}>
        {colours.map((colour) => {
          const hex = colour.hex.replace("#", "");
          return (
            <button
              key={colour.id}
              type="button"
              aria-label={colour.label}
              aria-pressed={value.toLowerCase() === hex.toLowerCase()}
              onClick={() => onChange(hex)}
              className={`${compact ? "size-5 shrink-0" : "size-11"} rounded-full border-2 ${value.toLowerCase() === hex.toLowerCase() ? "border-[#173528]" : "border-white"}`}
              style={{ background: colour.hex }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

