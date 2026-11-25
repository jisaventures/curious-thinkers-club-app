"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Check, Hand, Lock } from "lucide-react";
import { markStepForChildren } from "@/app/club/actions";
import { Avatar } from "@/components/brand/avatar";
import { BookCover } from "@/components/club/book-cover";
import { VideoGuide } from "@/components/club/video-guide";
import { Button } from "@/components/ui/button";
import { formatPounds, shortName } from "@/lib/format";
import { shopUrl } from "@/lib/env";
import type { loadPackPage } from "@/lib/club/data";

type PackData = Awaited<ReturnType<typeof loadPackPage>>;
type OwnedPack = Extract<PackData, { owned: true }>;
type ChildView = OwnedPack["childViews"][number];
type Step = OwnedPack["steps"][number];

const PRAISE = ["Brilliant work, explorer!", "You're a natural historian!", "Amazing job!"];

export function PackView({ data }: { data: PackData }) {
  if (!data.owned) return <LockedPack data={data} />;
  return <LivePack data={data} />;
}

function LivePack({ data }: { data: OwnedPack }) {
  const serverStamp = data.childViews.map((child) => `${child.id}:${child.nextPosition}:${child.finished}`).join("|");
  const [seenStamp, setSeenStamp] = useState(serverStamp);
  const [focusId, setFocusId] = useState(data.focus?.id ?? data.childViews[0]?.id ?? "");
  const [childViews, setChildViews] = useState(data.childViews);
  const [modalStep, setModalStep] = useState<number | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [videoStep, setVideoStep] = useState<number | null>(null);
  const [praise, setPraise] = useState<{ position: number; childIds: string[]; message: string; points: number } | null>(null);
  const [celebration, setCelebration] = useState<{ points: number } | null>(null);
  const viewsBeforeMark = useRef(data.childViews);
  if (seenStamp !== serverStamp) {
    setSeenStamp(serverStamp);
    setChildViews(data.childViews);
  }

  const focus = childViews.find((child) => child.id === focusId) ?? childViews[0] ?? null;
  const activePosition = praise ? null : focus && !focus.finished ? (focus.nextPosition ?? data.steps[0]?.position ?? null) : null;
  const doneCount = focus?.finished ? data.steps.length : Math.max(0, (focus?.nextPosition ?? 1) - 1);
  const ratio = data.steps.length ? doneCount / data.steps.length : 0;

  function selectMember(childId: string) {
    setFocusId(childId);
    setPraise(null);
    const child = childViews.find((item) => item.id === childId);
    const position = child?.finished ? data.steps.at(-1)?.position : child?.nextPosition;
    if (position) document.getElementById(`journey-step-${position}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.history.replaceState(null, "", `/club/packs/${data.pack.slug}?mode=solo&child=${childId}`);
  }

  function advance(childIds: string[]) {
    viewsBeforeMark.current = childViews;
    const positions = data.steps.map((item) => item.position);
    setChildViews((current) =>
      current.map((child) => {
        if (!childIds.includes(child.id) || child.nextPosition == null) return child;
        const following = positions.find((position) => position > child.nextPosition!) ?? null;
        return { ...child, started: true, finished: following == null, nextPosition: following, resumeSeconds: 0 };
      }),
    );
  }

  async function complete(position: number, childIds: string[]) {
    const step = data.steps.find((item) => item.position === position);
    if (!step || childIds.length === 0 || saving) return;
    setSaving(true);
    const result = await markStepForChildren({ stepId: step.id, childIds });
    setSaving(false);
    if (!result.ok) return;
    advance(childIds);
    setModalStep(null);
    if (result.certificate) {
      const earned = data.steps.reduce((sum, item) => sum + item.points, 0) + data.pack.certificate_bonus_points;
      setCelebration({ points: earned });
      setPraise(null);
      return;
    }
    setPraise({
      position,
      childIds,
      message: PRAISE[Math.floor(Math.random() * PRAISE.length)] ?? PRAISE[0],
      points: result.points,
    });
  }

  function askToComplete(position: number) {
    const here = onStep(childViews, position);
    if (here.length === 0) return;
    if (here.length === 1) {
      void complete(position, [here[0].id]);
      return;
    }
    setPicked(here.map((child) => child.id));
    setModalStep(position);
  }

  function carryOn() {
    const next = praise ? data.steps.find((step) => step.position > praise.position) : null;
    setPraise(null);
    if (next) document.getElementById(`journey-step-${next.position}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const ordered = [...data.steps].reverse();

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,3fr)]">
      <aside className="min-w-0">
        <Link href="/club" className="inline-flex text-sm font-extrabold text-[#306A51] no-underline">
          ← My Quests
        </Link>
        <div className="mt-4 lg:block">
          <div className="flex gap-4 lg:block">
            <div className="aspect-[1/1.414] w-24 shrink-0 overflow-hidden rounded-[20px] shadow-[0_10px_24px_rgba(23,53,42,0.12)] lg:w-full">
              <BookCover tone={data.pack.cover_tone} title={data.pack.title} className="h-full w-full rounded-[20px]" />
            </div>
            <div className="min-w-0 flex-1 lg:mt-4">
              <p className="text-xs font-extrabold tracking-wide text-[#306A51] uppercase">Quest · {seriesLabel(data.pack.title, data.pack.theme)}</p>
              <h1 className="mt-1 font-display text-3xl leading-tight font-bold text-[#17352A] lg:text-4xl">{data.pack.title}</h1>
              <p className="mt-1 text-sm text-[#3d5348]">{data.pack.blurb}</p>
            </div>
          </div>
          <p className="mt-4 text-sm font-extrabold text-[#17352A]">{doneCount} of {data.steps.length} tasks</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#F3E7CF]" role="progressbar" aria-valuemin={0} aria-valuemax={data.steps.length} aria-valuenow={doneCount}>
            <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${Math.round(ratio * 100)}%` }} />
          </div>
          <h2 className="mt-6 font-display text-xl text-[#17352A]">Participating</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-[#3d5348]">
            <Hand className="size-4 text-[#306A51]" aria-hidden="true" />
            Tap a name to jump to their step
          </p>
          <ul className="mt-3 space-y-2">
            {childViews.map((child) => {
              const selected = child.id === focus?.id;
              return (
                <li key={child.id}>
                  <button
                    type="button"
                    onClick={() => selectMember(child.id)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left ${selected ? "border-2 border-[#306A51] bg-[#E7F6EA]" : "border-2 border-transparent bg-white"}`}
                  >
                    <Avatar {...avatarProps(child)} title={displayName(child)} className="size-10 rounded-full" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-bold text-[#17352A]">{displayName(child)}</span>
                      <span className="block truncate text-xs font-bold text-[#5e7266]">@{child.nickname}</span>
                    </span>
                    <StepPill child={child} current={selected && !child.finished} />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      <section className="min-w-0 rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-8">
        <p className="text-center text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">Your journey</p>
        <h2 className="mt-1 text-center font-display text-3xl text-[#17352A] sm:text-4xl">{journeyTitle(data.pack.title)}</h2>
        <ol className="mx-auto mt-8 flex max-w-3xl flex-col gap-2">
          {ordered.map((step) => {
            const here = onStep(childViews, step.position);
            const passed = focus ? (focus.finished || (focus.nextPosition ?? 1) > step.position) : false;
            const active = step.position === activePosition;
            const praised = praise?.position === step.position;
            const state = here.length > 0 && !passed ? "current" : passed && here.length === 0 ? "done" : passed ? "current" : "locked";
            const shown = active || (here.length > 0 && state !== "locked") ? "current" : state;
            return (
              <li id={`journey-step-${step.position}`} key={step.id} className="grid grid-cols-[4.25rem_4.5rem_minmax(0,1fr)] items-start gap-2 py-4 md:grid-cols-[13rem_10rem_minmax(0,1fr)] md:gap-4">
                <div className="flex flex-col items-end gap-3 pt-1">
                  <FacePile people={here} />
                  {active && (
                    <VideoCard step={step} className="hidden w-full md:mr-4 md:block" onPlay={() => setVideoStep(step.position)} />
                  )}
                </div>
                <div className="relative flex flex-col items-center">
                  <span className={`absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 ${shown === "done" || (shown === "current" && passed) ? "bg-[#306A51]" : "bg-[#E7E1D6]"}`} aria-hidden="true" />
                  <StepBadge state={active ? "active" : shown === "done" ? "done" : shown === "current" ? "active" : "locked"} position={step.position} large={active} />
                  {active && (
                    <button
                      type="button"
                      className="relative z-[1] mt-3 max-w-full rounded-full bg-[#E8A428] px-3 py-2 text-center text-xs font-extrabold text-[#17352A] shadow-[0_5px_0_#C48614] disabled:opacity-60"
                      disabled={saving || here.length === 0}
                      onClick={() => askToComplete(step.position)}
                    >
                      {saving ? "Saving…" : "Mark as complete"}
                    </button>
                  )}
                </div>
                <div className="min-w-0 pt-1">
                  {active ? (
                    <div className="space-y-3">
                      <VideoCard step={step} className="md:hidden" onPlay={() => setVideoStep(step.position)} />
                      <Tip step={step} />
                    </div>
                  ) : praised ? (
                    <WellDone praise={praise} people={childViews.filter((child) => praise.childIds.includes(child.id))} onContinue={carryOn} />
                  ) : (
                    <div>
                      <p className={`font-display text-lg ${shown === "locked" ? "text-[#8d8982]" : "text-[#17352A]"}`}>{step.title}</p>
                      {shown === "done" && <p className="text-sm font-bold text-[#306A51]">+{step.points} points</p>}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {modalStep != null && (
        <WhoModal
          people={onStep(childViews, modalStep)}
          picked={picked}
          onToggle={(id) => setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))}
          onEveryone={() => setPicked(onStep(childViews, modalStep).map((child) => child.id))}
          onCancel={() => setModalStep(null)}
          onConfirm={() => void complete(modalStep, picked)}
          pending={saving}
        />
      )}

      {videoStep != null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17352A]/50 p-3 md:items-center" role="dialog" aria-modal="true" aria-label="Video guide">
          <div className="w-full max-w-2xl rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.2)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-xl text-[#17352A]">{data.steps.find((step) => step.position === videoStep)?.title}</p>
              <button type="button" className="rounded-full px-3 py-1 text-sm font-extrabold text-[#306A51]" onClick={() => setVideoStep(null)}>Close</button>
            </div>
            <VideoGuide
              provider={data.steps.find((step) => step.position === videoStep)?.video.provider ?? "none"}
              src={data.steps.find((step) => step.position === videoStep)?.video.src ?? ""}
              minutes={data.steps.find((step) => step.position === videoStep)?.estimated_minutes ?? 0}
              resumeSeconds={focus?.resumeSeconds ?? 0}
              stepId={data.steps.find((step) => step.position === videoStep)?.id ?? ""}
              childIds={onStep(childViews, videoStep).map((child) => child.id)}
            />
          </div>
        </div>
      )}

      {celebration && <QuestComplete title={data.pack.title} points={celebration.points} />}
    </div>
  );
}

function onStep(children: ChildView[], position: number) {
  return children.filter((child) => !child.finished && (child.nextPosition ?? 1) === position);
}

function displayName(child: ChildView) {
  return child.first_name?.trim() || shortName(child.nickname);
}

function avatarProps(child: ChildView) {
  return {
    avatar: child.avatar_key,
    colour: child.avatar_bg,
    face: child.avatar_face,
    hairStyle: child.avatar_hair_style,
    hairColour: child.avatar_hair_colour,
    glasses: child.avatar_glasses,
    hat: child.avatar_hat,
    gender: child.gender === "girl" ? "girl" as const : "boy" as const,
    skin: child.avatar_skin,
    eyeColour: child.avatar_eyes,
    shirt: child.avatar_shirt,
    options: child.avatar_options,
  };
}

function StepPill({ child, current }: { child: ChildView; current: boolean }) {
  if (child.finished) {
    return <span className="inline-flex items-center gap-1 rounded-full bg-[#306A51] px-2.5 py-1 text-xs font-extrabold text-white"><Check className="size-3" aria-hidden="true" /> Done</span>;
  }
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold ${current ? "bg-[#E8A428] text-[#17352A]" : "bg-[#9BD0A8] text-[#17352A]"}`}>
      Step {child.nextPosition ?? 1}
    </span>
  );
}

function FacePile({ people }: { people: ChildView[] }) {
  if (people.length === 0) return <span className="block h-7" />;
  return (
    <div className="flex -space-x-2">
      {people.map((child) => (
        <Avatar key={child.id} {...avatarProps(child)} title={displayName(child)} className="size-7 rounded-full ring-2 ring-white" />
      ))}
    </div>
  );
}

function StepBadge({ state, position, large }: { state: "done" | "active" | "locked"; position: number; large?: boolean }) {
  if (state === "done") {
    return <span className="relative z-[1] flex size-10 items-center justify-center rounded-full bg-[#306A51] text-white"><Check className="size-5" aria-hidden="true" /></span>;
  }
  if (state === "locked") {
    return <span className="relative z-[1] flex size-10 items-center justify-center rounded-full bg-[#F3E7CF] text-[#8d8982]"><Lock className="size-4" aria-hidden="true" /></span>;
  }
  return <span className={`relative z-[1] flex items-center justify-center rounded-full bg-[#E8A428] font-display font-bold text-[#17352A] shadow-[0_5px_0_#C48614] ${large ? "size-14 text-2xl" : "size-10 text-lg"}`}>{position}</span>;
}

function VideoCard({ step, onPlay, className = "" }: { step: Step; onPlay: () => void; className?: string }) {
  return (
    <button type="button" onClick={onPlay} className={`rounded-2xl bg-white p-2 text-left shadow-[0_10px_24px_rgba(23,53,42,0.12)] ${className}`}>
      <span className="relative block aspect-video overflow-hidden rounded-xl bg-[#d7efe4]">
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-white text-[#17352A] shadow">▶</span>
        </span>
      </span>
      <span className="mt-2 block text-xs font-bold text-[#5e7266]">Video guide · {step.estimated_minutes} min</span>
      <span className="block font-display text-base text-[#17352A]">{step.title}</span>
    </button>
  );
}

function Tip({ step }: { step: Step }) {
  return (
    <div className="flex items-end gap-2">
      <p className="max-w-xs rounded-2xl bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#17352A] shadow-[0_5px_0_#C48614,0_8px_16px_rgba(184,122,16,0.25)]">{step.description}</p>
      <img src="/brand/mascot-spy.webp" alt="" width={120} height={168} className="h-28 w-auto shrink-0" />
    </div>
  );
}

function WellDone({
  praise,
  people,
  onContinue,
}: {
  praise: { message: string; points: number; childIds: string[] };
  people: ChildView[];
  onContinue: () => void;
}) {
  return (
    <div>
      <div className="flex items-end gap-2">
        <p className="max-w-xs rounded-2xl bg-[#fffaf2] px-4 py-3 font-display text-lg text-[#17352A] shadow-[0_5px_0_#C48614,0_8px_16px_rgba(184,122,16,0.25)]">{praise.message}</p>
        <img src="/brand/mascot-spy.webp" alt="" width={120} height={168} className="h-28 w-auto shrink-0" />
      </div>
      <ul className="mt-3 space-y-2">
        {people.map((child) => (
          <li key={child.id} className="flex items-center gap-2">
            <Avatar {...avatarProps(child)} title={displayName(child)} className="size-8 rounded-full" />
            <span className="font-bold text-[#17352A]">{displayName(child)}</span>
            <span className="font-display text-[#306A51]">+{praise.points} points</span>
          </li>
        ))}
      </ul>
      <button type="button" onClick={onContinue} className="mt-3 rounded-full bg-[#E8A428] px-5 py-2.5 font-extrabold text-[#17352A] shadow-[0_5px_0_#C48614]">Continue</button>
    </div>
  );
}

function WhoModal({
  people,
  picked,
  onToggle,
  onEveryone,
  onCancel,
  onConfirm,
  pending,
}: {
  people: ChildView[];
  picked: string[];
  onToggle: (id: string) => void;
  onEveryone: () => void;
  onCancel: () => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const all = people.length > 0 && people.every((child) => picked.includes(child.id));
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#17352A]/45 md:items-center" role="dialog" aria-modal="true" aria-labelledby="who-completed">
      <div className="max-h-[85vh] w-full overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-[0_18px_50px_rgba(23,53,42,0.2)] md:max-w-md md:rounded-[28px]">
        <h2 id="who-completed" className="font-display text-2xl text-[#17352A]">Who completed this task?</h2>
        <label className="mt-4 flex items-center gap-3 rounded-2xl bg-[#E7F6EA] px-3 py-3 font-extrabold text-[#17352A]">
          <input type="checkbox" checked={all} onChange={onEveryone} />
          Everyone on this step
        </label>
        <ul className="mt-3 space-y-2">
          {people.map((child) => (
            <li key={child.id}>
              <label className="flex items-center gap-3 rounded-2xl bg-[#f7f3ea] px-3 py-2">
                <input type="checkbox" checked={picked.includes(child.id)} onChange={() => onToggle(child.id)} />
                <Avatar {...avatarProps(child)} title={displayName(child)} className="size-9 rounded-full" />
                <span className="font-bold text-[#17352A]">{displayName(child)}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="min-h-11 flex-1 rounded-full border-2 border-[#306A51] font-extrabold text-[#306A51]">Cancel</button>
          <button type="button" onClick={onConfirm} disabled={picked.length === 0 || pending} className="min-h-11 flex-1 rounded-full bg-[#E8A428] font-extrabold text-[#17352A] shadow-[0_5px_0_#C48614] disabled:opacity-50">
            {pending ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function QuestComplete({ title, points }: { title: string; points: number }) {
  return (
    <div className="celebrate" role="status">
      {Array.from({ length: 16 }, (_, index) => (
        <span key={index} className="confetti" style={{ left: `${(index * 6.2) % 100}%`, animationDelay: `${index * 0.12}s`, background: ["#E8A428", "#F08AB0", "#50B0DC", "#9BD0A8"][index % 4] }} />
      ))}
      <div className="celebrate-card">
        <img src="/brand/mascot-spy.webp" alt="" className="mx-auto h-40 w-auto" />
        <p className="celebrate-title">Quest complete!</p>
        <p className="celebrate-copy">{title} is finished. You earned {points} points and unlocked the certificate.</p>
        <Button asChild variant="mustard" size="lg" className="mt-4">
          <Link href="/club">Back to My Quests</Link>
        </Button>
      </div>
    </div>
  );
}

function LockedPack({ data }: { data: PackData }) {
  return (
    <div className="w-full rounded-[22px] bg-white p-6 text-center">
      <Link href="/club" className="text-sm font-extrabold text-[#306A51]">← My Quests</Link>
      <div className="mt-4 flex justify-center">
        <BookCover tone={data.pack.cover_tone} title={data.pack.title} locked />
      </div>
      <h1 className="mt-4 font-display text-3xl text-[#17352A]">{data.pack.title}</h1>
      <p className="mt-2 text-sm text-[#5e7266]">{data.pack.blurb}</p>
      <p className="mt-2 text-sm text-[#5e7266]">One purchase unlocks this quest for every child on the account. The videos stay hidden until then.</p>
      <Button asChild className="mt-4">
        <a href={shopUrl()} target="_blank" rel="noreferrer">Unlock, {formatPounds(data.pack.price_pence)}</a>
      </Button>
    </div>
  );
}

function seriesLabel(title: string, theme: string) {
  if (title.toLowerCase().includes("egypt")) return "Ancient World";
  return theme ? theme.charAt(0).toUpperCase() + theme.slice(1) : "Adventure";
}

function journeyTitle(title: string) {
  const value = title.toLowerCase();
  if (value.includes("egypt")) return "Travel back to Ancient Egypt";
  if (value.includes("pirate")) return "Sail with the pirates";
  if (value.includes("spy")) return "Train as a spy";
  if (value.includes("knight")) return "Ride to the castle";
  if (value.includes("space")) return "Launch into space";
  return title;
}
