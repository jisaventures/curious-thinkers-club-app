"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BarChart3, ClipboardList, Lock, ShoppingBag, UserRound, Users, X } from "lucide-react";
import Link from "next/link";
import { updateGroupProfile } from "@/app/club/actions";
import { Avatar } from "@/components/brand/avatar";
import { GROUP_ICONS, GroupIcon, type GroupIconId } from "@/components/brand/group-icon";
import { GROUP_BACKGROUND_COLOURS, GROUP_ICON_COLOURS } from "@/lib/avatar-style";
import { BirthdayPicker } from "@/components/onboarding/birthday-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatWhen, shortName } from "@/lib/format";
import { toIsoDate } from "@/lib/birthday";
import { colourForChild, memberColour } from "@/lib/member-colour";
import type { loadDashboard } from "@/lib/club/data";

type DashboardData = Awaited<ReturnType<typeof loadDashboard>>;
type Section = "profile" | "orders" | "users" | "activity" | "reports";

type ClubOrder = {
  id: string;
  name: string;
  createdAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  currency: string;
  total: string;
  email: string;
  shippingCountry: string;
  items: { title: string; quantity: number; price: string }[];
  shopUrl: string;
};

export function GroupView({ data }: { data: DashboardData }) {
  const [section, setSection] = useState<Section>("profile");
  const [nameFilter, setNameFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  useEffect(() => {
    const read = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "profile" || hash === "orders" || hash === "users" || hash === "activity" || hash === "reports") setSection(hash);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  const owned = data.packs.filter((pack) => pack.owned);
  const maxScore = Math.max(1, ...data.children.map((child) => data.pointsByChild[child.id] ?? 0));
  const stamps = data.children.reduce((sum, child) => sum + finishedPacks(owned, data.doneByChild[child.id] ?? {}).length, 0);

  function choose(next: Section) {
    setSection(next);
    const url = `${window.location.pathname}${window.location.search}#${next}`;
    window.history.replaceState(null, "", url);
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-6">
      <div className="flex flex-col">
        <Link href="/club" data-variant="mustard" data-size="md" className="ctc-button w-full gap-3">
          <ArrowLeft className="size-5 shrink-0" aria-hidden="true" />
          Dashboard
        </Link>
        <hr className="my-3 h-px border-0 bg-[#306A51]/30" />
        <nav className="group-nav flex flex-col gap-4" aria-label="My Group">
          <Button type="button" variant={section === "profile" ? "green" : "white"} size="md" onClick={() => choose("profile")}>
            <UserRound className="size-5 shrink-0" aria-hidden="true" />
            Profile
          </Button>
          <Button type="button" variant={section === "orders" ? "green" : "white"} size="md" onClick={() => choose("orders")}>
            <ShoppingBag className="size-5 shrink-0" aria-hidden="true" />
            Orders
          </Button>
          <Button type="button" variant={section === "users" ? "green" : "white"} size="md" onClick={() => choose("users")}>
            <Users className="size-5 shrink-0" aria-hidden="true" />
            Members
          </Button>
          <Button type="button" variant={section === "activity" ? "green" : "white"} size="md" onClick={() => choose("activity")}>
            <ClipboardList className="size-5 shrink-0" aria-hidden="true" />
            Activity log
          </Button>
          <Button type="button" variant={section === "reports" ? "green" : "white"} size="md" onClick={() => choose("reports")}>
            <BarChart3 className="size-5 shrink-0" aria-hidden="true" />
            Reports
          </Button>
        </nav>
      </div>

      {section === "profile" && <ProfileSection data={data} />}

      {section === "orders" && <OrdersSection />}

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

type GroupIconDraft = { icon: GroupIconId; background: string; colour: string };

function isGroupIcon(value: string | null | undefined): value is GroupIconId {
  return !!value && (GROUP_ICONS as readonly string[]).includes(value);
}

function ProfileSection({ data }: { data: DashboardData }) {
  const router = useRouter();
  const { account } = data;
  const [groupName, setGroupName] = useState(account.group_name || "");
  const [leaderName, setLeaderName] = useState(account.display_name);
  const [icon, setIcon] = useState<GroupIconDraft>({
    icon: isGroupIcon(account.group_icon) ? account.group_icon : "star",
    background: account.group_bg || "2f9a4a",
    colour: account.group_icon_colour || "fff4dc",
  });
  const [draft, setDraft] = useState<GroupIconDraft | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!draft) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDraft(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [draft]);

  async function persist(nextIcon: GroupIconDraft) {
    const body = new FormData();
    body.set("groupName", groupName);
    body.set("leaderName", leaderName);
    body.set("icon", nextIcon.icon);
    body.set("background", nextIcon.background);
    body.set("colour", nextIcon.colour);
    return updateGroupProfile(body);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    setError(null);
    const result = await persist(icon);
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (result.ok) {
      setGroupName(result.groupName);
      setLeaderName(result.leaderName);
      setMessage("Saved");
      router.refresh();
    }
  }

  async function saveIcon() {
    if (!draft) return;
    setPending(true);
    setMessage(null);
    setError(null);
    const result = await persist(draft);
    setPending(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    if (result.ok) {
      setIcon(draft);
      setDraft(null);
      setMessage("Saved");
      router.refresh();
    }
  }

  return (
    <section id="profile" className="rounded-[22px] bg-white p-5 sm:p-6">
      <form className="space-y-4" onSubmit={save}>
        <button
          type="button"
          onClick={() => setDraft(icon)}
          className="group relative size-28 overflow-hidden rounded-[28px] sm:size-32"
          aria-label="Edit group icon"
        >
          <GroupIcon icon={icon.icon} background={icon.background} colour={icon.colour} className="size-full" title="Group icon" />
          <span className="pointer-events-none absolute inset-0 bg-black/0 transition group-hover:bg-black/45" />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent pt-6 pb-2 text-center text-sm font-extrabold text-white">
            Edit
          </span>
        </button>
        <div>
          <Label htmlFor="groupName">Group name</Label>
          <Input id="groupName" className="mt-1" value={groupName} onChange={(event) => setGroupName(event.target.value.replace(/\s+/g, " ").slice(0, 32))} maxLength={32} autoComplete="off" />
        </div>
        <div>
          <Label htmlFor="leaderName">Group leader first name</Label>
          <Input id="leaderName" className="mt-1" value={leaderName} onChange={(event) => setLeaderName(event.target.value.replace(/\s+/g, "").slice(0, 15))} maxLength={15} autoComplete="given-name" />
        </div>
        <div>
          <Label htmlFor="shopEmail" className="flex items-center gap-1.5">
            <Lock className="size-3.5" aria-hidden="true" />
            Shop email
          </Label>
          <Input id="shopEmail" className="mt-1" value={account.email} disabled readOnly />
          <p className="mt-1 text-xs font-semibold text-[#5e7266]">This is the email on the Shopify account. It cannot be changed here.</p>
        </div>
        {error && <p className="text-sm font-bold text-[#8a4b3a]">{error}</p>}
        {message && <p className="text-sm font-bold text-[#306A51]">{message}</p>}
        <Button type="submit" variant="mustard" size="lg" disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </form>
      {draft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDraft(null);
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="group-avatar-title" className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-xl">
            <div className="flex items-center justify-between gap-3 border-b border-[#eadfce] bg-white px-5 py-4 sm:px-6">
              <h2 id="group-avatar-title" className="step-title text-3xl">Edit group icon</h2>
              <button type="button" onClick={() => setDraft(null)} className="rounded-full p-2 text-[#1e4d3a] hover:bg-[#f6efe2]" aria-label="Close">
                <X className="size-5" />
              </button>
            </div>
            <div className="avatar-modal-scroll min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
              <div className="grid items-start gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <div className="lg:self-stretch lg:border-r lg:border-[#b9b5ad] lg:pr-5">
                  <div className="flex justify-center rounded-[24px] bg-[#f6efe2] p-3">
                    <GroupIcon icon={draft.icon} background={draft.background} colour={draft.colour} className="h-40 w-40 rounded-[24px]" title="Group icon preview" />
                  </div>
                  <ColourRow legend="Background" value={draft.background} colours={GROUP_BACKGROUND_COLOURS} onChange={(background) => setDraft({ ...draft, background })} className="mt-3" />
                  <ColourRow legend="Icon colour" value={draft.colour} colours={GROUP_ICON_COLOURS} onChange={(colour) => setDraft({ ...draft, colour })} className="mt-3" />
                </div>
                <fieldset>
                  <legend className="text-sm font-extrabold text-[#1e4d3a]">Icon</legend>
                  <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                    {GROUP_ICONS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        aria-label={item}
                        aria-pressed={draft.icon === item}
                        onClick={() => setDraft({ ...draft, icon: item })}
                        className={`aspect-square w-full overflow-hidden rounded-2xl ${draft.icon === item ? "ring-2 ring-[#173528]" : ""}`}
                      >
                        <GroupIcon icon={item} background={draft.background} colour={draft.colour} className="size-full" />
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            </div>
            <div className="border-t border-[#eadfce] bg-white px-5 py-4 sm:px-6">
              <Button type="button" variant="mustard" size="lg" className="w-full" disabled={pending} onClick={() => void saveIcon()}>
                {pending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function ColourRow({
  legend,
  colours,
  value,
  onChange,
  className = "",
}: {
  legend: string;
  colours: readonly { id: string; label: string; hex: string }[];
  value: string;
  onChange: (hex: string) => void;
  className?: string;
}) {
  return (
    <fieldset className={className}>
      <legend className="text-sm font-extrabold text-[#1e4d3a]">{legend}</legend>
      <div className="mt-2 flex flex-wrap gap-1 sm:gap-2">
        {colours.map((colour) => {
          const hex = colour.hex.replace("#", "");
          return (
            <button
              key={colour.id}
              type="button"
              aria-label={colour.label}
              aria-pressed={value.toLowerCase() === hex.toLowerCase()}
              onClick={() => onChange(hex)}
              className={`size-8 shrink-0 rounded-full border-2 sm:size-11 ${value.toLowerCase() === hex.toLowerCase() ? "border-[#173528]" : "border-[#eadfce]"}`}
              style={{ background: colour.hex }}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

function OrdersSection() {
  const [orders, setOrders] = useState<ClubOrder[] | null>(null);
  const [shopAccountUrl, setShopAccountUrl] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/club/orders")
      .then((response) => {
        if (!response.ok) throw new Error("orders");
        return response.json() as Promise<{ orders: ClubOrder[]; shopAccountUrl?: string }>;
      })
      .then((body) => {
        if (cancelled) return;
        setOrders(body.orders);
        setShopAccountUrl(body.shopAccountUrl ?? "");
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const open = orders?.find((order) => order.id === openId) ?? null;

  return (
    <section id="orders" className="space-y-3">
      {failed && <p className="rounded-2xl bg-white p-4 text-sm text-[#5e7266]">Orders could not be loaded.</p>}
      {orders && orders.length === 0 && <p className="rounded-2xl bg-white p-4 text-sm text-[#5e7266]">No shop orders yet.</p>}
      {orders === null && !failed && <p className="rounded-2xl bg-white p-4 text-sm text-[#5e7266]">Loading orders…</p>}
      <ul className="space-y-3">
        {orders?.map((order) => (
          <li key={order.id} className="rounded-[22px] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-display text-xl text-[#17352A]">{order.name}</p>
                <p className="text-sm font-semibold text-[#5e7266]">{formatWhen(order.createdAt)} · {money(order.currency, order.total)} · {order.fulfillmentStatus}</p>
              </div>
              <Button type="button" variant="white" size="sm" onClick={() => setOpenId(order.id)}>
                View order
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Dialog open={Boolean(open)} onOpenChange={(next) => { if (!next) setOpenId(null); }}>
        <DialogContent className="w-[min(100%-1.5rem,36rem)]" aria-describedby={undefined}>
          {open && (
            <>
              <DialogTitle>{open.name}</DialogTitle>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <Detail label="Placed" value={formatWhen(open.createdAt)} />
                <Detail label="Payment" value={open.financialStatus} />
                <Detail label="Delivery" value={open.fulfillmentStatus} />
                <Detail label="Total" value={money(open.currency, open.total)} />
                <Detail label="Ship to" value={open.shippingCountry} />
                <Detail label="Shop email" value={open.email} />
              </dl>
              <ul className="mt-4 space-y-2">
                {open.items.map((item) => (
                  <li key={item.title} className="flex items-center justify-between gap-3 rounded-2xl bg-[#f6efe2] px-3 py-2 text-sm font-bold text-[#17352A]">
                    <span>{item.title} × {item.quantity}</span>
                    <span>{money(open.currency, item.price)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <a href={open.shopUrl} target="_blank" rel="noreferrer" data-variant="mustard" data-size="md" className="ctc-button">
                  Open in Shopify
                </a>
                {shopAccountUrl && (
                  <a href={shopAccountUrl} target="_blank" rel="noreferrer" data-variant="white" data-size="md" className="ctc-button">
                    Shopify account
                  </a>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-extrabold tracking-wide text-[#306A51] uppercase">{label}</dt>
      <dd className="font-bold text-[#17352A]">{value}</dd>
    </div>
  );
}

function money(currency: string, amount: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return amount;
  return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(value);
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
    return { text: "Every owned quest is finished. A new one from the shop would be a good next goal.", action: "Find a quest", href: "/club/shop" };
  }
  const href = `/club/packs/${next.pack.slug}?mode=together&child=${child.id}`;
  if (next.done === 0) {
    return { text: `Start ${next.pack.title}.`, action: "Start the quest", href };
  }
  return { text: `Finish ${next.pack.title}. ${next.done} of ${next.total} steps are done.`, action: "Continue the quest", href };
}

