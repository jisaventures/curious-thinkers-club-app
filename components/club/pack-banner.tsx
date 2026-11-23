import { Check, Clock, FileText, Play, Printer, UserRound } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/brand/avatar";
import { BookCover } from "@/components/club/book-cover";
import { Button } from "@/components/ui/button";
import type { ClubRelease } from "@/lib/club/banners";
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
              Your new pack is ready!
            </p>
          ) : (
            <p className="text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">{continuing ? "Continue pack" : "Start pack"}</p>
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
                {continuing ? `${members.length} ${members.length === 1 ? "member" : "members"} on this pack` : "Ready for the whole club"}
              </p>
            </div>
          )}
          <div className={`${compact ? "mt-2" : "mt-4"} flex flex-col gap-2 sm:flex-row`}>
            <Button asChild variant="mustard" size={compact ? "sm" : "md"} className="w-full sm:w-auto">
              <Link href={href}>{continuing ? "Continue pack" : "Start pack"}</Link>
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
          <img src="/brand/mascot-spy.png" alt="" className="h-40 w-auto" />
        </div>
      )}
    </article>
  );
}

function NewPackBanner({
  title,
  tone,
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
  return (
    <article className="relative overflow-hidden rounded-[28px] bg-[#fff8ee] p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)] sm:p-5">
      <span className="pointer-events-none absolute -top-10 -right-8 size-40 rounded-full bg-[#e7f4ea] lg:hidden" aria-hidden="true" />
      <div className="relative grid grid-cols-[6.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 lg:flex lg:items-center lg:gap-4">
        <PackArt tone={tone} title={title} className="row-span-3 h-[8.5rem] w-full lg:h-48 lg:w-[8.5rem] lg:shrink-0" />
        <div className="flex min-w-0 flex-col justify-center gap-1 lg:hidden">
          <ReadyPill className="text-[11px]" />
          <h2 className="font-display text-[1.65rem] leading-[1.05] text-[#17352A]">{title}</h2>
          {blurb && <p className="text-[13px] leading-snug text-[#3d5348]">{blurb}</p>}
        </div>
        <div className="col-span-2 min-w-0 lg:flex-1 lg:pr-4">
          <div className="hidden lg:block">
            <ReadyPill />
            <h2 className="mt-2 font-display text-[1.55rem] leading-none whitespace-nowrap text-[#17352A] xl:text-[1.85rem]">{title}</h2>
            {blurb && <p className="mt-1.5 truncate text-sm text-[#3d5348]">{blurb}</p>}
          </div>
          <ul className="mt-3 flex flex-nowrap items-center gap-x-2.5 text-[11px] font-bold whitespace-nowrap text-[#3d5348] sm:gap-x-4 sm:text-xs lg:text-[13px]">
            {durationLabel && (
              <li className="inline-flex items-center gap-1">
                <Clock className="size-3.5 shrink-0 text-[#306A51]" aria-hidden="true" />
                {durationLabel}
              </li>
            )}
            {pageCount != null && (
              <li className="inline-flex items-center gap-1">
                <FileText className="size-3.5 shrink-0 text-[#306A51]" aria-hidden="true" />
                {pageCount} pages
              </li>
            )}
            {ageMin > 0 && ageMax > 0 && (
              <li className="inline-flex items-center gap-1">
                <UserRound className="size-3.5 shrink-0 text-[#306A51]" aria-hidden="true" />
                Ages {ageMin}–{ageMax}
              </li>
            )}
          </ul>
          <div className="mt-3 flex flex-col gap-2.5 lg:flex-row">
            <Button asChild variant="mustard" size="sm" className="w-full lg:w-auto">
              <Link href={href}>
                Start pack
                <Play className="size-3.5 fill-current" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="white" size="sm" className="w-full border-2 border-[#306A51] lg:w-auto">
              <Link href={href}>
                Print pages
                <Printer className="size-3.5" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <p className="mt-2.5 text-xs text-[#3d5348] sm:text-sm lg:whitespace-nowrap">
            Prefer it printed?{" "}
            <Link href="/club/shop" className="font-extrabold text-[#306A51] underline">
              Order your workbook here
            </Link>
          </p>
        </div>
        <div className="relative hidden w-[8.75rem] shrink-0 flex-col items-end lg:flex">
          <p className="relative z-20 -ml-4 w-[8.75rem] rounded-2xl bg-white px-2.5 py-2 text-center font-display text-[13px] leading-snug font-bold text-[#306A51] shadow-[0_4px_0_#e4d7c4]">
            Don&apos;t forget to print the pages first!
            <span className="absolute -bottom-1.5 left-8 size-3 rotate-45 rounded-[2px] bg-white shadow-[2px_2px_0_#e4d7c4]" aria-hidden="true" />
          </p>
          <div className="relative mt-2 h-36 w-full">
            <span className="absolute -left-3 bottom-0 size-[9.5rem] rounded-full bg-[#e3f3e7]" aria-hidden="true" />
            <img src="/brand/mascot-spy.png" alt="" className="absolute right-0 bottom-0 z-10 h-36 w-auto" />
          </div>
        </div>
      </div>
    </article>
  );
}

function ReadyPill({ className = "" }: { className?: string }) {
  return (
    <p className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e7f5e1] px-2.5 py-1 text-xs font-bold whitespace-nowrap text-[#306A51] ${className}`}>
      <span className="size-1.5 rounded-full bg-[#306A51]" aria-hidden="true" />
      Your new pack is ready!
    </p>
  );
}

export function RecentReleases({ releases }: { releases: ClubRelease[] }) {
  return (
    <aside className="rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
      <h2 className="font-display text-xl text-[#17352A]">Recent Releases</h2>
      <ul className="mt-3 space-y-3">
        {releases.map((pack) => (
          <li key={pack.id} className="flex items-center gap-3">
            <BookCover tone={pack.coverTone} title={pack.title} locked={!pack.owned} />
            <div className="min-w-0">
              <p className="font-display text-base leading-tight text-[#17352A]">{pack.title}</p>
              {pack.owned ? (
                <p className="mt-1 flex items-center gap-1 text-sm font-extrabold text-[#306A51]">
                  <Check className="size-4" strokeWidth={3} aria-hidden="true" />
                  Already Owned
                </p>
              ) : (
                <Button asChild variant="mustard" size="sm" className="mt-2">
                  <Link href="/club/shop">Unlock</Link>
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function EmptyPackBanner() {
  return (
    <article className="rounded-[28px] bg-[#fff8ee] p-6 text-[#3d5348] shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
      <p className="text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">Start pack</p>
      <h2 className="mt-2 font-display text-3xl text-[#17352A]">Your club is ready for a pack</h2>
      <p className="mt-2">When you buy a pack, it will show up here for the whole club.</p>
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
    <div className={`relative overflow-hidden rounded-[22px] ${tones[tone]} ${className}`}>
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
