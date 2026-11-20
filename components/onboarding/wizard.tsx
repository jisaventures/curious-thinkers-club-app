"use client";

import { useMemo, useState } from "react";
import { checkNickname, completeOnboarding } from "@/app/onboarding/actions";
import { FamilyAvatar } from "@/components/brand/family-avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVATAR_COLOURS, AVATAR_FACES, AVATAR_HATS, HAIR_COLOURS, HAIR_STYLES, type AvatarFaceId, type AvatarHatId, type HairColourId, type HairStyleId } from "@/lib/avatar-style";
import { isRudeNickname, suggestNickname } from "@/lib/nicknames";

type Gender = "boy" | "girl" | "other";

type ChildDraft = {
  firstName: string;
  nickname: string;
  nicknameTouched: boolean;
  ageYears: string;
  gender: Gender | "";
  avatarBg: string;
  avatarFace: AvatarFaceId;
  hairStyle: HairStyleId;
  hairColour: HairColourId;
  glasses: boolean;
  hat: AvatarHatId;
  nicknameMessage: string;
};

const emptyChild = (): ChildDraft => ({
  firstName: "",
  nickname: "",
  nicknameTouched: false,
  ageYears: "",
  gender: "",
  avatarBg: AVATAR_COLOURS[0].id,
  avatarFace: AVATAR_FACES[0],
  hairStyle: "short",
  hairColour: "brown",
  glasses: false,
  hat: "none",
  nicknameMessage: "",
});

export function OnboardingWizard({ shopFirstName }: { shopFirstName: string | null }) {
  const [step, setStep] = useState(0);
  const [terms, setTerms] = useState(false);
  const [count, setCount] = useState(1);
  const [children, setChildren] = useState<ChildDraft[]>([emptyChild()]);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const childIndex = step - 3;
  const child = children[childIndex];
  const lastStep = 2 + count;

  const siblingNames = useMemo(
    () => children.filter((_, index) => index !== childIndex).map((item) => item.nickname),
    [children, childIndex],
  );

  function resize(nextCount: number) {
    setCount(nextCount);
    setChildren((current) => {
      const next = current.slice(0, nextCount);
      while (next.length < nextCount) next.push(emptyChild());
      return next;
    });
  }

  function patchChild(patch: Partial<ChildDraft>) {
    setChildren((current) => current.map((item, index) => (index === childIndex ? { ...item, ...patch } : item)));
  }

  function updateFirstName(value: string) {
    const suggestion = suggestNickname(value, siblingNames);
    patchChild({
      firstName: value,
      nickname: child?.nicknameTouched ? child.nickname : suggestion,
      nicknameMessage: "",
    });
  }

  async function reviewNickname(value: string) {
    const local = value.trim();
    if (!local) {
      patchChild({ nicknameMessage: "" });
      return;
    }
    if (siblingNames.some((name) => name.toLowerCase() === local.toLowerCase())) {
      patchChild({ nicknameMessage: "Another child in this family already has that nickname." });
      return;
    }
    if (isRudeNickname(local)) {
      patchChild({ nicknameMessage: "Choose a kinder nickname." });
      return;
    }
    const result = await checkNickname(local, child?.firstName ?? "");
    patchChild({ nicknameMessage: result.ok ? "" : result.message });
  }

  function childReady(item: ChildDraft) {
    return (
      item.firstName.trim().length > 0 &&
      item.nickname.trim().length > 0 &&
      !item.nicknameMessage &&
      !isRudeNickname(item.nickname) &&
      Number(item.ageYears) >= 2 &&
      Number(item.ageYears) <= 12 &&
      item.gender !== ""
    );
  }

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
        avatarBg: item.avatarBg,
        avatarFace: item.avatarFace,
        hairStyle: item.hairStyle,
        hairColour: item.hairColour,
        glasses: item.glasses,
        hat: item.hat,
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
    <div className="mx-auto w-full max-w-lg">
      <ol className="mb-5 flex gap-2" aria-label="Onboarding progress">
        {Array.from({ length: lastStep + 1 }, (_, index) => (
          <li key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? "bg-[#1e4d3a]" : "bg-[#eadfce]"}`} />
        ))}
      </ol>

      {step === 0 && (
        <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Welcome</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-[#1e4d3a] sm:text-5xl">
            Welcome{shopFirstName ? ` ${shopFirstName}` : ""}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#3d5348]">
            {shopFirstName
              ? "Your first name comes from your Curious Thinkers shop account."
              : "Your first name will come from your Curious Thinkers shop account when that account is created."}
          </p>
          <Button type="button" className="mt-6 w-full" size="lg" onClick={() => setStep(1)}>
            Get started
          </Button>
        </section>
      )}

      {step === 1 && (
        <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
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
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button type="button" className="flex-1" disabled={!terms} onClick={() => setStep(2)}>
              Continue
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
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
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button type="button" className="flex-1" onClick={() => setStep(3)}>
              Add {count === 1 ? "your child" : `${count} children`}
            </Button>
          </div>
        </section>
      )}

      {child && (
        <section className="rounded-[28px] bg-white p-5 shadow-sm sm:p-7">
          <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">
            Child {childIndex + 1} of {count}
          </p>
          <h1 className="mt-2 font-display text-4xl text-[#1e4d3a]">Who is this thinker?</h1>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name only</Label>
              <Input id="firstName" value={child.firstName} onChange={(event) => updateFirstName(event.target.value)} maxLength={40} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input id="age" inputMode="numeric" value={child.ageYears} onChange={(event) => patchChild({ ageYears: event.target.value })} placeholder="2–12" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <Label htmlFor="nickname">Nickname</Label>
            <Input
              id="nickname"
              value={child.nickname}
              maxLength={24}
              onChange={(event) => patchChild({ nickname: event.target.value, nicknameTouched: true, nicknameMessage: "" })}
              onBlur={(event) => void reviewNickname(event.target.value)}
            />
            <p className="text-xs leading-relaxed text-[#5e7266]">
              We make one from the first name. You can type your own. It has to be free, and it can&apos;t include rude words.
            </p>
            {child.nicknameMessage && <p className="text-sm font-bold text-[#8a4b3a]">{child.nicknameMessage}</p>}
          </div>

          <fieldset className="mt-5">
            <legend className="text-sm font-extrabold text-[#1e4d3a]">Gender</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["boy", "girl", "other"] as const).map((gender) => (
                <button
                  key={gender}
                  type="button"
                  aria-pressed={child.gender === gender}
                  onClick={() => patchChild({ gender })}
                  className={`h-12 rounded-2xl text-sm font-extrabold capitalize ${child.gender === gender ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
                >
                  {gender}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-extrabold text-[#1e4d3a]">Background colour</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {AVATAR_COLOURS.map((colour) => (
                <button
                  key={colour.id}
                  type="button"
                  aria-label={colour.label}
                  aria-pressed={child.avatarBg === colour.id}
                  onClick={() => patchChild({ avatarBg: colour.id })}
                  className={`size-11 rounded-full border-2 ${child.avatarBg === colour.id ? "border-[#173528]" : "border-white"}`}
                  style={{ background: colour.hex }}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-extrabold text-[#1e4d3a]">Face</legend>
            <p className="mt-1 text-xs text-[#5e7266]">Head and shoulders for now. Packs will unlock outfits later.</p>
            <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {AVATAR_FACES.map((face) => (
                <button
                  key={face}
                  type="button"
                  aria-label={face}
                  aria-pressed={child.avatarFace === face}
                  onClick={() => patchChild({ avatarFace: face })}
                  className={`rounded-2xl border p-1 ${child.avatarFace === face ? "border-[#1e4d3a] bg-[#e7f5e1]" : "border-[#eadfce] bg-white"}`}
                >
                  <FamilyAvatar
                    colour={child.avatarBg}
                    face={face}
                    hairStyle={child.hairStyle}
                    hairColour={child.hairColour}
                    glasses={child.glasses}
                    hat={child.hat}
                    className="mx-auto h-24 w-full"
                  />
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-extrabold text-[#1e4d3a]">Hair</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {HAIR_STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  aria-pressed={child.hairStyle === style}
                  onClick={() => patchChild({ hairStyle: style })}
                  className={`h-11 rounded-2xl text-sm font-extrabold capitalize ${child.hairStyle === style ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
                >
                  {style}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {HAIR_COLOURS.map((colour) => (
                <button
                  key={colour.id}
                  type="button"
                  aria-label={colour.label}
                  aria-pressed={child.hairColour === colour.id}
                  onClick={() => patchChild({ hairColour: colour.id })}
                  className={`size-11 rounded-full border-2 ${child.hairColour === colour.id ? "border-[#173528]" : "border-white"}`}
                  style={{ background: colour.hex }}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-5">
            <legend className="text-sm font-extrabold text-[#1e4d3a]">Extras</legend>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button
                type="button"
                aria-pressed={child.glasses}
                onClick={() => patchChild({ glasses: !child.glasses })}
                className={`h-11 rounded-2xl text-sm font-extrabold ${child.glasses ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
              >
                Glasses
              </button>
              {AVATAR_HATS.filter((hat) => hat !== "none").map((hat) => (
                <button
                  key={hat}
                  type="button"
                  aria-pressed={child.hat === hat}
                  onClick={() => patchChild({ hat: child.hat === hat ? "none" : hat })}
                  className={`h-11 rounded-2xl text-sm font-extrabold capitalize ${child.hat === hat ? "bg-[#1e4d3a] text-white" : "bg-[#f6efe2] text-[#1e4d3a]"}`}
                >
                  {hat}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-[#5e7266]">The cap and the beanie have a yellow light bulb on the front.</p>
          </fieldset>

          {message && <p className="mt-4 text-sm font-bold text-[#8a4b3a]">{message}</p>}
          <div className="mt-6 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(step - 1)} disabled={pending}>
              Back
            </Button>
            {childIndex < count - 1 ? (
              <Button type="button" className="flex-1" disabled={!childReady(child)} onClick={() => setStep(step + 1)}>
                Next child
              </Button>
            ) : (
              <Button type="button" className="flex-1" size="lg" disabled={!childReady(child) || !terms || pending} onClick={() => void finish()}>
                {pending ? "Starting…" : "Get started"}
              </Button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
