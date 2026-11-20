import Link from "next/link";
import { BookCover } from "@/components/club/book-cover";
import { MarkPanel, type MarkChild } from "@/components/club/mark-panel";
import { PathMap } from "@/components/club/path-map";
import { VideoGuide } from "@/components/club/video-guide";
import { Button } from "@/components/ui/button";
import { formatClock, formatPounds, shortName } from "@/lib/format";
import { shopUrl } from "@/lib/env";
import type { loadPackPage } from "@/lib/club/data";

type PackData = Awaited<ReturnType<typeof loadPackPage>>;

export function PackView({ data }: { data: PackData }) {
  if (!data.owned) return <LockedPack data={data} />;
  const focus = data.focus;
  const step = data.activeStep;
  const mode = data.mode;
  const childQuery = focus ? `&child=${focus.id}` : "";

  return (
    <div className="space-y-4">
      <Link href="/club" className="inline-flex text-sm font-extrabold text-[#1e4d3a]">
        ← My Packs
      </Link>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[22px] border border-[#f0e6d6] bg-white p-4">
          <div className="flex gap-3">
            <BookCover tone={data.pack.cover_tone} title={data.pack.title} />
            <div>
              <p className="inline-block rounded-full bg-[#fde8f0] px-2 py-0.5 text-[11px] font-extrabold text-[#9a4d66]">
                {data.pack.theme} path
              </p>
              <h1 className="mt-1 font-display text-2xl leading-tight text-[#1e4d3a]">{data.pack.title}</h1>
              <p className="mt-1 text-sm text-[#5e7266]">
                {data.pack.duration_label} · {data.pack.step_count} steps · Video on every step
              </p>
              {focus && step && (
                <Button asChild className="mt-3" size="sm">
                  <a href="#step-panel">Continue where {shortName(focus.nickname)} left off</a>
                </Button>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[22px] border border-[#f0e6d6] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl text-[#1e4d3a]">Who&apos;s doing this pack?</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 rounded-full bg-[#f6efe2] p-1 text-center text-sm font-extrabold">
            <Link
              href={`/club/packs/${data.pack.slug}?mode=together${childQuery}`}
              className={`rounded-full px-3 py-2 ${mode === "together" ? "bg-white text-[#1e4d3a] shadow-sm" : "text-[#5e7266]"}`}
            >
              Together
            </Link>
            <Link
              href={`/club/packs/${data.pack.slug}?mode=solo${childQuery}`}
              className={`rounded-full px-3 py-2 ${mode === "solo" ? "bg-white text-[#1e4d3a] shadow-sm" : "text-[#5e7266]"}`}
            >
              Solo
            </Link>
          </div>
          <p className="mt-3 text-sm text-[#5e7266]">
            {mode === "together"
              ? "Tick who is joining now. Kids on the same step share one video. Tap a child to go Solo and open their own step."
              : `Viewing ${focus ? `${shortName(focus.nickname)}'s` : "a"} path. Tap another child to switch.`}
          </p>
          <ul className="mt-3 space-y-2">
            {data.childViews.map((child) => {
              const href =
                mode === "together"
                  ? `/club/packs/${data.pack.slug}?mode=solo&child=${child.id}`
                  : `/club/packs/${data.pack.slug}?mode=solo&child=${child.id}`;
              const active = child.id === focus?.id;
              return (
                <li key={child.id}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-2xl px-2 py-1.5 ${active ? "bg-[#e7f5e1]" : "hover:bg-[#fbf7f1]"}`}
                  >
                    <span className="text-[#1e4d3a]">{active ? "●" : "○"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold">{child.nickname}</span>
                      <span className="block text-xs text-[#5e7266]">Age {child.age_years}</span>
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-extrabold text-[#1e4d3a]">
                      {child.finished ? "Finished" : !child.started ? "Not started" : `Step ${child.nextPosition}`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-[22px] border border-[#f0e6d6] bg-[#fffdf8] p-4">
          <h2 className="font-display text-xl text-[#1e4d3a]">{pathTitle(data.pack.title)}</h2>
          <p className="text-sm text-[#5e7266]">Each child keeps their own place. Tap a child to go solo.</p>
          <PathMap
            steps={data.steps}
            walkers={data.childViews}
            activePosition={step?.position ?? null}
            focusId={focus?.id ?? null}
          />
        </section>

        <section id="step-panel" className="rounded-[22px] border border-[#f0e6d6] bg-white p-4">
          {focus && step ? (
            <StepPanel data={data} />
          ) : (
            <CertificateNote data={data} />
          )}
        </section>
      </div>
    </div>
  );
}

function StepPanel({ data }: { data: PackData }) {
  const step = data.activeStep;
  const focus = data.focus;
  if (!step || !focus) return null;
  const onStepIds = data.childViews
    .filter((child) => !child.finished && (child.nextPosition ?? 1) === step.position)
    .map((child) => child.id);
  const markChildren: MarkChild[] = data.childViews.map((child) => {
    const onStep = !child.finished && (child.nextPosition ?? 1) === step.position;
    const already =
      (child.nextPosition !== null && child.nextPosition > step.position) || child.finished;
    let detail = "On another step";
    if (already && child.finished) detail = "Already finished this pack";
    else if (already) detail = "Already finished this step";
    else if (onStep && child.resumeSeconds > 3) detail = `On this step · resume at ${formatClock(child.resumeSeconds)}`;
    else if (onStep && child.started) detail = "On this step · watching now";
    else if (onStep) detail = "On this step · ready to start";
    else if (!child.started) detail = "Not on this step · hasn't started";
    else detail = `Not on this step · still on step ${child.nextPosition}`;
    return {
      id: child.id,
      nickname: child.nickname,
      age_years: child.age_years,
      avatar_key: child.avatar_key,
      tickable: onStep,
      detail,
    };
  });
  const resume = data.childViews.find((child) => child.id === focus.id)?.resumeSeconds ?? 0;

  return (
    <div>
      <p className="text-xs font-extrabold tracking-wide text-[#1e4d3a] uppercase">
        {data.mode === "together" ? "Together" : `Solo · ${shortName(focus.nickname)}`} · Step {step.position} of {data.steps.length}
      </p>
      <h2 className="mt-1 font-display text-3xl text-[#1e4d3a]">{step.title}</h2>
      {data.mode === "solo" && (
        <p className="mt-2 text-sm text-[#5e7266]">
          This is {shortName(focus.nickname)}&apos;s own step and video, saved where they stopped.
        </p>
      )}
      {data.nudge && data.mode === "together" && (
        <div className="mt-4 rounded-2xl bg-[#fff6e8] p-4">
          <p className="font-extrabold text-[#1e4d3a]">
            {shortName(data.nudge.nickname)} is {data.nudge.gap} steps behind. Catch up together or carry on solo?
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="bottle" className="flex-1">
              <Link href={`/club/packs/${data.pack.slug}?mode=together&child=${data.nudge.childId}`}>
                Catch up together
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/club/packs/${data.pack.slug}?mode=solo&child=${focus.id}`}>Carry on solo</Link>
            </Button>
          </div>
        </div>
      )}
      <div className="mt-4">
        <VideoGuide
          provider={data.video.provider}
          src={data.video.src}
          minutes={step.estimated_minutes}
          resumeSeconds={resume}
          stepId={step.id}
          childIds={onStepIds}
        />
      </div>
      <p className="mt-3 text-sm leading-relaxed text-[#3d5348]">
        {step.printable_ref}. About {step.estimated_minutes} minutes. {step.description}
        {resume > 3 ? ` ${shortName(focus.nickname)} can pick up where they left off.` : ""}
      </p>
      <MarkPanel
        stepId={step.id}
        points={step.points}
        learners={markChildren}
        defaultTicked={onStepIds.includes(focus.id) ? [focus.id] : []}
      />
    </div>
  );
}

function CertificateNote({ data }: { data: PackData }) {
  const focus = data.focus;
  return (
    <div>
      <p className="text-xs font-extrabold tracking-wide text-[#8a6a12] uppercase">Certificate</p>
      <h2 className="mt-1 font-display text-3xl text-[#1e4d3a]">
        {focus ? `${focus.nickname} finished this pack` : "Pack complete"}
      </h2>
      <p className="mt-2 text-sm text-[#5e7266]">
        The certificate is saved on this account, with {data.pack.certificate_bonus_points} bonus points.
      </p>
    </div>
  );
}

function LockedPack({ data }: { data: PackData }) {
  return (
    <div className="mx-auto max-w-lg rounded-[22px] bg-white p-6 text-center">
      <Link href="/club" className="text-sm font-extrabold text-[#1e4d3a]">
        ← My Packs
      </Link>
      <div className="mt-4 flex justify-center">
        <BookCover tone={data.pack.cover_tone} title={data.pack.title} locked />
      </div>
      <h1 className="mt-4 font-display text-3xl text-[#1e4d3a]">{data.pack.title}</h1>
      <p className="mt-2 text-sm text-[#5e7266]">{data.pack.blurb}</p>
      <p className="mt-2 text-sm text-[#5e7266]">
        One purchase unlocks this pack for every child on the account. The videos stay hidden until then.
      </p>
      <Button asChild className="mt-4">
        <a href={shopUrl()} target="_blank" rel="noreferrer">
          Unlock, {formatPounds(data.pack.price_pence)}
        </a>
      </Button>
    </div>
  );
}

function pathTitle(title: string) {
  const value = title.toLowerCase();
  if (value.includes("pirate")) return "The pirate path";
  if (value.includes("egypt")) return "The explorer path";
  if (value.includes("spy")) return "The spy path";
  if (value.includes("knight")) return "The castle path";
  if (value.includes("space")) return "The space path";
  return "The pack path";
}
