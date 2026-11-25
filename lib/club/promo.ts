export type PromoBannerContent = {
  imageUrl: string;
  badgeText: string;
  headline: string;
  subtext: string;
  buttonLabel: string;
  buttonLink: string;
  background: string;
  textColour: string;
};

export type PromoBannerRecord = PromoBannerContent & {
  visible: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

export const defaultPromo: PromoBannerRecord = {
  imageUrl: "/brand/merch-banner-v2.png",
  badgeText: "Club Merch",
  headline: "Get the official\nclub kit!",
  subtext: "Show you're a Curious Thinker. Free drawstring bag with every bundle.",
  buttonLabel: "Shop Now",
  buttonLink: "https://curiousthinkersclub.org",
  background: "linear-gradient(115deg, #12352a 0%, #1b4d3c 46%, #2a6a52 100%)",
  textColour: "#fffaf2",
  visible: true,
  startsAt: null,
  endsAt: null,
};

export function bannerFromRow(row: {
  image_url?: string;
  badge_text?: string;
  headline?: string;
  subtext?: string;
  button_label?: string;
  button_link?: string;
  background?: string;
  text_colour?: string;
  visible?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
} | null): PromoBannerRecord | null {
  if (!row?.headline || !row.image_url) return null;
  return {
    imageUrl: row.image_url,
    badgeText: row.badge_text || "Club Merch",
    headline: row.headline,
    subtext: row.subtext || "",
    buttonLabel: row.button_label || "Shop Now",
    buttonLink: row.button_link || "/",
    background: row.background || defaultPromo.background,
    textColour: row.text_colour || defaultPromo.textColour,
    visible: row.visible !== false,
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
  };
}

export function activePromo(record: PromoBannerRecord | null, now = Date.now()): PromoBannerContent | null {
  if (!record?.visible) return null;
  if (record.startsAt && Date.parse(record.startsAt) > now) return null;
  if (record.endsAt && Date.parse(record.endsAt) < now) return null;
  return {
    imageUrl: record.imageUrl,
    badgeText: record.badgeText,
    headline: record.headline,
    subtext: record.subtext,
    buttonLabel: record.buttonLabel,
    buttonLink: record.buttonLink,
    background: record.background,
    textColour: record.textColour,
  };
}

export function safePromoBackground(value: string) {
  const colour = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(colour)) return colour;
  if (/^linear-gradient\([#0-9a-zA-Z%.,\s()-]+\)$/.test(colour)) return colour;
  return null;
}

export function safePromoLink(value: string) {
  const link = value.trim();
  if (link.startsWith("/") && !link.startsWith("//")) return link;
  try {
    const url = new URL(link);
    if (url.protocol === "https:" || url.protocol === "http:") return url.toString();
  } catch {
    return null;
  }
  return null;
}
