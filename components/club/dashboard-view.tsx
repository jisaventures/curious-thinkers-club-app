import Link from "next/link";
import { markNextStep, setFocusChild } from "@/app/club/actions";
import { signOut } from "@/app/login/actions";
import { Avatar } from "@/components/brand/avatar";
import { BookCover } from "@/components/club/book-cover";
import { ChildForm } from "@/components/club/child-form";
import { CopyCode, ShareWork } from "@/components/club/share-work";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatMonth, formatPounds, ordinal, possessive } from "@/lib/format";
import { shopUrl } from "@/lib/env";
import type { loadDashboard } from "@/lib/club/data";

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;

export function DashboardView({ data, notice }: { data: DashboardData; notice?: string }) {
  const { focus, account } = data;
  const month = formatMonth();
  const shop = shopUrl();
  const partial = [...data.packs]
    .filter((pack) => pack.owned && pack.total > 0 && pack.done > 0 && pack.done < pack.total)
    .sort((a, b) => b.done / b.total - a.done / a.total)[0];
  const hint = partial
    ? partial.slug === "become-a-spy"
      ? "Finish this spy pack and share a photo to level up."
      : `Finish “${partial.title}” and share a photo to level up.`
    : "Finish a pack and share a photo to level up.";

  return (
    <div className="space-y-5">
      <section className="rounded-[24px] bg-gradient-to-br from-[#e5f6df] via-[#f3faf0] to-[#fffdf8] p-4 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">
              <span aria-hidden>✦</span> My Club dashboard
            </p>
            <h1 className="mt-1 font-display text-3xl text-[#1e4d3a] sm:text-4xl">
              Welcome back, {account.display_name}
            </h1>
            <p className="mt-1 text-sm text-[#3d5348] sm:text-base">
              {focus
                ? `You're looking at ${possessive(focus.nickname)} adventures today.`
                : "Add a child to start a pack together."}
            </p>
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-[#5e7266]">
              This club account is managed by an adult. Kids appear as nicknames only.
            </p>
            <div className="mt-3 flex gap-3 sm:hidden">
              <Link href="/club/children" className="text-sm font-extrabold text-[#1e4d3a] underline">
                Children
              </Link>
              <form action={signOut}>
                <button className="text-sm font-extrabold text-[#1e4d3a] underline">Sign out</button>
              </form>
            </div>
          </div>
          <div>
            <p className="text-sm font-extrabold text-[#1e4d3a]">Who&apos;s joined?</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              {data.children.map((child) => {
                const active = child.id === focus?.id;
                return (
                  <form key={child.id} action={setFocusChild}>
                    <input type="hidden" name="childId" value={child.id} />
                    <button className="w-[72px] text-center" aria-pressed={active}>
                      <Avatar
                        avatar={child.avatar_key}
                        title={child.nickname}
                        className={`mx-auto size-14 rounded-full ${active ? "ring-4 ring-[#1e4d3a]" : ""}`}
                      />
                      <span className="mt-1 block truncate text-xs font-extrabold">{child.nickname.split(" ").slice(-1)}</span>
                      <span className="block text-[11px] text-[#5e7266]">Age {child.age_years}</span>
                    </button>
                  </form>
                );
              })}
              {data.children.length < 5 && (
                <Dialog>
                  <DialogTrigger className="w-[72px] text-center">
                    <span className="mx-auto flex size-14 items-center justify-center rounded-full border border-dashed border-[#c9b89a] bg-white text-2xl text-[#1e4d3a]">
                      +
                    </span>
                    <span className="mt-1 block text-xs font-extrabold">Add child</span>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Add a child</DialogTitle>
                    <DialogDescription>
                      Up to 5 children share every pack you unlock. Nicknames and avatars only.
                    </DialogDescription>
                    <div className="mt-4">
                      <ChildForm mode="add" />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <p className="mt-3 max-w-xs text-xs text-[#5e7266]">
              One pack unlocks for all your kids — up to 5 per account.
            </p>
          </div>
        </div>
      </section>

      {notice && (
        <p className="rounded-2xl bg-[#e7f5e1] px-4 py-3 text-sm font-bold text-[#1e4d3a]">{notice}</p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 className="font-display text-2xl text-[#1e4d3a]">My Packs</h2>
            {focus && <p className="text-sm font-bold text-[#5e7266]">Progress for {focus.nickname}</p>}
          </div>
          <div className="space-y-3">
            {data.packs.map((pack) => (
              <PackCard key={pack.id} pack={pack} focusId={focus?.id ?? null} shop={shop} />
            ))}
            {data.packs.length === 0 && (
              <p className="rounded-[22px] bg-white p-5 text-sm text-[#5e7266]">
                Packs you buy in the shop will show up here for every child on this account.
              </p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[22px] bg-[#1b4332] p-4 text-white">
            <p className="text-sm font-bold text-[#d7eccf]">
              {focus ? `${focus.nickname.split(" ").slice(-1)}'s points` : "Points"}
            </p>
            <p className="font-display text-5xl text-[#f5c542]">{data.points}</p>
            <p className="text-sm">Level {data.level.current.name}</p>
            {data.level.next && (
              <>
                <p className="mt-2 text-xs text-[#d7eccf]">Next level: {data.level.next.name}</p>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[#0f2c22]">
                  <div className="h-full rounded-full bg-[#f0b429]" style={{ width: `${Math.round(data.level.ratio * 100)}%` }} />
                </div>
                <p className="mt-1 text-xs text-[#f5c542]">{data.level.toGo} pts to go</p>
              </>
            )}
            <p className="mt-3 text-sm leading-snug text-[#e7f5e1]">{hint}</p>
          </section>

          <section className="rounded-[22px] border border-[#efe2d0] bg-white p-4">
            <h2 className="font-display text-xl text-[#1e4d3a]">This month&apos;s leaderboard</h2>
            <p className="text-xs text-[#5e7266]">{month} · nicknames only</p>
            <ol className="mt-3 space-y-1">
              {data.leaderboard.slice(0, 5).map((row) => {
                const highlight = focus && row.nickname === focus.nickname && row.age_years === focus.age_years;
                return (
                  <li
                    key={`${row.rank}-${row.nickname}`}
                    className={`flex items-center gap-2 rounded-2xl px-2 py-1.5 ${highlight ? "bg-[#e7f5e1]" : ""}`}
                  >
                    <Avatar avatar={row.avatar_key} className="size-9" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold">{row.nickname}</p>
                      <p className="text-[11px] text-[#5e7266]">Age {row.age_years}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-lg leading-none">{row.points}</p>
                      <p className="text-[11px] text-[#5e7266]">{ordinal(row.rank)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="rounded-[22px] bg-[#fbf6ec] p-4">
            <h2 className="font-display text-xl text-[#1e4d3a]">This month&apos;s prizes</h2>
            <p className="text-xs text-[#5e7266]">For the top three thinkers in {month}</p>
            <ul className="mt-3 space-y-2">
              {data.prizes.map((prize) => (
                <li key={prize.id} className="flex gap-2 text-sm">
                  <span aria-hidden>★</span>
                  <span>
                    <span className="font-extrabold">{prize.title}</span>
                    <span className="block text-xs text-[#5e7266]">{prize.detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[22px] border border-[#f0e0b0] bg-[#fff6dc] p-4">
            {data.unlockedReward ? (
              <>
                <p className="text-xs font-extrabold tracking-wide text-[#8a6a12] uppercase">Rewards unlocked</p>
                <h2 className="mt-1 font-display text-xl leading-tight text-[#1e4d3a]">{data.unlockedReward.headline}</h2>
                <p className="mt-1 text-sm text-[#5e7266]">{data.unlockedReward.description}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <p className="rounded-xl border border-dashed border-[#e0c56a] bg-white px-3 py-2 font-display tracking-widest">
                    {data.unlockedReward.code}
                  </p>
                  <CopyCode code={data.unlockedReward.code} />
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display text-xl text-[#1e4d3a]">Rewards</h2>
                <p className="mt-1 text-sm text-[#5e7266]">
                  {data.nextReward
                    ? `${data.nextReward.min_points - data.points} points to go until ${data.nextReward.code}.`
                    : "Shop codes will appear here when you reach a reward."}
                </p>
              </>
            )}
          </section>

          {focus && (
            <ShareWork
              childId={focus.id}
              nickname={focus.nickname.split(" ").slice(-1)[0]}
              packs={data.packs.filter((pack) => pack.owned).map((pack) => ({ id: pack.id, title: pack.title }))}
              latest={data.submissions[0] ?? null}
            />
          )}
        </aside>
      </div>
      <p className="text-center text-xs leading-relaxed text-[#5e7266]">
        We store a first name, an email, and each child&apos;s nickname, age and chosen avatar. No surnames, no dates of birth, and no photos of children.
      </p>
    </div>
  );
}

function PackCard({
  pack,
  focusId,
  shop,
}: {
  pack: DashboardData["packs"][number];
  focusId: string | null;
  shop: string;
}) {
  const pct = pack.total ? Math.round((pack.done / pack.total) * 100) : 0;
  return (
    <article className="rounded-[22px] border border-[#f0e6d6] bg-white p-4 shadow-[0_8px_24px_rgba(30,77,58,0.04)]">
      <div className="flex gap-3">
        <BookCover tone={pack.cover_tone} title={pack.title} locked={!pack.owned} />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl leading-tight text-[#1e4d3a]">{pack.title}</h3>
          <p className="mt-1 text-sm text-[#5e7266]">{pack.blurb}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Tag tone="pink">video path</Tag>
            <Tag tone="green">{pack.theme}</Tag>
            <Tag tone="sand">{pack.duration_label.replace("About ", "~")}</Tag>
          </div>
          {pack.owned && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs font-bold text-[#5e7266]">
                <span>
                  {pack.done} of {pack.total} steps
                </span>
                <span>{pct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[#f3eadc]">
                <div className="h-full rounded-full bg-[#f0b429]" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {pack.owned && focusId ? (
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={`/club/packs/${pack.slug}?mode=together&child=${focusId}`}>Continue</Link>
            </Button>
            <form action={markNextStep}>
              <input type="hidden" name="packId" value={pack.id} />
              <input type="hidden" name="childId" value={focusId} />
              <Button type="submit" size="sm">
                Mark complete
              </Button>
            </form>
          </>
        ) : (
          <Button asChild>
            <a href={shop} target="_blank" rel="noreferrer">
              Unlock, {formatPounds(pack.price_pence)}
            </a>
          </Button>
        )}
      </div>
    </article>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "pink" | "green" | "sand" }) {
  const colors = {
    pink: "bg-[#fde8f0] text-[#9a4d66]",
    green: "bg-[#e5f6df] text-[#1e4d3a]",
    sand: "bg-[#f6efe2] text-[#6d5b3e]",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-extrabold ${colors[tone]}`}>{children}</span>;
}
