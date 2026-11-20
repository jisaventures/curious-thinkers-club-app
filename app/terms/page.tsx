import { AppShell } from "@/components/brand/shell";

export default function TermsPage() {
  return (
    <AppShell account={null}>
      <article className="w-full py-4 sm:py-6">
        <p className="text-xs font-extrabold tracking-wide text-[#c45b73] uppercase">Terms</p>
        <h1 className="mt-2 font-display text-4xl text-[#1e4d3a]">Terms and conditions</h1>
        <p className="mt-3 text-base leading-relaxed text-[#3d5348]">
          The terms and conditions for the Curious Thinkers Club are not published yet. A parent or guardian still manages the account, and children appear as nicknames only.
        </p>
      </article>
    </AppShell>
  );
}
