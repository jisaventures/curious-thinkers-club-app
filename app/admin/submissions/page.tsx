import { reviewSubmission } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/demo/mode";
import { demoSubmissions } from "@/lib/demo/view";
import { Button } from "@/components/ui/button";

export default async function SubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const query = await searchParams;
  const { supabase } = await requireAdmin();
  const withUrls = isDemoMode()
    ? demoSubmissions()
    : await (async () => {
        const { data, error } = await supabase
          .from("submissions")
          .select("id, storage_path, status, consent_social, created_at, child_id, pack_id")
          .order("created_at", { ascending: false })
          .limit(40);
        if (error) throw new Error(error.message);
        const childIds = [...new Set((data ?? []).map((row) => row.child_id))];
        const { data: children } = childIds.length
          ? await supabase.from("children").select("id, nickname").in("id", childIds)
          : { data: [] };
        const names = new Map((children ?? []).map((child) => [child.id, child.nickname]));
        return Promise.all(
          (data ?? []).map(async (row) => {
            const signed = await supabase.storage.from("work-submissions").createSignedUrl(row.storage_path, 60 * 10);
            return { ...row, url: signed.data?.signedUrl ?? "", nickname: names.get(row.child_id) ?? "Nickname hidden" };
          }),
        );
      })();

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-[#1e4d3a]">Submissions</h1>
      <p className="text-sm text-[#5e7266]">
        Approve only work with no child&apos;s face and no surname. Every upload already has the parent&apos;s social consent.
      </p>
      {query.error && <p className="text-sm font-bold text-[#8a4b3a]">{query.error}</p>}
      {query.saved && <p className="text-sm font-bold text-[#1e4d3a]">Updated.</p>}
      {withUrls.length === 0 && <p className="rounded-[22px] bg-white p-4 text-sm">Nothing in the queue.</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {withUrls.map((row) => (
          <article key={row.id} className="rounded-[22px] bg-white p-4">
            {row.url ? (
              // Signed URLs expire and are private to this admin session.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={row.url} alt={`Work by ${row.nickname}`} className="mb-3 max-h-64 w-full rounded-2xl object-cover" />
            ) : (
              <p className="mb-3 text-sm">Preview unavailable.</p>
            )}
            <p className="font-extrabold">{row.nickname}</p>
            <p className="text-xs text-[#5e7266]">
              {row.status} · consent {row.consent_social ? "yes" : "no"} · {new Date(row.created_at).toLocaleString("en-GB")}
            </p>
            {row.status === "pending" && (
              <div className="mt-3 flex gap-2">
                <form action={reviewSubmission}>
                  <input type="hidden" name="submissionId" value={row.id} />
                  <input type="hidden" name="status" value="approved" />
                  <Button type="submit" size="sm">Approve · 25 pts</Button>
                </form>
                <form action={reviewSubmission}>
                  <input type="hidden" name="submissionId" value={row.id} />
                  <input type="hidden" name="status" value="rejected" />
                  <Button type="submit" size="sm" variant="outline">Reject</Button>
                </form>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
