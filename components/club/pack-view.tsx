"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ChevronUp, Lock } from "lucide-react";
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
  const scrollerRef = useRef<HTMLDivElement>(null);
  const positions = data.steps.map((step) => step.position);

  function scrollToPosition(position: number, smooth: boolean) {
    const scroller = scrollerRef.current;
    const el = document.getElementById(`journey-step-${position}`);
    if (!scroller || !el) return;
    const delta = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
    const dest = Math.max(0, scroller.scrollTop + delta - scroller.clientHeight * 0.62 + el.offsetHeight / 2);
    if (!smooth) {
      scroller.scrollTop = dest;
      return;
    }
    const from = scroller.scrollTop;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 600);
      const eased = 1 - (1 - t) ** 3;
      scroller.scrollTop = from + (dest - from) * eased;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function nearestPosition() {
    const scroller = scrollerRef.current;
    if (!scroller) return positions[0];
    const mid = scroller.getBoundingClientRect().top + scroller.clientHeight * 0.62;
    let best = positions[0];
    let bestDist = Number.POSITIVE_INFINITY;
    for (const position of positions) {
      const el = document.getElementById(`journey-step-${position}`);
      if (!el) continue;
      const box = el.getBoundingClientRect();
      const dist = Math.abs(box.top + box.height / 2 - mid);
      if (dist < bestDist) {
        best = position;
        bestDist = dist;
      }
    }
    return best;
  }

  useLayoutEffect(() => {
    const position = focus?.finished ? data.steps.at(-1)?.position : focus?.nextPosition;
    if (position) scrollToPosition(position, false);
    // Centre the current step once the map has its height.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectMember(childId: string) {
    setFocusId(childId);
    setPraise(null);
    const child = childViews.find((item) => item.id === childId);
    const position = child?.finished ? data.steps.at(-1)?.position : child?.nextPosition;
    if (position) scrollToPosition(position, true);
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
    if (next) requestAnimationFrame(() => scrollToPosition(next.position, true));
  }

  function stepBy(direction: 1 | -1) {
    const current = nearestPosition();
    const index = positions.indexOf(current);
    const next = positions[index + direction];
    if (next) scrollToPosition(next, true);
  }

  const ordered = [...data.steps].reverse();
  const roadActive = activePosition ?? praise?.position ?? (focus?.finished ? data.steps.at(-1)?.position : null) ?? 1;

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col gap-3 lg:h-[calc(100dvh-11.25rem)]">
      <div className="sticky top-[6.5rem] z-30 flex max-h-none shrink-0 flex-col gap-2 rounded-[28px] bg-white px-3 py-2 shadow-[0_18px_50px_rgba(23,53,42,0.06)] lg:top-[7.15rem] lg:h-[88px] lg:max-h-[88px] lg:flex-row lg:items-center lg:gap-4 lg:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/club" className="shrink-0 text-xs font-extrabold text-[#306A51] no-underline">← My Quests</Link>
          <div className="h-[68px] w-12 shrink-0 overflow-hidden rounded-lg">
            <BookCover tone={data.pack.cover_tone} title={data.pack.title} className="h-full w-full rounded-lg" />
          </div>
            <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold tracking-wide text-[#306A51] uppercase">Quest · {seriesLabel(data.pack.title, data.pack.theme)}</p>
            <h1 className="font-display text-lg leading-tight font-bold text-[#17352A] lg:text-[22px]">{data.pack.title}</h1>
          </div>
          <div className="w-24 shrink-0 lg:ml-2 lg:w-[140px]">
            <p className="text-xs font-extrabold text-[#17352A]">{doneCount} of {data.steps.length}</p>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#F3E7CF]" role="progressbar" aria-valuemin={0} aria-valuemax={data.steps.length} aria-valuenow={doneCount}>
              <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:ml-auto">
          <p className="sr-only">Tap a name to jump to their step</p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0" title="Tap a name to jump to their step">
            {childViews.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => selectMember(child.id)}
                title={`${displayName(child)} @${child.nickname}. Tap a name to jump to their step`}
                className="flex w-12 shrink-0 flex-col items-center gap-1"
              >
                <Avatar {...avatarProps(child)} title={displayName(child)} className={`size-8 rounded-full ring-2 ring-offset-2 ${child.id === focus?.id ? "ring-[#E8A428]" : "ring-transparent"}`} />
                <StepPill child={child} current={child.id === focus?.id && !child.finished} compact />
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[120px] bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-16 bg-gradient-to-t from-white to-transparent" />
        <div className="absolute top-4 right-3 z-30 flex flex-col gap-2">
          <button type="button" aria-label="Next step" className="flex size-9 items-center justify-center rounded-full bg-white text-[#17352A] shadow-[0_8px_20px_rgba(23,53,42,0.12)]" onClick={() => stepBy(1)}>
            <ChevronUp className="size-5" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Previous step" className="flex size-9 items-center justify-center rounded-full bg-white text-[#17352A] shadow-[0_8px_20px_rgba(23,53,42,0.12)]" onClick={() => stepBy(-1)}>
            <ChevronDown className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div ref={scrollerRef} className="journey-scroll h-full overflow-x-hidden overflow-y-auto px-3 py-8 sm:px-8">
          <p className="text-center text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">Your journey</p>
          <h2 className="mt-1 mb-6 text-center font-display text-3xl text-[#17352A] sm:text-4xl">{journeyTitle(data.pack.title)}</h2>
          <ol className="mx-auto flex w-full max-w-5xl flex-col pb-[28vh]">
            {ordered.map((step) => {
              const here = onStep(childViews, step.position);
              const passed = focus ? (focus.finished || (focus.nextPosition ?? 1) > step.position) : false;
              const active = step.position === activePosition;
              const praised = praise?.position === step.position;
              const occupied = here.length > 0;
              const locked = !passed && !active && !occupied;
              const topGreen = step.position < roadActive;
              const bottomGreen = step.position <= roadActive;
              return (
                <li id={`journey-step-${step.position}`} key={step.id} className="relative grid min-h-[200px] grid-cols-1 items-center md:min-h-[210px] md:grid-cols-[1fr_5.5rem_1fr]">
                  <div className="absolute top-0 bottom-0 left-8 w-0.5 -translate-x-1/2 md:left-1/2" aria-hidden="true">
                    {step.position < data.steps.length && (
                      <span className={`absolute top-0 h-1/2 w-full ${topGreen ? "bg-[#306A51]" : "bg-[#DCD6C8]"}`} />
                    )}
                    {step.position > 1 && (
                      <span className={`absolute bottom-0 h-1/2 w-full ${bottomGreen ? "bg-[#306A51]" : "bg-[#DCD6C8]"}`} />
                    )}
                  </div>
                  <div className="relative z-[1] hidden items-center justify-end gap-3 pr-6 md:flex">
                    {active ? (
                      <>
                        <FacePile people={here} />
                        <VideoCard step={step} className="relative w-64" pointer onPlay={() => setVideoStep(step.position)} />
                      </>
                    ) : (
                      <FacePile people={here} />
                    )}
                  </div>
                  <div className="absolute top-1/2 left-8 z-[1] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center md:static md:flex md:h-full md:translate-x-0 md:translate-y-0 md:justify-center">
                    <StepBadge state={active || occupied ? "active" : passed ? "done" : "locked"} position={step.position} large={active} />
                    {active && (
                      <button
                        type="button"
                        className="relative z-[1] mt-3 rounded-full bg-[#E8A428] px-3 py-2 text-center text-xs font-extrabold whitespace-nowrap text-[#17352A] shadow-[0_5px_0_#C48614] disabled:opacity-60 max-md:absolute max-md:top-full max-md:left-1/2 max-md:mt-2"
                        disabled={saving || here.length === 0}
                        onClick={() => askToComplete(step.position)}
                      >
                        {saving ? "Saving…" : "Mark as complete"}
                      </button>
                    )}
                  </div>
                  <div className="relative z-[1] min-w-0 py-6 pl-16 md:py-0 md:pl-6">
                    {here.length > 0 && !active && <div className="mb-2 md:hidden"><FacePile people={here} /></div>}
                    {active ? (
                      <div className="space-y-3">
                        <VideoCard step={step} className="md:hidden" onPlay={() => setVideoStep(step.position)} />
                        <Tip step={step} />
                      </div>
                    ) : praised ? (
                      <WellDone praise={praise} people={childViews.filter((child) => praise.childIds.includes(child.id))} onContinue={carryOn} />
                    ) : (
                      <div>
                        <p className={`font-display text-lg ${locked ? "text-[#8d8982]" : "text-[#17352A]"}`}>{step.title}</p>
                        {passed && !occupied && <p className="text-sm font-bold text-[#306A51]">+{step.points} points</p>}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
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

function StepPill({ child, current, compact = false }: { child: ChildView; current: boolean; compact?: boolean }) {
  const size = compact ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";
  if (child.finished) {
    return <span className={`inline-flex items-center gap-0.5 rounded-full bg-[#306A51] font-extrabold text-white ${size}`}><Check className="size-3" aria-hidden="true" /></span>;
  }
  return (
    <span className={`rounded-full font-extrabold whitespace-nowrap ${size} ${current ? "bg-[#E8A428] text-[#17352A]" : "bg-[#9BD0A8] text-[#17352A]"}`}>
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
    return <span className="relative z-[1] flex size-12 items-center justify-center rounded-full bg-[#306A51] text-white"><Check className="size-6" aria-hidden="true" /></span>;
  }
  if (state === "locked") {
    return <span className="relative z-[1] flex size-12 items-center justify-center rounded-full bg-[#F3E7CF] text-[#8d8982]"><Lock className="size-4" aria-hidden="true" /></span>;
  }
  return <span className={`relative z-[1] flex items-center justify-center rounded-full bg-[#E8A428] font-display font-bold text-[#17352A] shadow-[0_5px_0_#C48614] ${large ? "size-16 text-2xl" : "size-12 text-lg"}`}>{position}</span>;
}

function VideoCard({ step, onPlay, className = "", pointer = false }: { step: Step; onPlay: () => void; className?: string; pointer?: boolean }) {
  return (
    <button type="button" onClick={onPlay} className={`rounded-2xl bg-white p-2 text-left shadow-[0_10px_24px_rgba(23,53,42,0.12)] ${className}`}>
      {pointer && <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rotate-45 bg-white" aria-hidden="true" />}
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
      <p className="min-w-60 max-w-xs rounded-2xl bg-[#fffaf2] px-4 py-3 text-sm font-bold text-[#17352A] shadow-[0_5px_0_#C48614,0_8px_16px_rgba(184,122,16,0.25)]">{step.description}</p>
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
