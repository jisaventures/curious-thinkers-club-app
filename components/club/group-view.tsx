"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, ClipboardList, Users } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/brand/avatar";
import { BirthdayPicker } from "@/components/onboarding/birthday-picker";
import { Button } from "@/components/ui/button";
import { formatWhen, shortName } from "@/lib/format";
import { toIsoDate } from "@/lib/birthday";
import { colourForChild, memberColour } from "@/lib/member-colour";
import type { loadDashboard } from "@/lib/club/data";

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
type Section = "users" | "activity" | "reports";

export function GroupView({ data }: { data: DashboardData }) {
  const [section, setSection] = useState<Section>("users");
  const [nameFilter, setNameFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "users" || hash === "activity" || hash === "reports") setSection(hash);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const owned = data.packs.filter((pack) => pack.owned);
  const maxScore = Math.max(1, ...data.children.map((child) => data.pointsByChild[child.id] ?? 0));
  const stamps = data.children.reduce((sum, child) => sum + finishedPacks(owned, data.doneByChild[child.id] ?? {}).length, 0);

  const title = section === "activity" ? "Activity log" : section === "reports" ? "Reports" : "Users";

  function choose(next: Section) {
    setSection(next);
    const url = `${window.location.pathname}${window.location.search}#${next}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-6 lg:gap-y-4">
      <div className="flex items-center justify-between gap-4 lg:contents">
        <Button asChild variant="grey" size="md" className="shrink-0 gap-2 lg:w-full">
          <Link href="/club">
            <ArrowLeft className="size-5 shrink-0" aria-hidden="true" />
            Dashboard
          </Link>
        </Button>
        <h1 className="min-w-0 text-right font-display text-3xl text-[#306A51] lg:self-center">{title}</h1>
      </div>
      <nav className="group-nav flex flex-col gap-2" aria-label="My Group">
        <Button type="button" variant={section === "users" ? "green" : "grey"} size="md" onClick={() => choose("users")}>
          <Users className="size-5 shrink-0" aria-hidden="true" />
          Users
        </Button>
        <Button type="button" variant={section === "activity" ? "green" : "grey"} size="md" onClick={() => choose("activity")}>
          <ClipboardList className="size-5 shrink-0" aria-hidden="true" />
          Activity log
        </Button>
        <Button type="button" variant={section === "reports" ? "green" : "grey"} size="md" onClick={() => choose("reports")}>
          <BarChart3 className="size-5 shrink-0" aria-hidden="true" />
          Reports
        </Button>
      </nav>

      {section === "users" && (
        <section id="users" className="space-y-3">
          <ul className="space-y-3">
            {data.children.map((child, index) => {
              const goal = recommendedGoal(child, owned, data.doneByChild[child.id] ?? {});
              const colour = memberColour(index);
              return (
                <li key={child.id} className="flex items-center gap-4 rounded-[22px] bg-white p-4">
                  <Avatar avatar={child.avatar_key} options={child.avatar_options} gender={child.gender === "girl" ? "girl" : "boy"} title={memberName(child)} className="size-14 shrink-0 rounded-full" />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-display text-xl text-[#17352A]">
                      <span className="size-2.5 rounded-full" style={{ background: colour.dot }} />
                      {memberName(child)}
                    </p>
                    <p className="text-sm font-extrabold text-[#5e7266]">@{child.nickname}</p>
                    <p className="mt-1 text-sm text-[#3d5348]">{goal.text}</p>
                    <Link href={goal.href} className="text-sm font-extrabold text-[#306A51] underline">
                      {goal.action}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {section === "activity" && (
        <section id="activity" className="space-y-3">
          <div className="activity-filters flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="activity-name">Filter by name</label>
              <select id="activity-name" className="birthday-year h-11 px-4" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)}>
                <option value="all">All names</option>
                {data.children.map((child) => (
                  <option key={child.id} value={child.id}>{memberName(child)}</option>
                ))}
              </select>
              <BirthdayPicker
                id="activity-date"
                value={dateFilter}
                onChange={setDateFilter}
                range={activityRange(data.activities)}
                marked={activityDays(data.activities)}
                placeholder="Any date"
                note=""
                label="Filter by date"
              />
              <Button type="button" variant="grey" size="sm" disabled={nameFilter === "all" && !dateFilter} onClick={() => { setNameFilter("all"); setDateFilter(""); }}>
                Clear filters
              </Button>
          </div>
          <ul className="space-y-2">
            {filteredActivities(data, nameFilter, dateFilter).length === 0 && <li className="rounded-2xl bg-white p-4 text-sm text-[#5e7266]">Nothing has been logged yet.</li>}
            {filteredActivities(data, nameFilter, dateFilter).map((item) => {
              const colour = colourForChild(item.childId, data.children);
              return (
                <li key={item.id} className="flex items-start justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold" style={{ background: colour.wash, color: colour.ink }}>
                  <p>
                    <span className="mr-2 inline-block size-2.5 rounded-full align-middle" style={{ background: colour.dot }} />
                    {item.summary}
                  </p>
                  {item.at && <time className="shrink-0 text-xs font-extrabold">{formatWhen(item.at)}</time>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {section === "reports" && (
        <section id="reports" className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Children" value={String(data.children.length)} />
            <Stat label="Stamps" value={String(stamps)} />
            <Stat label="Steps logged" value={String(data.activities.length)} />
          </div>
          <div className="rounded-[22px] bg-white p-4">
            <h2 className="font-display text-xl text-[#17352A]">Scores</h2>
            <ul className="mt-3 space-y-3">
              {data.children.map((child) => {
                const score = data.pointsByChild[child.id] ?? 0;
                return (
                  <li key={child.id}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="font-bold text-[#17352A]">{memberName(child)}</span>
                      <span className="text-[#5e7266]">{score}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#F3E7CF]">
                      <div className="h-full rounded-full bg-[#306A51]" style={{ width: `${Math.round((score / maxScore) * 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4">
      <p className="text-xs font-extrabold tracking-wide text-[#306A51] uppercase">{label}</p>
      <p className="font-display text-3xl text-[#17352A]">{value}</p>
    </div>
  );
}

function activityDays(activities: DashboardData["activities"]) {
  const days = new Set<string>();
  for (const item of activities) {
    if (!item.at) continue;
    const day = new Date(item.at);
    if (Number.isNaN(day.getTime())) continue;
    days.add(toIsoDate(day));
  }
  return days;
}

function activityRange(activities: DashboardData["activities"]) {
  const stamps = activities.map((item) => new Date(item.at)).filter((date) => !Number.isNaN(date.getTime()));
  const earliest = stamps.length ? new Date(Math.min(...stamps.map((date) => date.getTime()))) : new Date();
  earliest.setHours(0, 0, 0, 0);
  const latest = new Date();
  latest.setHours(23, 59, 59, 999);
  return { earliest, latest };
}

function filteredActivities(data: DashboardData, nameFilter: string, dateFilter: string) {
  return data.activities.filter((item) => {
    if (nameFilter !== "all" && item.childId !== nameFilter) return false;
    if (!dateFilter || !item.at) return !dateFilter;
    const day = new Date(item.at);
    const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    return key === dateFilter;
  });
}

function memberName(child: DashboardData["children"][number]) {
  return child.first_name?.trim() || shortName(child.nickname);
}

function finishedPacks(packs: DashboardData["packs"], doneByPack: Record<string, number>) {
  return packs.filter((pack) => {
    const total = pack.total || pack.step_count;
    return total > 0 && (doneByPack[pack.id] ?? 0) >= total;
  });
}

function recommendedGoal(child: DashboardData["children"][number], packs: DashboardData["packs"], doneByPack: Record<string, number>) {
  const open = packs
    .map((pack) => ({ pack, done: doneByPack[pack.id] ?? 0, total: pack.total || pack.step_count }))
    .filter((item) => item.total > 0 && item.done < item.total)
    .sort((a, b) => b.done - a.done);
  const next = open[0];
  if (!next) {
    return { text: "Every owned pack is finished. A new one from the shop would be a good next goal.", action: "Find a pack", href: "/club/shop" };
  }
  const href = `/club/packs/${next.pack.slug}?mode=together&child=${child.id}`;
  if (next.done === 0) {
    return { text: `Start ${next.pack.title}.`, action: "Start the pack", href };
  }
  return { text: `Finish ${next.pack.title}. ${next.done} of ${next.total} steps are done.`, action: "Continue the pack", href };
}

