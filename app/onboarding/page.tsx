import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/wizard";
import { AppShell } from "@/components/brand/shell";
import { requireUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { firstNameFromShopAccount } from "@/lib/auth/shopify";
import { demoAccountFromCookie } from "@/lib/demo/view";

export default async function OnboardingPage() {
  if (isDemoMode()) {
    const jar = await cookies();
    const account = demoAccountFromCookie(jar.get("ctc_demo_persona")?.value);
    if (account?.is_adult_confirmed) redirect(account.role === "admin" ? "/admin" : "/club");
    return (
      <AppShell account={null}>
        <OnboardingWizard shopFirstName={firstNameFromShopAccount(account?.display_name)} />
      </AppShell>
    );
  }

  const { user, account } = await requireUser();
  if (!user) redirect("/login");
  if (account?.is_adult_confirmed) redirect("/club");
  return (
    <AppShell account={account}>
      <OnboardingWizard shopFirstName={firstNameFromShopAccount(account?.display_name)} />
    </AppShell>
  );
}
