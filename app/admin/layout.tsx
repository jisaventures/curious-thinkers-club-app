import Link from "next/link";
import { AppShell } from "@/components/brand/shell";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const links = [
  ["Overview", "/admin"],
  ["Packs", "/admin/packs"],
  ["Submissions", "/admin/submissions"],
  ["Rewards", "/admin/rewards"],
  ["Grants", "/admin/grants"],
  ["Dashboard banner", "/admin/dashboard-banner"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { account } = await requireAdmin();
  return (
    <AppShell account={account}>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {links.map(([label, href]) => (
          <Link key={href} href={href} className="shrink-0 rounded-full bg-white px-3 py-2 text-sm font-extrabold text-[#1e4d3a]">
            {label}
          </Link>
        ))}
      </div>
      {children}
    </AppShell>
  );
}
