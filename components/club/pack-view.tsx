"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
  const listRef = useRef<HTMLOListElement>(null);
  const positions = data.steps.map((step) => step.position);
  const [viewStep, setViewStep] = useState(activePosition ?? positions[0] ?? 1);
  const [greenTop, setGreenTop] = useState(0);
  const [popStep, setPopStep] = useState<number | null>(null);
  const [doneOpen, setDoneOpen] = useState<number | null>(null);

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
      else setViewStep(position);
    };
    requestAnimationFrame(tick);
    if (!smooth) setViewStep(position);
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

  const roadActive = activePosition ?? praise?.position ?? (focus?.finished ? data.steps.at(-1)?.position : null) ?? 1;

  useLayoutEffect(() => {
    const list = listRef.current;
    const badge = document.getElementById(`journey-badge-${roadActive}`);
    if (!list || !badge) return;
    const top = badge.getBoundingClientRect().top - list.getBoundingClientRect().top + badge.offsetHeight / 2;
    setGreenTop(top);
  }, [roadActive, praise, childViews]);

  useEffect(() => {
    if (!activePosition) return;
    setPopStep(activePosition);
    const timer = window.setTimeout(() => setPopStep(null), 300);
    return () => window.clearTimeout(timer);
  }, [activePosition]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.key === "ArrowUp") {
        event.preventDefault();
        stepBy(1);
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        stepBy(-1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

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

  return (
    <div className="flex h-[calc(100dvh-8.5rem)] flex-col gap-3 lg:h-[calc(100dvh-11.25rem)]">
      <div className="sticky top-[6.5rem] z-30 flex h-auto shrink-0 flex-col justify-center gap-2 rounded-[28px] bg-white px-3 shadow-[0_18px_50px_rgba(23,53,42,0.06)] lg:top-[7.15rem] lg:h-20 lg:flex-row lg:items-center lg:gap-4 lg:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/club" className="shrink-0 text-xs font-extrabold text-[#306A51] no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51]">← My Quests</Link>
          <div className="h-[68px] w-12 shrink-0 overflow-hidden rounded-lg">
            <BookCover tone={data.pack.cover_tone} title={data.pack.title} className="h-full w-full rounded-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold tracking-wide text-[#306A51] uppercase">Quest · {seriesLabel(data.pack.title, data.pack.theme)}</p>
            <h1 className="truncate font-display text-lg leading-none font-bold text-[#17352A] lg:text-[22px]">{data.pack.title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p className="text-xs font-extrabold whitespace-nowrap text-[#17352A]">{doneCount} of {data.steps.length} tasks</p>
            <div className="h-2 w-24 overflow-hidden rounded-full bg-[#F3E7CF] sm:w-40" role="progressbar" aria-valuemin={0} aria-valuemax={data.steps.length} aria-valuenow={doneCount}>
              <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${Math.round(ratio * 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="lg:ml-auto">
          <p className="mb-1 text-[11px] font-semibold text-[#5e7266]">Tap to jump to their step</p>
          <div className="flex gap-3 overflow-x-auto pb-1 lg:pb-0">
            {childViews.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => selectMember(child.id)}
                title={`${displayName(child)} @${child.nickname}`}
                className="flex w-12 shrink-0 flex-col items-center gap-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51]"
              >
                <RoundAvatar child={child} size={40} selected={child.id === focus?.id} />
                <StepPill child={child} current={child.id === focus?.id && !child.finished} compact />
              </button>
            ))}
          </div>
        </div>
      </div>

      <section className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[140px] bg-gradient-to-b from-white to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[60px] bg-gradient-to-t from-white to-transparent" />
        <div className="absolute top-1/2 right-3 z-30 hidden -translate-y-1/2 flex-col gap-2 md:flex">
          <button type="button" title="Next step" aria-label="Next step" disabled={viewStep === positions.at(-1)} className="flex size-10 items-center justify-center rounded-full bg-white text-[#17352A] shadow-[0_8px_20px_rgba(23,53,42,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51] disabled:opacity-40" onClick={() => stepBy(1)}>
            <ChevronUp className="size-5" aria-hidden="true" />
          </button>
          <button type="button" title="Previous step" aria-label="Previous step" disabled={viewStep === positions[0]} className="flex size-10 items-center justify-center rounded-full bg-white text-[#17352A] shadow-[0_8px_20px_rgba(23,53,42,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51] disabled:opacity-40" onClick={() => stepBy(-1)}>
            <ChevronDown className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div ref={scrollerRef} className="journey-scroll h-full overflow-x-hidden overflow-y-auto px-3 py-8 sm:px-8" onScroll={() => setViewStep(nearestPosition())}>
          <p className="text-center text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">Your journey</p>
          <h2 className="mt-1 mb-6 text-center font-display text-3xl text-[#17352A] sm:text-4xl">{journeyTitle(data.pack.title)}</h2>
          <ol ref={listRef} className="relative mx-auto flex w-full max-w-[1000px] flex-col pb-[28vh]">
            <div className="pointer-events-none absolute top-0 bottom-0 left-7 z-0 w-0.5 -translate-x-1/2 bg-[#DCD6C8] md:left-1/2" aria-hidden="true" />
            <div className="pointer-events-none absolute bottom-0 left-7 z-0 w-0.5 -translate-x-1/2 bg-[#306A51] transition-[top] duration-300 ease-out md:left-1/2" style={{ top: greenTop }} aria-hidden="true" />
            {ordered.map((step) => {
              const here = onStep(childViews, step.position);
              const passed = focus ? (focus.finished || (focus.nextPosition ?? 1) > step.position) : false;
              const active = step.position === activePosition;
              const praised = praise?.position === step.position;
              const occupied = here.length > 0;
              const locked = !passed && !active && !occupied;
              return (
                <li id={`journey-step-${step.position}`} key={step.id} className="relative grid min-h-[200px] grid-cols-1 items-center md:grid-cols-[1fr_11rem_1fr] md:gap-6">
                  <div className="relative z-[2] hidden items-center justify-end gap-6 md:flex">
                    {active ? (
                      <>
                        <FacePile people={here} />
                        <VideoCard step={step} className="relative w-[360px]" pointer onPlay={() => setVideoStep(step.position)} />
                      </>
                    ) : (
                      <FacePile people={here} />
                    )}
                  </div>
                  <div className="absolute top-1/2 left-7 z-[2] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center md:static md:h-full md:translate-x-0 md:translate-y-0 md:justify-center">
                    <StepBadge id={`journey-badge-${step.position}`} state={active || occupied ? "active" : passed ? "done" : "locked"} position={step.position} large={active} pop={popStep === step.position} />
                    {active && (
                      <button
                        type="button"
                        className="relative z-[2] mt-4 hidden rounded-full bg-[#E8A428] px-4 py-2 text-center font-display text-[15px] font-semibold whitespace-nowrap text-[#17352A] shadow-[0_5px_0_#C48614] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51] disabled:opacity-60 md:inline-flex"
                        disabled={saving || here.length === 0}
                        onClick={() => askToComplete(step.position)}
                      >
                        {saving ? "Saving…" : "Mark as complete"}
                      </button>
                    )}
                  </div>
                  <div className="relative z-[2] min-w-0 py-4 pl-14 md:py-0 md:pl-0">
                    {locked && <p className="sr-only">Complete step {roadActive} first</p>}
                    {!active && occupied && <div className="mb-2 md:hidden"><FacePile people={here} /></div>}
                    {active ? (
                      <div className="space-y-3">
                        <div className="md:hidden"><FacePile people={here} /></div>
                        <VideoCard step={step} className="w-full md:hidden" onPlay={() => setVideoStep(step.position)} />
                        <button
                          type="button"
                          className="rounded-full bg-[#E8A428] px-4 py-2 font-display text-[15px] font-semibold text-[#17352A] shadow-[0_5px_0_#C48614] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51] disabled:opacity-60 md:hidden"
                          disabled={saving || here.length === 0}
                          onClick={() => askToComplete(step.position)}
                        >
                          {saving ? "Saving…" : "Mark as complete"}
                        </button>
                        <Tip step={step} compact />
                      </div>
                    ) : praised ? (
                      <WellDone praise={praise} people={childViews.filter((child) => praise.childIds.includes(child.id))} onContinue={carryOn} />
                    ) : (
                      <button
                        type="button"
                        className="text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#306A51]"
                        title={locked ? `Complete step ${roadActive} first` : undefined}
                        onClick={() => {
                          if (locked) return;
                          if (passed && !occupied) setDoneOpen(doneOpen === step.position ? null : step.position);
                        }}
                      >
                        <p className={`font-display text-[17px] ${locked ? "text-[#8d8982] opacity-60" : "text-[#17352A]"}`}>{step.title}</p>
                        {passed && !occupied && <p className="text-sm font-bold text-[#306A51]">+{step.points} points</p>}
                      </button>
                    )}
                    {doneOpen === step.position && (
                      <div className="mt-2 max-w-xs rounded-2xl bg-white p-3 shadow-[0_12px_30px_rgba(23,53,42,0.12)]">
                        <p className="font-display text-base text-[#17352A]">{step.title}</p>
                        <p className="text-sm font-bold text-[#306A51]">+{step.points} points</p>
                        <p className="mt-1 text-sm text-[#3d5348]">{completers(childViews, step.position).map(displayName).join(", ") || "Completed"}</p>
                        <button type="button" className="mt-2 text-sm font-extrabold text-[#306A51] underline" onClick={() => { setDoneOpen(null); setVideoStep(step.position); }}>Rewatch video</button>
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

function RoundAvatar({ child, size, selected = false }: { child: ChildView; size: number; selected?: boolean }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-[#9BD0A8] font-display text-sm font-bold text-[#17352A]"
      style={{ width: size, height: size, boxShadow: selected ? "0 0 0 3px #E8A428, 0 2px 6px rgba(23,53,42,0.18)" : "0 2px 6px rgba(23,53,42,0.18)" }}
    >
      <Avatar {...avatarProps(child)} title={displayName(child)} className="h-full w-full object-cover" />
    </span>
  );
}

function FacePile({ people }: { people: ChildView[] }) {
  if (people.length === 0) return null;
  const extra = people.length > 4 ? people.length - 3 : 0;
  const shown = extra ? people.slice(0, 3) : people;
  return (
    <div className="flex -space-x-2">
      {shown.map((child) => (
        <RoundAvatar key={child.id} child={child} size={32} />
      ))}
      {extra > 0 && (
        <span className="inline-flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#17352A] text-xs font-bold text-white">+{extra}</span>
      )}
    </div>
  );
}

function StepBadge({ id, state, position, large, pop }: { id: string; state: "done" | "active" | "locked"; position: number; large?: boolean; pop?: boolean }) {
  const popClass = pop ? "journey-pop" : "";
  if (state === "done") {
    return <span id={id} className={`relative z-[1] flex size-12 items-center justify-center rounded-full bg-[#306A51] text-white ${popClass}`}><Check className="size-6" aria-hidden="true" /></span>;
  }
  if (state === "locked") {
    return <span id={id} className="relative z-[1] flex size-12 items-center justify-center rounded-full bg-[#F3E7CF] text-[#8d8982] opacity-60"><Lock className="size-4" aria-hidden="true" /></span>;
  }
  return <span id={id} className={`relative z-[1] flex items-center justify-center rounded-full bg-[#E8A428] font-display font-bold text-[#17352A] shadow-[0_5px_0_#C48614] ${popClass} ${large ? "size-16 text-2xl" : "size-12 text-lg"}`}>{position}</span>;
}

function VideoCard({ step, onPlay, className = "", pointer = false }: { step: Step; onPlay: () => void; className?: string; pointer?: boolean }) {
  return (
    <button type="button" onClick={onPlay} className={`rounded-2xl bg-white p-2 text-left shadow-[0_10px_24px_rgba(23,53,42,0.12)] ${className}`}>
      {pointer && <span className="absolute top-1/2 -right-2 size-4 -translate-y-1/2 rotate-45 bg-white" aria-hidden="true" />}
      <span className="relative block aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-[#d7efe4] to-[#9BD0A8]">
        {step.video.provider === "youtube" && step.video.src && (
          <img src={`https://i.ytimg.com/vi/${step.video.src}/hqdefault.jpg`} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-[#E8A428] text-[#17352A] shadow-[0_5px_0_#C48614]">▶</span>
        </span>
      </span>
      <span className="mt-2 block text-xs font-bold text-[#5e7266]">Video guide · {step.estimated_minutes} min</span>
      <span className="block font-display text-base text-[#17352A]">{step.title}</span>
    </button>
  );
}

function Tip({ step, compact = false }: { step: Step; compact?: boolean }) {
  return (
    <div className="flex items-end gap-2">
      <div className="relative min-w-60 max-w-80 rounded-2xl bg-white px-5 py-4 shadow-[0_5px_0_#C48614,0_8px_16px_rgba(184,122,16,0.25)]">
        <p className="text-xs font-semibold tracking-wide text-[#306A51] uppercase">Chameleon&apos;s tip</p>
        <p className="mt-1 text-[15px] font-semibold text-[#17352A]">{step.description}</p>
        <span className="absolute top-1/2 -right-1.5 size-3 -translate-y-1/2 rotate-45 bg-white" aria-hidden="true" />
      </div>
      <img src="/brand/mascot-spy.webp" alt="" width={96} height={132} className={`journey-bob w-auto shrink-0 ${compact ? "h-[72px] md:h-24" : "h-24"}`} />
    </div>
  );
}

function completers(children: ChildView[], position: number) {
  return children.filter((child) => child.finished || (child.nextPosition != null && child.nextPosition > position));
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
