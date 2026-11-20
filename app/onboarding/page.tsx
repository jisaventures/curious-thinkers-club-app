import { redirect } from "next/navigation";
import { confirmAdult } from "@/app/onboarding/actions";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/brand/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AVATARS } from "@/lib/validators";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { user, account } = await requireUser();
  if (!user) redirect("/login");
  if (account?.is_adult_confirmed) redirect("/club");
  const { error } = await searchParams;

  return (
    <AppShell account={account}>
      <div className="mx-auto max-w-lg py-4">
        <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Before you start</p>
        <h1 className="mt-1 font-display text-4xl text-[#1e4d3a]">This club is looked after by an adult</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5e7266]">
          We ask for your first name, not a surname. Children are nicknames, ages and avatars. We don&apos;t collect photos of them, dates of birth, or their own email addresses.
        </p>
        <form action={confirmAdult} className="mt-5 space-y-4 rounded-[24px] bg-white p-5">
          {error && <p className="text-sm font-bold text-[#8a4b3a]">{error}</p>}
          <div className="space-y-2">
            <Label htmlFor="displayName">Your first name</Label>
            <Input id="displayName" name="displayName" required maxLength={40} defaultValue={account?.display_name === "Friend" ? "" : account?.display_name} />
          </div>
          <label className="flex items-start gap-3 text-sm leading-snug">
            <input type="checkbox" name="adult" required className="mt-1 size-5 accent-[#1e4d3a]" />
            <span>I confirm I am 18 or over, and I am the parent or guardian managing this club account.</span>
          </label>
          <fieldset className="space-y-3 rounded-2xl bg-[#fbf7f1] p-4">
            <legend className="px-1 text-sm font-extrabold text-[#1e4d3a]">First child, if you want to add one now</legend>
            <Input name="nickname" placeholder="Nickname" maxLength={24} />
            <Input name="ageYears" type="number" min={2} max={12} placeholder="Age" />
            <select name="avatarKey" className="h-12 w-full rounded-2xl border border-[#eadfce] bg-white px-3" defaultValue="explorer">
              {AVATARS.map((avatar) => (
                <option key={avatar} value={avatar}>
                  {avatar}
                </option>
              ))}
            </select>
          </fieldset>
          <Button type="submit" className="w-full" size="lg">
            Open the club
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
