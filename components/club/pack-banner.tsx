import { Clock, FileText, Play, Printer, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/brand/avatar";
import { PromoBackdrop } from "@/components/club/promo-banner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AvatarKey, CoverTone } from "@/lib/validators";

type Member = {
  id: string;
  nickname: string;
  first_name?: string | null;
  avatar_key: AvatarKey;
  avatar_options?: string | null;
  gender?: "boy" | "girl" | "unspecified" | null;
};

export function PackBanner({
  state,
  title,
  tone,
  clubName,
  done,
  total,
  nextStep,
  members,
  href,
  blurb = "",
  durationLabel = "",
  ageMin = 0,
  ageMax = 0,
  pageCount = null,
  featured,
  compact = false,
}: {
  state: "start" | "continue";
  title: string;
  tone: CoverTone;
  clubName: string;
  done: number;
  total: number;
  nextStep: string | null;
  members: Member[];
  href: string;
  blurb?: string;
  durationLabel?: string;
  ageMin?: number;
  ageMax?: number;
  pageCount?: number | null;
  featured?: boolean;
  compact?: boolean;
}) {
  const continuing = state === "continue";
  if (featured && !continuing) {
    return (
      <NewPackBanner
        title={title}
        tone={tone}
        blurb={blurb}
        durationLabel={durationLabel}
        ageMin={ageMin}
        ageMax={ageMax}
        pageCount={pageCount}
        href={href}
      />
    );
  }
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(23,53,42,0.06)] ${
        continuing ? "bg-[#f3faf4]" : "bg-[#fff8ee]"
      } ${compact ? "p-3" : featured ? "p-4 sm:p-6" : "p-4"}`}
    >
      <div className={`flex flex-col md:flex-row md:items-center ${compact ? "gap-3" : "gap-4"} ${featured && !continuing ? "md:pr-2" : ""}`}>
        <PackArt tone={tone} title={title} compact={compact} className={`mx-auto shrink-0 md:mx-0 ${compact ? "h-24 w-20" : featured ? "h-52 w-40 md:h-60 md:w-44" : "h-44 w-36 md:h-48"}`} />
        <div className={`min-w-0 flex-1 ${featured && !continuing ? "md:pr-72" : ""}`}>
          {featured && !continuing ? (
            <p className="inline-flex items-center gap-2 rounded-full bg-[#e7f5e1] px-3 py-1 text-sm font-bold text-[#306A51]">
              <span className="size-2 rounded-full bg-[#306A51]" aria-hidden="true" />
              Your new quest is ready!
            </p>
          ) : (
            <p className="text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">{continuing ? "Continue quest" : "Start quest"}</p>
          )}
          {!compact && continuing && (
            <p className="mt-2 text-sm font-bold text-[#3d5348] sm:text-base">{continueLead(clubName, done, total)}</p>
          )}
          <h2 className={`font-display leading-tight text-[#17352A] ${compact ? "mt-1 text-lg" : featured ? "mt-3 text-3xl md:text-4xl" : "mt-1 text-2xl sm:text-3xl"}`}>{title}</h2>
          {featured && !continuing && blurb && <p className="mt-2 text-base text-[#3d5348]">{blurb}</p>}
          {continuing && (
            <p className={`${compact ? "mt-1 text-sm" : "mt-2 text-sm sm:text-base"} text-[#3d5348]`}>
              Next: {nextStep ?? "Keep going"}
            </p>
          )}
          {featured && !continuing && (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm font-bold text-[#3d5348]">
              {durationLabel && (
                <li className="inline-flex items-center gap-1.5">
                  <Clock className="size-4 text-[#306A51]" aria-hidden="true" />
                  {durationLabel}
                </li>
              )}
              {pageCount != null && (
                <li className="inline-flex items-center gap-1.5">
                  <FileText className="size-4 text-[#306A51]" aria-hidden="true" />
                  {pageCount} pages
                </li>
              )}
              {ageMin > 0 && ageMax > 0 && (
                <li className="inline-flex items-center gap-1.5">
                  <UserRound className="size-4 text-[#306A51]" aria-hidden="true" />
                  Ages {ageMin}–{ageMax}
                </li>
              )}
            </ul>
          )}
          {continuing && (
            <div className={compact ? "mt-2" : "mt-4"}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm text-[#3d5348]">
                <span>{done} of {total} steps done</span>
                <span>{paceWord(done, total)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#F3E7CF]">
                <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
              </div>
            </div>
          )}
          {(continuing || !featured) && (
            <div className={`${compact ? "mt-2" : "mt-4"} flex items-center gap-2`}>
              <div className="flex -space-x-2">
                {members.slice(0, 5).map((member) => (
                  <Avatar
                    key={member.id}
                    avatar={member.avatar_key}
                    options={member.avatar_options}
                    gender={member.gender === "girl" ? "girl" : "boy"}
                    title={member.first_name || member.nickname}
                    className="size-7 rounded-full ring-2 ring-white"
                  />
                ))}
              </div>
              <p className="text-sm font-bold text-[#3d5348]">
                {continuing ? `${members.length} ${members.length === 1 ? "member" : "members"} on this quest` : "Ready for the whole club"}
              </p>
            </div>
          )}
          <div className={`${compact ? "mt-2" : "mt-4"} flex flex-col gap-2 sm:flex-row`}>
            <Button asChild variant="mustard" size={compact ? "sm" : "md"} className="w-full sm:w-auto">
              <Link href={href}>{continuing ? "Continue quest" : "Start quest"}</Link>
            </Button>
            {!continuing && (
              <Button asChild variant="white" size="md" className="w-full border-2 border-[#306A51] sm:w-auto">
                <Link href={href}>
                  Print pages
                  <Printer className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            )}
          </div>
          {featured && !continuing && (
            <p className="mt-3 text-sm text-[#3d5348]">
              Prefer it printed?{" "}
              <Link href="/club/shop" className="font-extrabold text-[#306A51] underline">
                Order your workbook here
              </Link>
            </p>
          )}
        </div>
      </div>
      {featured && (
        <div className="pointer-events-none absolute top-4 right-3 hidden items-end md:flex">
          {!continuing && (
            <p className="mb-16 mr-1 w-40 rounded-2xl bg-white px-3 py-2 text-center font-display text-sm font-bold leading-snug text-[#306A51] shadow-[0_5px_0_#e4d7c4]">
              Don&apos;t forget to print the pages first!
            </p>
          )}
          <img src="/brand/mascot-spy.webp" alt="" width={368} height={512} loading="eager" fetchPriority="high" decoding="async" className="h-40 w-auto" />
        </div>
      )}
    </article>
  );
}

function NewPackBanner({
  title,
  blurb,
  durationLabel,
  ageMin,
  ageMax,
  pageCount,
  href,
}: {
  title: string;
  tone: CoverTone;
  blurb: string;
  durationLabel: string;
  ageMin: number;
  ageMax: number;
  pageCount: number | null;
  href: string;
}) {
  const icon = { size: 20, strokeWidth: 2.5, strokeLinecap: "round" as const, color: "currentColor", "aria-hidden": true };
  return (
    <article className="new-pack-banner">
      <div className="new-pack-banner__circle" aria-hidden="true">
        <PromoBackdrop />
      </div>
      <div className="new-pack-banner__cover">
        <div className="new-pack-banner__stage">
          <PromoBackdrop />
        </div>
        <div className="new-pack-banner__sheet" role="img" aria-label={title}>
          <CoverSketch title={title} />
          <p>{title}</p>
        </div>
      </div>
      <div className="new-pack-banner__copy">
        <p className="new-pack-banner__pill">
          <span aria-hidden="true" />
          Your new quest is ready!
        </p>
        <h2 className="new-pack-banner__title">{title}</h2>
        {blurb && <p className="new-pack-banner__blurb">{blurb}</p>}
        <ul className="new-pack-banner__meta">
          {durationLabel && (
            <li>
              <Clock {...icon} />
              {durationLabel}
            </li>
          )}
          {pageCount != null && (
            <li>
              <FileText {...icon} />
              {pageCount} pages
            </li>
          )}
          {ageMin > 0 && ageMax > 0 && (
            <li>
              <UserRound {...icon} />
              Ages {ageMin}–{ageMax}
            </li>
          )}
        </ul>
        <div className="new-pack-banner__actions">
          <Link href={href} className="new-pack-banner__start">
            Start quest
            <Play {...icon} />
          </Link>
          <Link href={href} className="new-pack-banner__print">
            Print pages
            <Printer {...icon} />
          </Link>
        </div>
        <p className="new-pack-banner__printed">
          Prefer it printed? <Link href="/club/shop">Order your workbook here</Link>
        </p>
      </div>
      <div className="new-pack-banner__mascot">
        <p className="new-pack-banner__bubble">
          Don&apos;t forget to print the pages first!
          <span className="new-pack-banner__tail" aria-hidden="true" />
        </p>
        <img src="/brand/mascot-spy.webp" alt="" width={368} height={512} loading="eager" fetchPriority="high" decoding="async" />
      </div>
    </article>
  );
}

export function EmptyPackBanner() {
  return (
    <article className="rounded-[28px] bg-[#fff8ee] p-6 text-[#3d5348] shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
      <p className="text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">Start quest</p>
      <h2 className="mt-2 font-display text-3xl text-[#17352A]">Your club is ready for a quest</h2>
      <p className="mt-2">When you buy a quest, it will show up here for the whole club.</p>
      <Button asChild variant="mustard" size="md" className="mt-4 w-full sm:w-auto">
        <Link href="/club/shop">Visit the Club shop</Link>
      </Button>
    </article>
  );
}

function continueLead(clubName: string, done: number, total: number) {
  const ratio = total ? done / total : 0;
  if (ratio >= 0.75) return `${clubName} is almost done`;
  if (ratio >= 0.35) return `${clubName} is halfway through`;
  return `${clubName} is just getting started`;
}

function paceWord(done: number, total: number) {
  const ratio = total ? done / total : 0;
  if (ratio >= 0.75) return "Almost done";
  if (ratio >= 0.35) return "Halfway";
  return "Just started";
}

const tones: Record<CoverTone, string> = {
  bottle: "bg-[#1e4d3a]",
  palm: "bg-[#2f6b45]",
  navy: "bg-[#1e3a5f]",
  plum: "bg-[#5c3d6e]",
  sea: "bg-[#245e78]",
};

function PackArt({ tone, title, className = "", compact = false }: { tone: CoverTone; title: string; className?: string; compact?: boolean }) {
  return (
    <div className={cn("relative overflow-hidden rounded-[22px]", tones[tone], className)}>
      <div className={`absolute rounded-xl bg-[#f7f1e6] ${compact ? "inset-1.5" : "inset-x-3 top-3 bottom-[28%]"}`}>
        <CoverSketch title={title} />
      </div>
      {!compact && <p className="absolute inset-x-3 bottom-3 text-center text-xs leading-tight font-bold text-white sm:text-sm">{title}</p>}
    </div>
  );
}

function CoverSketch({ title }: { title: string }) {
  const value = title.toLowerCase();
  if (value.includes("egypt")) {
    return (
      <svg viewBox="0 0 80 90" className="h-full w-full" aria-hidden="true">
        <path d="M10 70 L40 18 L70 70 Z" fill="#e7c56a" />
        <path d="M28 70 L40 42 L52 70 Z" fill="#f3e0a0" />
        <circle cx="58" cy="24" r="8" fill="#e8a428" />
      </svg>
    );
  }
  if (value.includes("spy")) {
    return (
      <svg viewBox="0 0 80 90" className="h-full w-full" aria-hidden="true">
        <rect x="18" y="16" width="44" height="56" rx="4" fill="#f4e2b0" />
        <circle cx="40" cy="40" r="12" fill="none" stroke="#1e4d3a" strokeWidth="3" />
        <path d="M48 48 L60 62" stroke="#1e4d3a" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 80 90" className="h-full w-full" aria-hidden="true">
      <path d="M14 58 C28 40 52 40 66 58" fill="none" stroke="#c45b4a" strokeWidth="3" strokeDasharray="3 3" />
      <circle cx="22" cy="50" r="4" fill="#e07a3d" />
      <path d="M48 28 l4 8 h8 l-6 5 2 8 -8-5 -8 5 2-8 -6-5 h8 z" fill="#e8a428" />
    </svg>
  );
}
