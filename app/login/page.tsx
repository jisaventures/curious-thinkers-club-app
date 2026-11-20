import { AppShell } from "@/components/brand/shell";
import { DemoLogin, MagicLinkForm } from "@/app/login/magic-link-form";
import { demoLoginEnabled } from "@/lib/env";
import { isDemoMode } from "@/lib/demo/mode";

export default function LoginPage() {
  const demo = isDemoMode();
  return (
    <AppShell account={null}>
      <div className="mx-auto max-w-lg py-6 sm:py-10">
        <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Members&apos; club</p>
        <h1 className="mt-2 font-display text-4xl text-[#1e4d3a] sm:text-5xl">Curious Thinkers Club</h1>
        <p className="mt-3 text-base leading-relaxed text-[#3d5348]">
          Printable learning packs for ages 2–10+, with a video path the whole family can follow. An adult manages the account. Children appear as nicknames only.
        </p>
        <div className="mt-6 rounded-[24px] bg-white p-5 shadow-sm">
          <h2 className="font-display text-2xl text-[#1e4d3a]">Sign in</h2>
          <p className="mt-1 mb-4 text-sm text-[#5e7266]">
            {demo
              ? "Demo mode is on, so you are signed in as the sample family without email or a database."
              : "We email you a one-time link. There is no password to remember or to lose."}
          </p>
          {!demo && <MagicLinkForm showShop />}
          {(demo || demoLoginEnabled()) && <DemoLogin />}
        </div>
      </div>
    </AppShell>
  );
}
