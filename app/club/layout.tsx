import { AppShell } from "@/components/brand/shell";
import { requireAdult } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ClubLayout({ children }: { children: React.ReactNode }) {
  const { account } = await requireAdult();
  return <AppShell account={account}>{children}</AppShell>;
}
