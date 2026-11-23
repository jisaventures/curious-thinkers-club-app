import { Check } from "lucide-react";
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
  featured?: boolean;
  compact?: boolean;
}) {
  const continuing = state === "continue";
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(23,53,42,0.06)] ${
        continuing ? "bg-[#f3faf4]" : "bg-[#fff8ee]"
      } ${compact ? "p-3" : featured ? "p-4 sm:p-6" : "p-4"}`}
    >
      <div className={`flex flex-col md:flex-row md:items-center ${compact ? "gap-3" : "gap-4"} ${featured ? "md:pr-8" : ""}`}>
        <PackArt tone={tone} title={title} compact={compact} className={`mx-auto shrink-0 md:mx-0 ${compact ? "h-24 w-20" : featured ? "h-56 w-40 md:h-64 md:w-48" : "h-44 w-36 md:h-48"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">{continuing ? "Continue pack" : "Start pack"}</p>
          {!compact && (
            <p className="mt-2 text-sm font-bold text-[#3d5348] sm:text-base">
              {continuing ? continueLead(clubName, done, total) : "Your new pack is ready"}
            </p>
          )}
          <h2 className={`font-display leading-tight text-[#17352A] ${compact ? "mt-1 text-lg" : featured ? "mt-1 text-2xl whitespace-nowrap sm:text-3xl" : "mt-1 text-2xl sm:text-3xl"}`}>{title}</h2>
          {(continuing || !featured) && (
            <p className={`${compact ? "mt-1 text-sm" : "mt-2 text-sm sm:text-base"} text-[#3d5348]`}>
              {continuing ? `Next: ${nextStep ?? "Keep going"}` : "Print the pages, then start whenever the club is ready."}
            </p>
          )}
          {featured && !continuing && (
            <p className="mt-2 text-sm text-[#3d5348] sm:text-base md:hidden">Print the pages, then start whenever the club is ready.</p>
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
              <Button asChild variant="white" size="md" className="w-full sm:w-auto">
                <Link href={href}>Print pages</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      {featured && (
        <div className="pointer-events-none absolute top-3 right-3 hidden items-start md:flex">
          {!continuing && (
            <p className="relative mt-8 mr-1 w-52 rounded-2xl bg-white px-4 py-2.5 text-center font-display text-sm font-bold leading-snug text-[#306A51] shadow-[0_5px_0_#e4d7c4]">
              Print the pages, then start whenever the club is ready.
              <span aria-hidden="true" className="absolute right-3 -bottom-[7px] h-0 w-0 border-x-8 border-t-[8px] border-x-transparent border-t-[#e4d7c4]" />
              <span aria-hidden="true" className="absolute right-3 -bottom-[3px] h-0 w-0 border-x-8 border-t-[8px] border-x-transparent border-t-white" />
            </p>
          )}
          <img src="/brand/mascot-spy.png" alt="" className="h-28 w-auto" />
        </div>
      )}
    </article>
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
