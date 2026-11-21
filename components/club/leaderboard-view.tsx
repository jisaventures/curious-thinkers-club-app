"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { Scrapbook } from "@/components/club/scrapbook";
import { buildBoard, PERIODS, REGIONS, type Move, type PeriodId } from "@/lib/leaderboard";
import type { ClubChild } from "@/lib/club/data";
import type { LeaderboardData, LeaderboardPerson } from "@/lib/club/leaderboard-data";

export function LeaderboardView({ data }: { data: LeaderboardData }) {
  const [scope, setScope] = useState<"global" | "group">("global");
  const [region, setRegion] = useState<(typeof REGIONS)[number]>("Worldwide");
  const [period, setPeriod] = useState<PeriodId>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const ranked = useMemo(
    () => buildBoard(data.people, period, scope, region),
    [data.people, period, scope, region],
  );
  const byId = useMemo(() => new Map(data.people.map((person) => [person.id, person])), [data.people]);
  const top = ranked.slice(0, 30);
  const mine = ranked.filter((row) => byId.get(row.id)?.isMine);
  const open = openId ? byId.get(openId) : null;
  const openRank = open ? ranked.find((row) => row.id === open.id) : null;

  return (
    <div className="space-y-6">
      <div className="activity-filters flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="board-scope">Leaderboard</label>
        <select id="board-scope" className="birthday-year h-11 px-4" value={scope} onChange={(event) => setScope(event.target.value as "global" | "group")}>
          <option value="global">Global</option>
          <option value="group">Group</option>
        </select>
        <label className="sr-only" htmlFor="board-region">Region</label>
        <select id="board-region" className="birthday-year h-11 px-4" value={region} onChange={(event) => setRegion(event.target.value as (typeof REGIONS)[number])}>
          {REGIONS.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
        <label className="sr-only" htmlFor="board-time">Time</label>
        <select id="board-time" className="birthday-year h-11 px-4" value={period} onChange={(event) => setPeriod(event.target.value as PeriodId)}>
          {PERIODS.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(16rem,1fr)]">
        {top.length === 0 ? (
          <p className="rounded-[22px] bg-white p-5 text-sm font-bold text-[#5e7266]">No scores in this leaderboard yet.</p>
        ) : (
          <ol className="space-y-2">
            {top.map((row) => {
              const person = byId.get(row.id);
              if (!person) return null;
              return (
                <li key={row.id}>
                  <BoardRow person={person} rank={row.rank} points={row.points} move={row.move} onOpen={() => setOpenId(person.id)} />
                </li>
              );
            })}
          </ol>
        )}

        <section className="rounded-[28px] bg-white p-4 shadow-[0_16px_40px_rgba(23,53,42,0.06)] lg:sticky lg:top-24">
          <h2 className="font-display text-2xl text-[#306A51]">Your rank</h2>
          {mine.length === 0 ? (
            <p className="mt-3 text-sm font-bold text-[#5e7266]">Nobody in your group has a score for this filter.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {mine.map((row) => {
                const person = byId.get(row.id);
                if (!person) return null;
                return (
                  <li key={row.id}>
                    <BoardRow person={person} rank={row.rank} points={row.points} move={row.move} large onOpen={() => setOpenId(person.id)} />
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      {open && (
        <Scrapbook
          child={asChild(open)}
          packs={data.packs}
          doneByPack={open.doneByPack}
          points={openRank?.points ?? 0}
          rank={openRank?.rank ?? mine.find((row) => row.id === open.id)?.rank ?? ranked.length}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  );
}

function BoardRow({
  person,
  rank,
  points,
  move,
  large = false,
  onOpen,
}: {
  person: LeaderboardPerson;
  rank: number;
  points: number;
  move: Move;
  large?: boolean;
  onOpen: () => void;
}) {
  const first = person.firstName?.trim();
  const name = first ? `@${person.nickname} (${first})` : `@${person.nickname}`;
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white px-3 ${large ? "py-4" : "py-2"} ${person.isMine ? "ring-2 ring-[#e8a428]" : ""}`}>
      <p className={`w-10 shrink-0 text-center font-display text-[#306A51] ${large ? "text-3xl" : "text-xl"}`}>{rank}</p>
      <MoveMark move={move} />
      <button type="button" onClick={onOpen} className="shrink-0 rounded-full" aria-label={`Open ${name}'s scrapbook`}>
        <Avatar
          avatar={person.avatarKey}
          options={person.avatarOptions}
          colour={person.avatarBg}
          face={person.avatarFace}
          hairStyle={person.avatarHairStyle}
          hairColour={person.avatarHairColour}
          glasses={person.avatarGlasses}
          hat={person.avatarHat}
          gender={person.gender === "girl" ? "girl" : "boy"}
          skin={person.avatarSkin}
          eyeColour={person.avatarEyes}
          shirt={person.avatarShirt}
          title={name}
          className={large ? "size-16 rounded-full" : "size-12 rounded-full"}
        />
      </button>
      <p className={`min-w-0 flex-1 truncate font-bold text-[#17352A] ${large ? "text-lg" : "text-sm"}`}>{name}</p>
      <p className={`shrink-0 font-display text-[#17352A] ${large ? "text-3xl" : "text-xl"}`}>{points}</p>
    </div>
  );
}

function MoveMark({ move }: { move: Move }) {
  if (move === "up") return <ArrowUp className="size-5 shrink-0 text-[#2f9d4a]" aria-label="Moving up" />;
  if (move === "down") return <ArrowDown className="size-5 shrink-0 text-[#d64545]" aria-label="Moving down" />;
  return <Minus className="size-5 shrink-0 text-[#8d8982]" aria-label="Staying put" />;
}

function asChild(person: LeaderboardPerson): ClubChild {
  return {
    id: person.id,
    nickname: person.nickname,
    first_name: person.firstName,
    avatar_key: person.avatarKey,
    age_years: person.ageYears,
    gender: person.gender,
    avatar_options: person.avatarOptions,
    avatar_bg: person.avatarBg,
    avatar_face: person.avatarFace,
    avatar_hair_style: person.avatarHairStyle,
    avatar_hair_colour: person.avatarHairColour,
    avatar_glasses: person.avatarGlasses,
    avatar_hat: person.avatarHat,
    avatar_skin: person.avatarSkin,
    avatar_eyes: person.avatarEyes,
    avatar_shirt: person.avatarShirt,
    created_at: person.createdAt,
  };
}
