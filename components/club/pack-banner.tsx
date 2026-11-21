import Link from "next/link";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
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
}) {
  const continuing = state === "continue";
  return (
    <article
      className={`relative overflow-hidden rounded-[28px] shadow-[0_18px_50px_rgba(23,53,42,0.06)] ${
        continuing ? "bg-[#f3faf4]" : "bg-[#fff8ee]"
      } ${featured ? "p-4 sm:p-6" : "p-4"}`}
    >
      <div className={`flex flex-col gap-4 md:flex-row md:items-center ${featured ? "md:pr-36" : ""}`}>
        <PackArt tone={tone} title={title} className={`mx-auto w-40 shrink-0 md:mx-0 ${featured ? "h-56 md:h-64 md:w-48" : "h-44 md:h-48 md:w-36"}`} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-extrabold tracking-[0.16em] text-[#306A51] uppercase">{continuing ? "Continue pack" : "Start pack"}</p>
          <p className="mt-2 text-sm font-bold text-[#3d5348] sm:text-base">
            {continuing ? continueLead(clubName, done, total) : "Your new pack is ready"}
          </p>
          <h2 className={`mt-1 font-display leading-tight text-[#17352A] ${featured ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>{title}</h2>
          <p className="mt-2 text-sm text-[#3d5348] sm:text-base">
            {continuing ? `Next: ${nextStep ?? "Keep going"}` : "Print the pages, then start whenever the club is ready."}
          </p>
          {continuing && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm text-[#3d5348]">
                <span>{done} of {total} steps done</span>
                <span>{paceWord(done, total)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#F3E7CF]">
                <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${total ? Math.round((done / total) * 100) : 0}%` }} />
              </div>
            </div>
          )}
          <div className="mt-4 flex items-center gap-2">
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
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button asChild variant="mustard" size="md" className="w-full sm:w-auto">
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
        <img src="/brand/mascot-spy.png" alt="" className="pointer-events-none absolute right-3 bottom-2 hidden h-36 w-auto md:block" />
      )}
    </article>
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

function PackArt({ tone, title, className = "" }: { tone: CoverTone; title: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[22px] ${tones[tone]} ${className}`}>
      <div className="absolute inset-x-3 top-3 bottom-[28%] rounded-xl bg-[#f7f1e6]">
        <CoverSketch title={title} />
      </div>
      <p className="absolute inset-x-3 bottom-3 text-center text-xs leading-tight font-bold text-white sm:text-sm">{title}</p>
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
