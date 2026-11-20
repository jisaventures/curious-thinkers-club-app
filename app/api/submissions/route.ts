import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { demoAddSubmission } from "@/lib/demo/handlers";
import { isDemoMode } from "@/lib/demo/mode";
import { demoDb } from "@/lib/demo/store";
import { friendlyError } from "@/lib/utils";
import { uuidSchema } from "@/lib/validators";

const MAX_BYTES = 5 * 1024 * 1024;

function sniff(buffer: Buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { type: "image/jpeg", ext: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { type: "image/png", ext: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { type: "image/webp", ext: "webp" };
  }
  return null;
}

export async function POST(request: Request) {
  const { supabase, user, account } = await requireUser();
  if (!user || !account?.is_adult_confirmed) {
    return NextResponse.json({ error: "Sign in as the adult account holder." }, { status: 401 });
  }
  const form = await request.formData();
  if (form.get("consent") !== "true") {
    return NextResponse.json(
      { error: "Tick the consent box before uploading. We only share work a parent has agreed to." },
      { status: 400 },
    );
  }

  const childId = uuidSchema.safeParse(form.get("childId"));
  const packRaw = form.get("packId");
  const packId = typeof packRaw === "string" && packRaw ? uuidSchema.safeParse(packRaw) : null;
  if (!childId.success || (packId && !packId.success)) {
    return NextResponse.json({ error: "Choose which child this work belongs to." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo of the work." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Photos need to be under 5MB." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const kind = sniff(bytes);
  if (!kind) {
    return NextResponse.json({ error: "Use a JPG, PNG or WEBP photo." }, { status: 400 });
  }

  if (isDemoMode()) {
    const child = demoDb().children.find((item) => item.id === childId.data && item.account_id === account.id);
    if (!child) return NextResponse.json({ error: "That child is not on this account." }, { status: 403 });
    const saved = await demoAddSubmission({
      accountId: account.id,
      childId: childId.data,
      packId: packId?.success ? packId.data : null,
      previewUrl: `data:${kind.type};base64,${bytes.toString("base64")}`,
    });
    if ("error" in saved) return NextResponse.json({ error: saved.error }, { status: 429 });
    return NextResponse.json({ ok: true });
  }

  const { count } = await supabase
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("account_id", account.id)
    .eq("status", "pending");
  if ((count ?? 0) >= 8) {
    return NextResponse.json({ error: "You already have 8 photos waiting for approval." }, { status: 429 });
  }

  const { data: child } = await supabase
    .from("children")
    .select("id")
    .eq("id", childId.data)
    .eq("account_id", account.id)
    .maybeSingle();
  if (!child) return NextResponse.json({ error: "That child is not on this account." }, { status: 403 });

  const id = crypto.randomUUID();
  const path = `${user.id}/${id}.${kind.ext}`;
  const uploaded = await supabase.storage.from("work-submissions").upload(path, bytes, {
    contentType: kind.type,
    upsert: false,
  });
  if (uploaded.error) {
    return NextResponse.json({ error: "The photo could not be stored." }, { status: 500 });
  }

  const inserted = await supabase.from("submissions").insert({
    id,
    account_id: account.id,
    child_id: childId.data,
    pack_id: packId?.success ? packId.data : null,
    storage_path: path,
    consent_social: true,
    status: "pending",
  });
  if (inserted.error) {
    await supabase.storage.from("work-submissions").remove([path]);
    return NextResponse.json({ error: friendlyError(inserted.error.message) }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
