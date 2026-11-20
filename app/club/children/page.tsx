import { ChildForm, RemoveChildButton } from "@/components/club/child-form";
import { Avatar } from "@/components/brand/avatar";
import { requireAdult } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoChildren } from "@/lib/demo/view";
import type { AvatarKey } from "@/lib/validators";

export default async function ChildrenPage() {
  const { supabase, account } = await requireAdult();
  const children = isDemoMode()
    ? demoChildren(account.id)
    : await (async () => {
        const { data, error } = await supabase
          .from("children")
          .select("id, nickname, avatar_key, age_years, avatar_bg, avatar_face")
          .eq("account_id", account.id)
          .order("created_at");
        if (error) throw new Error(error.message);
        return (data ?? []) as Array<{
          id: string;
          nickname: string;
          avatar_key: AvatarKey;
          age_years: number;
          avatar_bg?: string | null;
          avatar_face?: string | null;
        }>;
      })();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-3xl text-[#1e4d3a]">Children</h1>
        <p className="mt-1 max-w-xl text-sm text-[#5e7266]">
          Up to five nicknames on this account. A pack you own unlocks for all of them. We never ask for a surname or a photo.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {children.map((child) => (
          <section key={child.id} className="rounded-[22px] bg-white p-4">
            <div className="mb-3 flex items-center gap-3">
              <Avatar avatar={child.avatar_key} colour={child.avatar_bg} face={child.avatar_face} className="size-12" />
              <div>
                <p className="font-extrabold">{child.nickname}</p>
                <p className="text-xs text-[#5e7266]">Age {child.age_years}</p>
              </div>
            </div>
            <ChildForm mode="edit" child={child} />
            <div className="mt-3">
              <RemoveChildButton childId={child.id} nickname={child.nickname} />
            </div>
          </section>
        ))}
        {children.length < 5 ? (
          <section className="rounded-[22px] bg-white p-4">
            <h2 className="mb-3 font-display text-2xl text-[#1e4d3a]">Add a child</h2>
            <ChildForm mode="add" />
          </section>
        ) : (
          <p className="rounded-[22px] bg-[#fff6dc] p-4 text-sm font-bold">This account already has 5 children.</p>
        )}
      </div>
    </div>
  );
}
