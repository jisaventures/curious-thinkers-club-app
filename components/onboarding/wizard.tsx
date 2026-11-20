"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { checkNickname, completeOnboarding } from "@/app/onboarding/actions";
import { FamilyAvatar } from "@/components/brand/family-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCESSORY_COLOURS, AVATAR_COLOURS, CLOTHES_COLOURS, EYE_COLOURS, HAIR_COLOURS, SKIN_COLOURS } from "@/lib/avatar-style";
import {
  AVATAAARS_ACCESSORIES,
  AVATAAARS_EYES,
  AVATAAARS_MOUTHS,
  BOY_HAIR,
  GIRL_HAIR,
  boyAvatar,
  girlAvatar,
  optionLabel,
  type AvatarBuild,
} from "@/lib/avataaars-options";
import { BirthdayPicker } from "@/components/onboarding/birthday-picker";
import { ageFromBirthday, isBirthdayAllowed } from "@/lib/birthday";
import { isRudeNickname, suggestNickname } from "@/lib/nicknames";
import { Check, ChevronLeft, ChevronRight, Mars, Trophy, Venus, X } from "lucide-react";

type Gender = "boy" | "girl" | "unspecified";

type ChildDraft = {
  firstName: string;
  nickname: string;
  birthday: string;
  gender: Gender | "";
  avatar: AvatarBuild;
  avatarSaved: boolean;
  nicknameMessage: string;
};

type Screen = "welcome" | "family" | "details";

const stepCard = "mx-auto w-full rounded-[28px] bg-white p-5 shadow-sm sm:p-7";

const CONFETTI: Array<[string, string, string, string, string]> = [
  ["4%", "#e8a428", "-0.8s", "2.8s", "24px"],
  ["12%", "#306a51", "-0.4s", "3s", "-18px"],
  ["20%", "#f0b429", "0s", "2.6s", "30px"],
  ["28%", "#c48614", "-1.1s", "3.1s", "-10px"],
  ["36%", "#e8a428", "-0.2s", "2.7s", "16px"],
  ["44%", "#1e4d3a", "0.1s", "3s", "-26px"],
  ["52%", "#f0b429", "-0.6s", "2.8s", "12px"],
  ["60%", "#e7a0b0", "0s", "2.6s", "-20px"],
  ["68%", "#e8a428", "-0.9s", "3.1s", "22px"],
  ["76%", "#306a51", "0.15s", "2.7s", "-14px"],
  ["84%", "#f0b429", "-0.3s", "2.9s", "18px"],
  ["92%", "#e8a428", "-1s", "2.6s", "-28px"],
  ["8%", "#d4567a", "0.05s", "3s", "10px"],
  ["24%", "#e7a0b0", "-0.7s", "2.8s", "-16px"],
  ["48%", "#306a51", "0.2s", "3.1s", "26px"],
  ["72%", "#e8a428", "-0.5s", "2.7s", "-8px"],
  ["88%", "#1e4d3a", "-0.15s", "3s", "14px"],
  ["16%", "#f0b429", "0.25s", "2.6s", "-22px"],
];

const emptyChild = (): ChildDraft => ({
  firstName: "",
  nickname: "",
  birthday: "",
  gender: "boy",
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
  const [celebrating, setCelebrating] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<AvatarBuild | null>(null);
  const tabsRef = useRef<HTMLOListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
    const hair = child.gender === "girl" ? GIRL_HAIR : BOY_HAIR;
    const avatar = { ...child.avatar };
    if (!new Set<string>(hair).has(avatar.top)) avatar.top = hair[0];
    setAvatarDraft(avatar);
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
    if (problem || !detailsReady({ ...child, nicknameMessage: "" })) return;
    setMessage(null);
    if (editing < count - 1) setEditing(editing + 1);
    else {
      setCelebrating(true);
      await finish();
    }
  }

  function detailsReady(item: ChildDraft) {
    return missingProfileHint(item) === "";
  }

  const profileHint = missingProfileHint(child);
  const profileReady = profileHint === "";
  const hairOptions = child?.gender === "girl" ? GIRL_HAIR : BOY_HAIR;
  const hairValue = avatarDraft && new Set<string>(hairOptions).has(avatarDraft.top) ? avatarDraft.top : hairOptions[0];

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const sync = () => {
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(el.scrollWidth - el.clientWidth - el.scrollLeft > 8);
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [progressLabels.length, screen]);

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
        firstName: item.firstName.trim().slice(0, 15),
        nickname: item.nickname.trim(),
        ageYears: ageFromBirthday(item.birthday) ?? 0,
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
      setCelebrating(false);
    }
  }

  return (
    <div className="w-full">
      <div className="relative mb-5">
      <ol ref={tabsRef} className="tab-scroll flex gap-2 overflow-x-auto px-1 pt-2" aria-label="Onboarding progress">
        {progressLabels.map((label, index) => {
          const done = index < progress;
          const current = index === progress;
          const tabClass =
            done || (current && index === 0)
              ? "bg-[#1e4d3a] text-white"
              : current
                ? "bg-mustard text-white"
                : "bg-[#c8c4bc] text-[#6f6b64]";
          return (
            <li key={label} className="relative flex min-w-36 shrink-0 flex-1 flex-col items-center" aria-current={current ? "step" : undefined}>
              <span
                className="ctc-button pointer-events-none relative z-10 -mb-3"
                data-variant={done ? "green" : current ? "mustard" : "grey"}
                data-size="sm"
              >
                {done && <Check className="mr-1 size-3.5 shrink-0" strokeWidth={3} aria-hidden="true" />}
                {done ? "Completed" : `Step ${index + 1}`}
              </span>
              <div className={`flex min-h-16 w-full items-center justify-center rounded-2xl px-2 py-3 text-center font-display text-lg leading-tight font-bold md:text-xl ${tabClass}`}>
                {label}
              </div>
            </li>
          );
        })}
      </ol>
      {canScrollLeft && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#fffdf8] to-transparent" />
          <Button
            type="button"
            variant="mustard"
            size="sm"
            className="absolute bottom-8 left-1 z-10 -translate-y-1/2"
            aria-label="Show previous steps"
            onClick={() => tabsRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
          >
            <ChevronLeft className="size-5" />
          </Button>
        </>
      )}
      {canScrollRight && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#fffdf8] to-transparent" />
          <Button
            type="button"
            variant="mustard"
            size="sm"
            className="absolute right-1 bottom-8 z-10 -translate-y-1/2"
            aria-label="Show more steps"
            onClick={() => tabsRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
          >
            <ChevronRight className="size-5" />
          </Button>
        </>
      )}
      </div>
      <div>

      {screen === "welcome" && (
        <section className={stepCard}>
          <h1 className="step-title text-4xl leading-tight sm:text-5xl">
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
            <input
              type="checkbox"
              checked={terms}
              onChange={(event) => setTerms(event.target.checked)}
              className="mt-0.5 size-5 accent-[#1e4d3a]"
              suppressHydrationWarning
            />
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
          <h1 className="step-title text-4xl">How many children are in the family?</h1>
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
                className={`count-pick flex h-16 items-center justify-center rounded-2xl sm:h-24 ${count === value ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
              >
                {value}
              </button>
            ))}
          </div>
        </section>
      )}

      {screen === "details" && child && (
        <section className={stepCard}>
          <h1 className="step-title text-4xl lg:text-3xl">{child.firstName.trim() || `Child ${editing + 1}`}</h1>
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
                  <Input
                    id="firstName"
                    value={child.firstName}
                    onChange={(event) => patchChild({ firstName: event.target.value.slice(0, 15) })}
                    maxLength={15}
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <BirthdayPicker id="birthday" value={child.birthday} onChange={(birthday) => patchChild({ birthday })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nickname">Nickname</Label>
                <div className="flex gap-2">
                  <Input id="nickname" value={child.nickname} disabled />
                  <Button type="button" variant="green" size="sm" className="shrink-0" onClick={regenerateNickname}>
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
            <div className="gender-row mt-2">
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
                  className={`fredoka-bold inline-flex h-11 items-center justify-center rounded-2xl border-2 leading-none whitespace-nowrap ${child.gender === gender ? `border-[#306A51] ${gender === "boy" ? "bg-[#3d6fbf] text-white" : gender === "girl" ? "bg-[#e36aa2] text-white" : "bg-[#1e4d3a] text-white"}` : "border-transparent bg-[#f6efe2] text-[#1e4d3a]"}`}
                >
                  {gender === "boy" && <Mars className="gender-icon shrink-0" aria-hidden="true" />}
                  {gender === "girl" && <Venus className="gender-icon shrink-0" aria-hidden="true" />}
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
              variant="grey"
              size="lg"
              className="footer-cta"
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
            <Button type="button" variant="mustard" size="lg" className="footer-cta gap-2" disabled={!terms} onClick={() => setScreen("family")}>
              Get started
              <EmojiRocket className="size-7 shrink-0" />
            </Button>
          )}
          {screen === "family" && (
            <Button
              type="button"
              variant="mustard"
              size="lg"
              className="footer-cta"
              onClick={() => {
                setEditing(0);
                setMessage(null);
                setScreen("details");
              }}
            >
              {count === 1 ? "Add your child" : `Add ${count} children`}
            </Button>
          )}
          {screen === "details" && editing < count - 1 && (
            <HintedButton type="button" variant="mustard" size="lg" className="footer-cta" disabled={pending || !profileReady} hint={profileHint} onClick={() => void continueProfile()}>
              Next child
            </HintedButton>
          )}
          {screen === "details" && editing >= count - 1 && (
            <HintedButton type="button" variant="green" size="lg" className="footer-cta gap-2" disabled={pending || !profileReady} hint={profileHint} onClick={() => void continueProfile()}>
              <SolidTrophy className="size-7 shrink-0 text-[#e8a428]" />
              {pending ? "Starting…" : "Enter Club"}
            </HintedButton>
          )}
        </div>
      </footer>

      {celebrating && <ClubCelebration names={children.slice(0, count).map((item) => item.firstName.trim()).filter(Boolean)} />}

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
            className="relative flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-xl lg:max-h-none lg:overflow-visible"
            onKeyDown={(event) => {
              if (event.key === "Escape") setAvatarOpen(false);
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#eadfce] bg-white px-5 py-4 sm:px-6 lg:border-0 lg:pb-0">
              <h2 id="avatar-editor-title" className="step-title text-3xl">
                Edit avatar
              </h2>
              <button
                type="button"
                onClick={() => setAvatarOpen(false)}
                className="rounded-full p-2 text-[#1e4d3a] hover:bg-[#f6efe2]"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="avatar-modal-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6 lg:overflow-visible">
            <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="lg:self-stretch lg:border-r lg:border-[#b9b5ad] lg:pr-5">
                <div className="flex justify-center rounded-[24px] bg-[#f6efe2] p-3">
                  <FamilyAvatar build={avatarDraft} className="h-40 w-40" title="Avatar preview" />
                </div>
                <ColourRow legend="Background" value={avatarDraft.background} colours={AVATAR_COLOURS} onChange={(background) => setAvatarDraft({ ...avatarDraft, background })} className="mt-3" />
                <ColourRow legend="Skin" value={avatarDraft.skin} colours={SKIN_COLOURS} onChange={(skin) => setAvatarDraft({ ...avatarDraft, skin })} className="mt-3" />
              </div>
              <div>
                <ChoiceRow
                  legend="Hair"
                  value={hairValue}
                  options={hairOptions}
                  onChange={(top) => setAvatarDraft({ ...avatarDraft, top, hatColor: avatarDraft.hairColor })}
                  className="mt-0"
                />
                <div className="grid sm:grid-cols-2 sm:gap-x-4">
                  <ColourRow
                    legend="Hair / head accessory colour"
                    value={avatarDraft.hairColor}
                    colours={HAIR_COLOURS}
                    onChange={(hairColor) => setAvatarDraft({ ...avatarDraft, hairColor, hatColor: hairColor })}
                    className="mt-3 sm:col-span-2"
                  />
                  <ChoiceRow legend="Eyes" value={avatarDraft.eyes} options={AVATAAARS_EYES} onChange={(eyes) => setAvatarDraft({ ...avatarDraft, eyes })} className="mt-3" />
                  <ColourRow legend="Eye colour" value={avatarDraft.eyeColor} colours={EYE_COLOURS} onChange={(eyeColor) => setAvatarDraft({ ...avatarDraft, eyeColor })} className="mt-3" />
                  <ChoiceRow legend="Mouth" value={avatarDraft.mouth} options={AVATAAARS_MOUTHS} onChange={(mouth) => setAvatarDraft({ ...avatarDraft, mouth })} className="mt-3" />
                  <ChoiceRow legend="Glasses" value={avatarDraft.accessory} options={AVATAAARS_ACCESSORIES} onChange={(accessory) => setAvatarDraft({ ...avatarDraft, accessory })} className="mt-3" />
                  {avatarDraft.accessory !== "none" && (
                    <ColourRow legend="Glasses colour" value={avatarDraft.accessoryColor} colours={ACCESSORY_COLOURS} onChange={(accessoryColor) => setAvatarDraft({ ...avatarDraft, accessoryColor })} className="mt-3" />
                  )}
                  <ColourRow legend="Clothes colour" value={avatarDraft.clothesColor} colours={CLOTHES_COLOURS} onChange={(clothesColor) => setAvatarDraft({ ...avatarDraft, clothesColor })} className="mt-3" />
                </div>
              </div>
            </div>
            </div>
            <div className="border-t border-[#eadfce] bg-white px-5 py-4 sm:px-6 lg:border-0 lg:pt-2">
              <Button type="button" variant="mustard" size="lg" className="w-full" onClick={saveAvatar}>
                Save
              </Button>
            </div>
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
    <fieldset className={`${compact ? "mt-1 flex flex-wrap items-center gap-x-2" : ""} ${className}`}>
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

function missingProfileHint(item: ChildDraft | undefined) {
  if (!item) return "Add this child's details to continue.";
  if (item.nicknameMessage && item.nicknameMessage !== "Making a nickname…") return item.nicknameMessage;
  if (item.nickname.trim() && isRudeNickname(item.nickname)) return "Choose a kinder nickname.";
  const missing: string[] = [];
  if (!item.firstName.trim()) missing.push("a first name");
  if (!isBirthdayAllowed(item.birthday)) missing.push("a birthday for ages 2 to 15");
  if (!item.gender) missing.push("a gender");
  if (!item.nickname.trim()) missing.push(item.nicknameMessage === "Making a nickname…" ? "a moment for the nickname" : "a nickname");
  if (missing.length === 0) return "";
  const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(", ")} and ${missing.at(-1)}`;
  return `Add ${list} to continue.`;
}

function HintedButton({
  hint,
  disabled,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Button> & { hint: string }) {
  const [open, setOpen] = useState(false);
  const blocked = Boolean(disabled && hint);
  const button = (
    <Button {...props} disabled={disabled} className={blocked ? `${className ?? ""} w-full max-w-none` : className}>
      {children}
    </Button>
  );
  if (!blocked) return button;
  return (
    <span
      className={`footer-cta group relative${open ? " is-open" : ""}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={() => setOpen(true)}
    >
      {button}
      <span role="tooltip" className="footer-hint">
        {hint}
      </span>
    </span>
  );
}

function EmojiRocket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path fill="#F5A623" d="M10.2 16.2 12 22l1.8-5.8z" />
      <path fill="#FFE14D" d="M11.1 16.2 12 20.2l.9-4z" />
      <path fill="#DD2E44" d="M8.6 11.2 4.2 17.4l4.6-.6zM15.4 11.2 19.8 17.4l-4.6-.6z" />
      <path fill="#F4F7FB" d="M8.4 8.2h7.2c.2 2.4.2 6.2 0 8.6a8 8 0 0 1-7.2 0c-.2-2.4-.2-6.2 0-8.6z" />
      <path fill="#DD2E44" d="M12 2.2 16.1 8.2H7.9z" />
      <circle cx="12" cy="11.2" r="2.05" fill="#3B88C3" />
      <circle cx="11.35" cy="10.55" r="0.65" fill="#fff" />
    </svg>
  );
}

function SolidTrophy({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z"
      />
    </svg>
  );
}

function ClubCelebration({ names }: { names: string[] }) {
  const line =
    names.length === 0
      ? "Time to explore."
      : names.length === 1
        ? `${names[0]} is ready to explore.`
        : `${names.slice(0, -1).join(", ")} and ${names.at(-1)} are ready to explore.`;
  return (
    <div className="celebrate" role="status" aria-live="polite">
      {CONFETTI.map(([left, color, delay, duration, drift]) => (
        <span
          key={`${left}-${delay}`}
          className="confetti"
          style={{
            left,
            background: color,
            width: "16px",
            height: "22px",
            animationDelay: delay,
            animationDuration: duration,
            ["--drift" as string]: drift,
          }}
        />
      ))}
      <div className="celebrate-card">
        <Trophy className="celebrate-trophy" strokeWidth={2.2} aria-hidden="true" />
        <p className="celebrate-title">You&apos;re in the club!</p>
        <p className="celebrate-copy">{line}</p>
      </div>
    </div>
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
    <fieldset className={`${compact ? "mt-1 flex flex-wrap items-center gap-x-2" : ""} ${className}`}>
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

