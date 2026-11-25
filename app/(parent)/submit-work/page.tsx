import Link from "next/link";
import { ShareWork } from "@/components/club/share-work";
import { loadDashboard } from "@/lib/club/data";
import { shortName } from "@/lib/format";

export default async function UploadsPage() {
  const data = await loadDashboard();
  const focus = data.focus;
  const latest = data.submissions.find((row) => !focus || row.child_id === focus.id) ?? null;
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/club" className="text-sm font-extrabold text-[#306A51] no-underline hover:underline">
        Back to club
      </Link>
      <h1 className="font-display text-3xl text-[#17352A]">Submit work</h1>
      <p className="text-[#3d5348]">Share a photo of finished work. It stays off the main club page.</p>
      {focus ? (
        <ShareWork
          childId={focus.id}
          nickname={shortName(focus.nickname)}
          packs={data.packs.filter((pack) => pack.owned).map((pack) => ({ id: pack.id, title: pack.title }))}
          latest={latest}
        />
      ) : (
        <p className="text-[#5e7266]">Add a child before uploading work.</p>
      )}
    </div>
  );
}
