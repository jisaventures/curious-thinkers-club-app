"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/brand/avatar";
import { formatWhen, shortName } from "@/lib/format";
import { colourForChild, memberColour } from "@/lib/member-colour";
import type { loadDashboard } from "@/lib/club/data";

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
type Section = "users" | "activity" | "reports";

export function GroupView({ data }: { data: DashboardData }) {
  const [section, setSection] = useState<Section>("users");
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

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav className="rounded-[24px] bg-white p-3 shadow-[0_10px_30px_rgba(23,53,42,0.05)]" aria-label="My Group">
        <SideLink href="#users" active={section === "users"} onClick={() => setSection("users")}>
          Users
        </SideLink>
        <div className="mb-3 flex flex-wrap gap-1 px-2">
          {data.children.map((child) => (
            <Avatar key={child.id} avatar={child.avatar_key} options={child.avatar_options} gender={child.gender === "girl" ? "girl" : "boy"} title={memberName(child)} className="size-8 rounded-full" />
          ))}
        </div>
        <SideLink href="#activity" active={section === "activity"} onClick={() => setSection("activity")}>
          Activity log
        </SideLink>
        <SideLink href="#reports" active={section === "reports"} onClick={() => setSection("reports")}>
          Reports
        </SideLink>
      </nav>

      {section === "users" && (
        <section id="users" className="space-y-3">
          <h1 className="font-display text-3xl text-[#306A51]">Users</h1>
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
          <h1 className="font-display text-3xl text-[#306A51]">Activity log</h1>
          <ul className="space-y-2">
            {data.activities.length === 0 && <li className="rounded-2xl bg-white p-4 text-sm text-[#5e7266]">Nothing has been logged yet.</li>}
            {data.activities.map((item) => {
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
          <h1 className="font-display text-3xl text-[#306A51]">Reports</h1>
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

function SideLink({ href, active, onClick, children }: { href: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <a href={href} onClick={onClick} className={`block rounded-2xl px-3 py-2 font-display text-lg no-underline ${active ? "bg-[#306A51] text-white" : "text-[#306A51] hover:bg-[#f6efe2]"}`}>
      {children}
    </a>
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

