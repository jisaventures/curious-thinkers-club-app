import type { CoverTone } from "@/lib/validators";

const tones: Record<CoverTone, string> = {
  bottle: "bg-[#1e4d3a]",
  palm: "bg-[#2c6a44]",
  navy: "bg-[#243e66]",
  plum: "bg-[#6b4c7a]",
  sea: "bg-[#2d6e88]",
};

export function BookCover({
  tone,
  title,
  locked = false,
  className = "h-[92px] w-[72px] sm:h-[104px] sm:w-[80px]",
}: {
  tone: CoverTone;
  title: string;
  locked?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-2xl ${tones[tone]} shadow-md ${className}`}>
      <span className="absolute inset-y-2 left-1.5 w-1 rounded-full bg-white/25" />
      <span className="absolute right-2 bottom-2 left-3 rounded-lg bg-[#fff7e8]/95 px-1.5 py-1 text-[10px] leading-tight font-extrabold text-[#1e4d3a]">
        {coverLabel(title)}
      </span>
      <span className="absolute top-3 right-2 text-lg" aria-hidden>
        {glyph(title)}
      </span>
      {locked && (
        <span className="absolute top-2 left-3 rounded-full bg-white/90 px-1.5 text-[10px]">🔒</span>
      )}
    </div>
  );
}

function coverLabel(title: string) {
  const value = title.toLowerCase();
  if (value.includes("pirate")) return "Pirates";
  if (value.includes("egypt")) return "Egypt";
  if (value.includes("spy")) return "Codes";
  if (value.includes("knight")) return "Knights";
  if (value.includes("space")) return "Space";
  return "Pack";
}

function glyph(title: string) {
  const value = title.toLowerCase();
  if (value.includes("pirate")) return "🏴‍☠️";
  if (value.includes("egypt")) return "🔺";
  if (value.includes("spy")) return "🕵️";
  if (value.includes("knight")) return "🛡️";
  if (value.includes("space")) return "🚀";
  return "✦";
}
