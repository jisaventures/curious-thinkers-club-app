"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { checkNickname, completeOnboarding } from "@/app/onboarding/actions";
import { FamilyAvatar } from "@/components/brand/family-avatar";
import { GROUP_ICONS, GroupIcon, type GroupIconId } from "@/components/brand/group-icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ACCESSORY_COLOURS, AVATAR_COLOURS, CLOTHES_COLOURS, EYE_COLOURS, GROUP_BACKGROUND_COLOURS, GROUP_ICON_COLOURS, HAIR_COLOURS, SKIN_COLOURS } from "@/lib/avatar-style";
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
import { childFirstNameProblem, groupNameProblem, isUnsafeChildName } from "@/lib/unsafe-language";
import { Check, ChevronLeft, ChevronRight, Info, Mars, RefreshCw, Rocket, Trophy, Venus, X } from "lucide-react";

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
type GroupType = "Family" | "School" | "Team" | "Club" | "Homeschool" | "Other";
type GroupIconDraft = { icon: GroupIconId; background: string; colour: string };

const GROUP_TYPES: GroupType[] = ["Family", "School", "Team", "Club", "Homeschool", "Other"];

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

export function OnboardingWizard({ shopFirstName, shopLocation }: { shopFirstName: string | null; shopLocation: string }) {
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
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<GroupType | "">("");
  const [leaderName, setLeaderName] = useState(shopFirstName ?? "");
  const [groupIcon, setGroupIcon] = useState<GroupIconDraft>({ icon: "star", background: "2f9a4a", colour: "fff4dc" });
  const [groupAvatarOpen, setGroupAvatarOpen] = useState(false);
  const [groupAvatarDraft, setGroupAvatarDraft] = useState<GroupIconDraft | null>(null);
  const tabsRef = useRef<HTMLOListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const child = children[editing];
  const progressLabels = ["Welcome", "Create Group", ...Array.from({ length: count }, (_, index) => `Child ${index + 1} Profile`)];
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
        group: {
          name: groupName.trim(),
          type: groupType,
          location: shopLocation,
          leaderName: leaderName.trim(),
          icon: groupIcon.icon,
          background: groupIcon.background,
          colour: groupIcon.colour,
        },
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
    <div className={screen === "family" ? "create-group-screen w-full" : "w-full"}>
      <div className={`step-tabs relative max-lg:sticky max-lg:top-[var(--site-header-h)] max-lg:z-30 max-lg:-mx-3 max-lg:bg-[#fffdf8] max-lg:px-3 max-lg:pb-3 sm:max-lg:-mx-5 sm:max-lg:px-5 md:max-lg:-mx-7 md:max-lg:px-7 ${screen === "family" ? "mb-3 lg:mb-5" : "mb-5"}`}>
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
                className="step-pill ctc-button pointer-events-none relative z-10 -mb-3"
                data-variant={done ? "green" : current ? "mustard" : "grey"}
                data-size="sm"
              >
                {done && <Check className="mr-1 size-3.5 shrink-0" strokeWidth={3} aria-hidden="true" />}
                {done ? "Completed" : `Step ${index + 1}`}
              </span>
              <div className={`step-tab flex min-h-14 w-full items-center justify-center rounded-2xl px-2 pt-5 pb-2 text-center font-display text-base leading-tight font-bold lg:min-h-16 lg:px-2 lg:py-3 lg:text-xl ${tabClass}`}>
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
            className="tab-nudge tab-nudge-left"
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
            className="tab-nudge tab-nudge-right"
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
            {shopFirstName ? `Welcome ${shopFirstName}` : "Welcome Curious Thinkers!"}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#5e7266] lg:text-xl">
            This club must be managed by a parent or guardian. Children do not get their own login.
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
          <h1 className="step-title text-3xl">{groupName.trim() && !groupNameProblem(groupName) ? groupName.trim() : "Create group"}</h1>
          <div className="mt-3 flex flex-col gap-3 lg:mt-4 lg:grid lg:grid-cols-[11rem_12.5rem_minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-4">
            <div className="flex items-center gap-3 lg:contents">
            <button
              type="button"
              onClick={() => {
                setGroupAvatarDraft(groupIcon);
                setGroupAvatarOpen(true);
              }}
              className="group relative size-24 shrink-0 overflow-hidden rounded-[28px] sm:size-28 lg:row-span-2 lg:size-auto lg:h-full lg:w-full"
              aria-label="Edit group icon"
            >
              <GroupIcon icon={groupIcon.icon} background={groupIcon.background} colour={groupIcon.colour} className="size-full" title="Group icon" />
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/45" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-2 text-center text-sm font-extrabold text-white">
                Edit
              </span>
            </button>
            <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_8.25rem] items-start gap-2 lg:contents">
            <div className="flex min-w-0 flex-col lg:col-start-2 lg:row-start-1">
              <Label htmlFor="groupType" className="mb-1 flex h-4 items-center text-xs lg:mb-2 lg:h-5 lg:text-sm">Group type<span className="ml-0.5 text-xs text-[#c45b73]" aria-hidden="true">*</span></Label>
              <select id="groupType" value={groupType} onChange={(event) => setGroupType(event.target.value as GroupType)} className="h-9 w-full rounded-2xl border border-[#eadfce] bg-white px-3 text-sm text-[#173528] outline-none focus:border-[#1e4d3a] focus:ring-2 focus:ring-[#1e4d3a]/20 lg:h-14 lg:px-4 lg:text-base">
                <option value="">Type</option>
                {GROUP_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="flex min-w-0 flex-col lg:col-span-2 lg:col-start-3 lg:row-start-2">
              <div className="mb-1 flex h-4 items-center gap-1.5 lg:mb-2 lg:h-5">
                <Label htmlFor="groupSize" className="whitespace-nowrap text-xs lg:text-sm">Number of members</Label>
                <span className="group relative inline-flex">
                  <button type="button" className="inline-flex size-4 items-center justify-center rounded-full text-[#306a51]" aria-label="About group size">
                    <Info className="size-4" strokeWidth={2.4} aria-hidden="true" />
                  </button>
                  <span role="tooltip" className="absolute bottom-[calc(100%+0.45rem)] left-0 z-20 hidden w-56 rounded-xl bg-[#1e4d3a] px-3 py-2 text-left text-xs leading-snug font-semibold text-white group-hover:block group-focus-within:block">
                    The maximum per group is 5. To add more, <a href="mailto:hello@curiousthinkersclub.com" className="font-extrabold underline">contact us</a>.
                  </span>
                </span>
              </div>
              <Input
                id="groupSize"
                type="number"
                min={1}
                max={5}
                inputMode="numeric"
                value={count}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  if (!Number.isFinite(next)) return;
                  resize(Math.min(5, Math.max(1, Math.round(next))));
                }}
                className="h-9 w-full px-3 text-sm lg:h-14 lg:px-4 lg:text-base"
              />
            </div>
            <div className="col-span-2 flex min-w-0 flex-col lg:col-span-1 lg:col-start-2 lg:row-start-2">
              <Label htmlFor="groupLocation" className="mb-1 flex h-4 items-center text-xs lg:mb-2 lg:h-5 lg:text-sm">Location</Label>
              <Input id="groupLocation" value={shopLocation} disabled className="h-9 px-3 text-sm lg:h-14 lg:px-4 lg:text-base" />
            </div>
            </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:contents">
            <div className="flex min-w-0 flex-col lg:col-start-3 lg:row-start-1">
              <Label htmlFor="groupName" className="mb-1 flex h-4 items-center text-xs lg:mb-2 lg:h-5 lg:text-sm">Group name<span className="ml-0.5 text-xs text-[#c45b73]" aria-hidden="true">*</span></Label>
              <Input id="groupName" value={groupName} onChange={(event) => setGroupName(event.target.value.replace(/\s+/g, " ").slice(0, 32))} maxLength={32} autoComplete="off" aria-invalid={Boolean(groupNameProblem(groupName))} className="h-9 px-3 text-sm lg:h-14 lg:px-4 lg:text-base" />
              {groupNameProblem(groupName) && <p className="mt-1 text-sm font-bold text-[#8a4b3a]">{groupNameProblem(groupName)}</p>}
            </div>
            <div className="flex min-w-0 flex-col lg:col-start-4 lg:row-start-1">
              <Label htmlFor="leaderName" className="mb-1 flex h-4 items-center text-xs whitespace-nowrap lg:mb-2 lg:h-5 lg:text-sm">Group Leader First Name only<span className="ml-0.5 text-xs text-[#c45b73]" aria-hidden="true">*</span></Label>
              <Input id="leaderName" value={leaderName} onChange={(event) => setLeaderName(event.target.value.replace(/\s+/g, "").slice(0, 15))} maxLength={15} autoComplete="given-name" aria-invalid={Boolean(childFirstNameProblem(leaderName))} className="h-9 px-3 text-sm lg:h-14 lg:px-4 lg:text-base" />
              {childFirstNameProblem(leaderName) && <p className="mt-1 text-sm font-bold text-[#8a4b3a]">{childFirstNameProblem(leaderName)}</p>}
            </div>
            </div>
          </div>
        </section>
      )}

      {screen === "details" && child && (
        <section className={stepCard}>
          <h1 className="step-title text-4xl lg:text-3xl">{child.firstName.trim() && !isUnsafeChildName(child.firstName) ? child.firstName.trim() : `Child ${editing + 1}`}</h1>
          <div className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] items-stretch gap-x-3 gap-y-3 sm:grid-cols-[auto_auto_minmax(0,1fr)] sm:gap-x-3 lg:mt-3 lg:grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-4">
            <div className="col-span-2 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:contents">
            <button
              type="button"
              onClick={openAvatarModal}
              className="group relative size-40 shrink-0 self-center overflow-hidden rounded-[28px] bg-[#f6efe2] justify-self-center sm:row-span-2 sm:size-44 lg:size-50"
              aria-label="Edit avatar"
            >
              <FamilyAvatar build={child.avatar} className="size-full" title="Child avatar" />
              <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/45" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-2 text-center text-sm font-extrabold text-white">
                Edit
              </span>
            </button>
            <div className="flex min-w-0 flex-col gap-3 sm:contents">
            <fieldset className="col-start-2 row-start-1 flex flex-col self-start justify-self-start">
              <legend className="m-0 mb-2 flex h-5 items-center text-sm font-extrabold text-[#1e4d3a]">Gender<span className="ml-0.5 text-xs text-[#c45b73]" aria-hidden="true">*</span></legend>
              <div className="flex gap-2">
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
                    aria-label={label}
                    aria-pressed={child.gender === gender}
                    onClick={() => {
                      const base = gender === "girl" ? girlAvatar() : boyAvatar();
                      patchChild({
                        gender,
                        avatar: { ...child.avatar, top: base.top, clothing: base.clothing, eyebrows: "defaultNatural", facialHair: "none" },
                      });
                    }}
                    className={`inline-flex size-10 items-center justify-center rounded-2xl border-2 sm:size-12 lg:size-14 ${child.gender === gender ? `border-[#306A51] ${gender === "boy" ? "bg-[#3d6fbf] text-white" : gender === "girl" ? "bg-[#e36aa2] text-white" : "bg-[#1e4d3a] text-white"}` : "border-transparent bg-[#f6efe2] text-[#1e4d3a]"}`}
                  >
                    {gender === "boy" && <Mars className="size-5 sm:size-6 lg:size-7" strokeWidth={3} aria-hidden="true" />}
                    {gender === "girl" && <Venus className="size-5 sm:size-6 lg:size-7" strokeWidth={3} aria-hidden="true" />}
                    {gender === "unspecified" && <X className="size-5 sm:size-6 lg:size-7" strokeWidth={3} aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex min-w-0 flex-col sm:col-span-1 sm:col-start-3 sm:row-start-2 lg:col-span-3 lg:col-start-2">
              <div className="mb-2 flex h-5 items-center gap-1.5">
                <Label htmlFor="nickname">Username<span className="ml-0.5 text-xs text-[#c45b73]" aria-hidden="true">*</span></Label>
                <span className="group relative inline-flex">
                  <button type="button" className="inline-flex size-4 items-center justify-center rounded-full text-[#306a51]" aria-label="About usernames">
                    <Info className="size-4" strokeWidth={2.4} aria-hidden="true" />
                  </button>
                  <span role="tooltip" className="pointer-events-none absolute bottom-[calc(100%+0.45rem)] left-0 z-20 hidden w-56 max-w-[calc(100vw-2rem)] rounded-xl bg-[#1e4d3a] px-3 py-2 text-left text-xs leading-snug font-semibold text-white group-hover:block group-focus-within:block sm:right-0 sm:left-auto lg:right-auto lg:left-0">
                    A playful nickname is made for them. Re-generate it if you want a different one.
                  </span>
                </span>
              </div>
              <div className="flex w-full items-center gap-2">
                <Input id="nickname" value={child.nickname} disabled className="min-w-0 flex-1 max-sm:h-10 max-sm:px-1.5 max-sm:text-xs" />
                <span className="inline-flex pb-[5px]">
                  <Button type="button" variant="green" size="sm" className="regen-button shrink-0" aria-label="Re-generate" onClick={regenerateNickname}>
                    <RefreshCw className="size-5 sm:size-6 lg:hidden" strokeWidth={3} aria-hidden="true" />
                    <span className="hidden lg:inline">Re-generate</span>
                  </Button>
                </span>
              </div>
              {child.nicknameMessage && <p className="text-sm font-bold text-[#8a4b3a]">{child.nicknameMessage}</p>}
            </div>
            </div>
            </div>
            <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_7.55rem] items-start gap-3 sm:contents">
              <div className="flex min-w-0 flex-col sm:col-start-3 sm:row-start-1">
                <Label htmlFor="firstName" className="mb-2 flex h-5 items-center whitespace-nowrap max-sm:!text-[12px]">First name only<span className="ml-0.5 text-xs text-[#c45b73]" aria-hidden="true">*</span></Label>
                <Input
                  id="firstName"
                  value={child.firstName}
                  onChange={(event) => patchChild({ firstName: event.target.value.replace(/\s+/g, "").slice(0, 15) })}
                  maxLength={15}
                  autoComplete="off"
                  aria-invalid={Boolean(childFirstNameProblem(child.firstName))}
                  className="lg:h-14"
                />
                {childFirstNameProblem(child.firstName) && <p className="mt-1 text-sm font-bold text-[#8a4b3a]">{childFirstNameProblem(child.firstName)}</p>}
              </div>
              <div className="birthday-compact flex min-w-0 flex-col sm:col-start-2 sm:row-start-2 sm:w-[10rem] lg:col-start-4 lg:row-start-1 lg:w-auto">
                <Label htmlFor="birthday" className="mb-2 flex h-5 items-center whitespace-nowrap max-sm:!text-[12px]">Birthday<span className="ml-0.5 text-xs text-[#c45b73]" aria-hidden="true">*</span></Label>
                <BirthdayPicker id="birthday" value={child.birthday} onChange={(birthday) => patchChild({ birthday })} />
              </div>
            </div>
          </div>

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
              className="footer-cta footer-back"
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
              <Rocket className="size-7 shrink-0" strokeWidth={2.4} aria-hidden="true" />
            </Button>
          )}
          {screen === "family" && (
            <Button
              type="button"
              variant="mustard"
              size="lg"
              className="footer-cta gap-2"
              disabled={!groupName.trim() || Boolean(groupNameProblem(groupName)) || !groupType || !leaderName.trim() || Boolean(childFirstNameProblem(leaderName))}
              onClick={() => {
                setEditing(0);
                setMessage(null);
                setScreen("details");
              }}
            >
              {count === 1 ? "Add your child" : `Add ${count} children`}
              <SolidPlus className="size-7 shrink-0" />
            </Button>
          )}
          {screen === "details" && editing < count - 1 && (
            <HintedButton type="button" variant="mustard" size="lg" className="footer-cta" disabled={pending || !profileReady} hint={profileHint} onClick={() => void continueProfile()}>
              Next child
            </HintedButton>
          )}
          {screen === "details" && editing >= count - 1 && (
            <HintedButton type="button" variant="green" size="lg" className="footer-cta gap-2" disabled={pending || !profileReady} hint={profileHint} onClick={() => void continueProfile()}>
              {pending ? "Starting…" : "Enter Club"}
              <SolidTrophy className="size-7 shrink-0 text-[#e8a428]" />
            </HintedButton>
          )}
        </div>
      </footer>

      {celebrating && (
        <ClubCelebration
          members={children.slice(0, count).map((item) => ({
            firstName: item.firstName.trim(),
            nickname: item.nickname.trim(),
            avatar: item.avatar,
          }))}
        />
      )}

      {groupAvatarOpen && groupAvatarDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setGroupAvatarOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="group-avatar-title"
            className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-xl"
            onKeyDown={(event) => {
              if (event.key === "Escape") setGroupAvatarOpen(false);
            }}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#eadfce] bg-white px-5 py-4 sm:px-6">
              <h2 id="group-avatar-title" className="step-title text-3xl">Edit group icon</h2>
              <button type="button" onClick={() => setGroupAvatarOpen(false)} className="rounded-full p-2 text-[#1e4d3a] hover:bg-[#f6efe2]" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="avatar-modal-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="lg:self-stretch lg:border-r lg:border-[#b9b5ad] lg:pr-5">
                  <div className="flex justify-center rounded-[24px] bg-[#f6efe2] p-3">
                    <GroupIcon icon={groupAvatarDraft.icon} background={groupAvatarDraft.background} colour={groupAvatarDraft.colour} className="h-40 w-40 rounded-[24px]" title="Group icon preview" />
                  </div>
                  <ColourRow legend="Background" value={groupAvatarDraft.background} colours={GROUP_BACKGROUND_COLOURS} onChange={(background) => setGroupAvatarDraft({ ...groupAvatarDraft, background })} className="mt-3" />
                  <ColourRow legend="Icon colour" value={groupAvatarDraft.colour} colours={GROUP_ICON_COLOURS} onChange={(colour) => setGroupAvatarDraft({ ...groupAvatarDraft, colour })} className="mt-3" />
                </div>
                <fieldset>
                  <legend className="text-sm font-extrabold text-[#1e4d3a]">Icon</legend>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                    {GROUP_ICONS.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        aria-label={icon}
                        aria-pressed={groupAvatarDraft.icon === icon}
                        onClick={() => setGroupAvatarDraft({ ...groupAvatarDraft, icon })}
                        className={`aspect-square w-full overflow-hidden rounded-2xl ${groupAvatarDraft.icon === icon ? "ring-2 ring-[#173528]" : ""}`}
                      >
                        <GroupIcon icon={icon} background={groupAvatarDraft.background} colour={groupAvatarDraft.colour} className="size-full" />
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>
            <div className="border-t border-[#eadfce] bg-white px-5 py-4 sm:px-6">
              <Button type="button" variant="mustard" size="lg" className="w-full" onClick={() => { setGroupIcon(groupAvatarDraft); setGroupAvatarOpen(false); }}>
                Save
              </Button>
            </div>
          </div>
        </div>
      )}

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
                    <ColourRow legend={avatarDraft.accessory === "eyepatch" ? "Eye patch colour" : "Glasses colour"} value={avatarDraft.accessoryColor} colours={ACCESSORY_COLOURS} onChange={(accessoryColor) => setAvatarDraft({ ...avatarDraft, accessoryColor })} className="mt-3" />
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
  const nameProblem = childFirstNameProblem(item.firstName);
  if (nameProblem) return nameProblem;
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

function SolidPlus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#fff"
        fillRule="evenodd"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20m-1 4.5h2V11h4.5v2H13v4.5h-2V13H6.5v-2H11z"
      />
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

function ClubCelebration({ members }: { members: Array<{ firstName: string; nickname: string; avatar: AvatarBuild }> }) {
  const names = members.map((member) => member.firstName).filter(Boolean);
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
        {members.length > 0 && (
          <ul className="celebrate-kids">
            {members.map((member) => (
              <li key={`${member.firstName}-${member.nickname}`}>
                <FamilyAvatar build={member.avatar} className="celebrate-avatar" title={member.firstName || "Child"} />
                <p className="celebrate-name">{member.firstName || "Child"}</p>
                {member.nickname && <p className="celebrate-user">@{member.nickname}</p>}
              </li>
            ))}
          </ul>
        )}
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
      <div className={`${compact ? "flex-nowrap gap-1" : "mt-2 flex-wrap gap-1 sm:gap-2"} flex`}>
        {colours.map((colour) => {
          const hex = colour.hex.replace("#", "");
          return (
            <button
              key={colour.id}
              type="button"
              aria-label={colour.label}
              aria-pressed={value.toLowerCase() === hex.toLowerCase()}
              onClick={() => onChange(hex)}
              className={`${compact ? "size-5 shrink-0" : "size-8 shrink-0 sm:size-11"} rounded-full border-2 ${value.toLowerCase() === hex.toLowerCase() ? "border-[#173528]" : "border-[#eadfce]"}`}
              style={{ background: colour.hex }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

