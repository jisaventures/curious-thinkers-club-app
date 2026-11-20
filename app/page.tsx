import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { AppShell } from "@/components/brand/shell";

export default async function HomePage() {
  try {
    const { user, account } = await requireUser();
    if (!user) redirect("/login");
    if (!account?.is_adult_confirmed) redirect("/onboarding");
    redirect("/club");
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      String((error as { digest?: string }).digest).includes("NEXT_REDIRECT")
    ) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Supabase is not configured.";
    return (
      <AppShell account={null}>
        <div className="mx-auto max-w-lg py-10">
          <h1 className="font-display text-4xl text-[#1e4d3a]">Curious Thinkers Club</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#5e7266]">
            The members&apos; area needs a local Supabase project before it can open. Add
            SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY to .env.local, then run
            the dev server again.
          </p>
          <p className="mt-2 text-xs text-[#8a4b3a]">{message}</p>
        </div>
      </AppShell>
    );
  }
}
