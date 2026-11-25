import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PromoBannerContent } from "@/lib/club/promo";

const dots = [
  { top: "12%", left: "8%", size: 8, color: "#F08AB0" },
  { top: "22%", left: "28%", size: 6, color: "#fffaf2" },
  { top: "70%", left: "18%", size: 10, color: "#E8A428" },
  { top: "18%", right: "22%", size: 7, color: "#50B0DC" },
  { top: "62%", right: "30%", size: 5, color: "#9BD0A8" },
  { top: "40%", left: "46%", size: 6, color: "#F08AB0" },
  { top: "78%", right: "16%", size: 8, color: "#fffaf2" },
  { top: "8%", right: "40%", size: 5, color: "#E8A428" },
];

const sparks = [
  { top: "16%", left: "38%" },
  { top: "30%", right: "18%" },
  { top: "58%", left: "24%" },
];

export function PromoBanner({ banner }: { banner: PromoBannerContent }) {
  return (
    <section className="promo-banner" style={{ background: banner.background, color: banner.textColour }}>
      <div className="promo-banner__rays" aria-hidden="true" />
      <div aria-hidden="true">
        {dots.map((dot) => (
          <span
            key={`${dot.top}-${dot.left ?? dot.right}`}
            className="promo-banner__dot"
            style={{ top: dot.top, left: dot.left, right: dot.right, width: dot.size, height: dot.size, background: dot.color }}
          />
        ))}
        {sparks.map((spark) => (
          <span key={`${spark.top}-${spark.left ?? spark.right}`} className="promo-banner__spark" style={spark} />
        ))}
      </div>
      <div className="relative z-[1] grid items-center gap-4 p-4 sm:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] sm:p-5">
        <img
          src={banner.imageUrl}
          alt="Official Club kit products"
          className="block h-auto w-full rounded-2xl"
        />
        <div className="min-w-0 max-sm:pb-14 sm:pr-16">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-[#E8A428] px-3 py-1 font-display text-xs font-semibold tracking-wide text-[#17352A]">
            <Star className="size-3.5 fill-current" aria-hidden="true" />
            {banner.badgeText}
          </p>
          <h2 className="mt-3 font-display text-[1.35rem] leading-tight whitespace-nowrap sm:text-[1.55rem]">{banner.headline.replace(/\n|<br\s*\/?>/gi, " ")}</h2>
          <p className="mt-2 max-w-md text-sm leading-snug sm:text-base" style={{ color: banner.textColour }}>
            {banner.subtext}
          </p>
          <Button asChild variant="mustard" size="md" className="mt-4 max-sm:w-full">
            <a href={banner.buttonLink}>{banner.buttonLabel}</a>
          </Button>
        </div>
      </div>
      <img src="/brand/mascot-spy.png" alt="" aria-hidden="true" className="promo-banner__mascot" />
    </section>
  );
}
