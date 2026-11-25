import { AppShell } from "@/components/brand/shell";
import { requireAdult } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SubmitWorkLayout({ children }: { children: React.ReactNode }) {
  const { account } = await requireAdult();
  return (
    <AppShell account={account} variant="parent">
      {children}
    </AppShell>
  );
}
