"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Avatar } from "@/components/brand/avatar";
import { Button } from "@/components/ui/button";
import { ordinal, shortName } from "@/lib/format";
import type { CoverTone } from "@/lib/validators";
import type { ClubChild, ClubPack } from "@/lib/club/data";

export function Scrapbook({
  child,
  packs,
  doneByPack,
  points,
  rank,
  onClose,
}: {
  child: ClubChild;
  packs: ClubPack[];
  doneByPack: Record<string, number>;
  points: number;
  rank: number;
  onClose: () => void;
}) {
  const [certificate, setCertificate] = useState<ClubPack | null>(null);
  const name = child.first_name?.trim() || shortName(child.nickname);
  const stamps = packs.filter((pack) => {
    const total = pack.total || pack.step_count;
    const done = doneByPack[pack.id] ?? 0;
    return total > 0 && done >= total;
  });

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#143528]/45 p-3 sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="scrapbook-title" className="relative w-full max-w-5xl overflow-hidden rounded-[28px] bg-[#f6efe2] p-3 shadow-[0_8px_0_#c48614] sm:p-5">
        <button type="button" onClick={onClose} className="absolute top-3 right-3 z-10 rounded-full bg-white p-2 text-[#17352A] shadow-[0_3px_0_#c9b89a]" aria-label="Close">
          <X className="size-4" />
        </button>
        {certificate ? (
          <Certificate name={name} pack={certificate.title} onBack={() => setCertificate(null)} />
        ) : (
          <div className="grid overflow-hidden rounded-[22px] bg-[#fffdf8] md:grid-cols-2">
            <section className="border-[#eadfce] p-5 md:border-r md:border-dashed">
              <p id="scrapbook-title" className="font-display text-sm tracking-[0.14em] text-[#306A51] uppercase">Scrapbook</p>
              <div className="mt-4 flex items-center gap-4">
                <Avatar
                  avatar={child.avatar_key}
                  colour={child.avatar_bg}
                  face={child.avatar_face}
                  hairStyle={child.avatar_hair_style}
                  hairColour={child.avatar_hair_colour}
                  glasses={child.avatar_glasses}
                  hat={child.avatar_hat}
                  gender={child.gender === "girl" ? "girl" : "boy"}
                  skin={child.avatar_skin}
                  eyeColour={child.avatar_eyes}
                  shirt={child.avatar_shirt}
                  options={child.avatar_options}
                  title={name}
                  className="size-24 shrink-0 rounded-full"
                />
                <div>
                  <h2 className="font-display text-3xl text-[#17352A]">{name}</h2>
                  <p className="text-sm font-extrabold text-[#5e7266]">@{child.nickname}</p>
                </div>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <Fact label="Age" value={`${child.age_years} years old`} />
                <Fact label="Joined" value={formatJoined(child.created_at)} />
                <Fact label="Score" value={String(points)} />
                <Fact label="Rank" value={ordinal(rank)} />
              </dl>
              <p className="mt-3 text-xs text-[#5e7266]">Rank is a placeholder for now. It will follow scores.</p>
            </section>
            <section className="p-5">
              <p className="font-display text-sm tracking-[0.14em] text-[#306A51] uppercase">Stamps</p>
              {stamps.length === 0 ? (
                <p className="mt-4 max-w-sm text-base leading-relaxed text-[#3d5348]">
                  Finish a pack to earn a stamp in this book. Each stamp opens a certificate with {name}&apos;s name on it.
                </p>
              ) : (
                <ul className="mt-4 flex flex-wrap gap-4">
                  {stamps.map((pack, index) => (
                    <li key={pack.id}>
                      <button
                        type="button"
                        onClick={() => setCertificate(pack)}
                        className="flex w-24 flex-col items-center gap-2"
                        style={{ rotate: `${index % 2 === 0 ? -6 : 5}deg` }}
                      >
                        <span className={`flex size-16 items-center justify-center rounded-full border-4 border-[#e8a428] bg-white font-display text-lg text-[#306A51] shadow-[0_4px_0_#c48614] ${stampTint(pack.cover_tone)}`}>
                          {pack.title.slice(0, 1)}
                        </span>
                        <span className="text-center text-xs font-extrabold text-[#17352A]">Open certificate</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Certificate({ name, pack, onBack }: { name: string; pack: string; onBack: () => void }) {
  return (
    <div className="rounded-[22px] bg-[#fffdf8] px-5 py-6 text-center sm:px-10">
      <p className="font-display text-sm tracking-[0.16em] text-[#306A51] uppercase">Curious Thinkers Club</p>
      <h2 className="mt-2 font-display text-4xl text-[#17352A]">Certificate</h2>
      <p className="mt-4 text-lg text-[#3d5348]">This certifies that</p>
      <p className="mt-1 font-display text-3xl text-[#306A51]">{name}</p>
      <p className="mt-3 text-lg text-[#3d5348]">finished</p>
      <p className="font-display text-2xl text-[#17352A]">{pack}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button type="button" variant="mustard" size="md" onClick={() => printCertificate(name, pack)}>
          Print
        </Button>
        <Button type="button" variant="green" size="md" onClick={() => downloadCertificate(name, pack)}>
          Download
        </Button>
        <Button type="button" variant="grey" size="md" onClick={onBack}>
          Back to the book
        </Button>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f6efe2] px-3 py-2">
      <dt className="text-xs font-extrabold tracking-wide text-[#306A51] uppercase">{label}</dt>
      <dd className="font-display text-lg text-[#17352A]">{value}</dd>
    </div>
  );
}

function stampTint(tone: CoverTone) {
  if (tone === "navy") return "bg-[#e7eef8]";
  if (tone === "palm") return "bg-[#e7f5e1]";
  if (tone === "plum") return "bg-[#f3e8f6]";
  if (tone === "sea") return "bg-[#e5f4f6]";
  return "bg-[#fff6dc]";
}

function formatJoined(value?: string | null) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function certificateSvg(name: string, pack: string) {
  const escape = (text: string) => text.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] ?? char);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
  <rect width="1200" height="800" fill="#fffdf8"/>
  <rect x="36" y="36" width="1128" height="728" fill="none" stroke="#306A51" stroke-width="8"/>
  <rect x="56" y="56" width="1088" height="688" fill="none" stroke="#E8A428" stroke-width="4"/>
  <text x="600" y="180" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#306A51">Curious Thinkers Club</text>
  <text x="600" y="280" text-anchor="middle" font-family="Georgia, serif" font-size="72" fill="#17352A">Certificate</text>
  <text x="600" y="370" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#3d5348">This certifies that</text>
  <text x="600" y="460" text-anchor="middle" font-family="Georgia, serif" font-size="64" fill="#306A51">${escape(name)}</text>
  <text x="600" y="540" text-anchor="middle" font-family="Georgia, serif" font-size="32" fill="#3d5348">finished</text>
  <text x="600" y="610" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#17352A">${escape(pack)}</text>
</svg>`;
}

function downloadCertificate(name: string, pack: string) {
  const blob = new Blob([certificateSvg(name, pack)], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${pack}-certificate.svg`.replace(/\s+/g, "-").toLowerCase();
  link.click();
  URL.revokeObjectURL(url);
}

function printCertificate(name: string, pack: string) {
  const popup = window.open("", "_blank", "noopener,noreferrer");
  if (!popup) return;
  popup.document.write(`<!doctype html><html><head><title>Certificate</title></head><body style="margin:0">${certificateSvg(name, pack)}</body></html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}
