"use client";

import { useState } from "react";
import { voteNextPack } from "@/app/club/actions";
import type { ClubPoll } from "@/lib/club/banners";

export function PackPoll({ poll }: { poll: ClubPoll }) {
  const [current, setCurrent] = useState(poll);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const total = current.options.reduce((sum, option) => sum + option.votes, 0);
  const locked = !current.open || Boolean(current.votedOptionId);

  async function choose(optionId: string) {
    if (locked || pending) return;
    setPending(optionId);
    setError(null);
    const result = await voteNextPack(optionId);
    setPending(null);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setCurrent({
      ...current,
      votedOptionId: optionId,
      options: current.options.map((option) => (option.id === optionId ? { ...option, votes: option.votes + 1 } : option)),
    });
  }

  return (
    <aside className="flex h-full flex-col rounded-[28px] bg-white p-4 shadow-[0_18px_50px_rgba(23,53,42,0.06)]">
      <h2 className="font-display text-xl leading-tight text-[#17352A]">Next pack poll</h2>
      <p className="mt-1 text-sm text-[#3d5348]">{current.question}</p>
      <p className="mt-2 text-xs font-extrabold text-[#5e7266]">
        Opens {formatPollDate(current.opensAt)} · Closes {formatPollDate(current.closesAt)}
      </p>
      <p className="mt-1 text-xs font-bold text-[#306A51]">One vote for the whole group · {total} {total === 1 ? "vote" : "votes"}</p>
      <ul className="mt-3 space-y-2">
        {current.options.map((option) => {
          const chosen = current.votedOptionId === option.id;
          const width = total ? Math.round((option.votes / total) * 100) : 0;
          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={locked || pending !== null}
                onClick={() => void choose(option.id)}
                className={`w-full rounded-2xl border px-3 py-2 text-left ${chosen ? "border-[#306A51] bg-[#e7f5e1]" : "border-[#eadfce] bg-[#fffdf8]"} disabled:cursor-default`}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-extrabold text-[#17352A]">
                  <span>{option.label}</span>
                  <span>{option.votes}</span>
                </span>
                <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[#F3E7CF]">
                  <span className="block h-full rounded-full bg-[#306A51]" style={{ width: `${width}%` }} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p className="mt-2 text-sm font-bold text-[#8a4b3a]">{error}</p>}
      {current.votedOptionId && <p className="mt-2 text-xs font-bold text-[#306A51]">Your group has voted.</p>}
    </aside>
  );
}

function formatPollDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(date);
}
