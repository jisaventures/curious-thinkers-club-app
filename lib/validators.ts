import { z } from "zod";

export const AVATARS = [
  "pirate",
  "captain",
  "magpie",
  "star",
  "dino",
  "astronaut",
  "knight",
  "explorer",
  "fox",
  "owl",
] as const;

export type AvatarKey = (typeof AVATARS)[number];

export const COVER_TONES = ["bottle", "palm", "navy", "plum", "sea"] as const;
export type CoverTone = (typeof COVER_TONES)[number];

export const emailSchema = z.string().trim().email().max(160);

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Add a first name")
  .max(40)
  .regex(/^[A-Za-z][A-Za-z '\-]{0,39}$/, "Use a first name, without a surname");

export const nicknameSchema = z
  .string()
  .trim()
  .min(1, "Add a nickname")
  .max(24)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9 '\-]{0,23}$/,
    "Use a nickname, not an email or a surname",
  )
  .refine((value) => value.split(/\s+/).length <= 3, "Keep the nickname short");

export const ageSchema = z.coerce.number().int().min(2).max(12);

export const avatarSchema = z.enum(AVATARS);

export const childInputSchema = z.object({
  nickname: nicknameSchema,
  ageYears: ageSchema,
  avatarKey: avatarSchema,
});

export const uuidSchema = z.uuid();

const httpUrl = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (value.startsWith("/videos/")) return true;
    if (value.startsWith("storage://pack-videos/")) {
      return /^storage:\/\/pack-videos\/[0-9a-f-]{36}\/[A-Za-z0-9._-]+$/i.test(value);
    }
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  }, "Use a YouTube, Vimeo or private storage link");

export const videoUrlSchema = httpUrl;

export const packSchema = z
  .object({
    title: z.string().trim().min(2).max(80),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a short lowercase slug"),
    theme: z.string().trim().min(2).max(40),
    ageMin: z.coerce.number().int().min(2).max(12),
    ageMax: z.coerce.number().int().min(2).max(14),
    durationMinutes: z.coerce.number().int().min(15).max(300),
    durationLabel: z.string().trim().min(2).max(40),
    blurb: z.string().trim().min(2).max(180),
    coverTone: z.enum(COVER_TONES),
    shopifyProductId: z.string().trim().max(80).optional().or(z.literal("")),
    pricePence: z.number().int().min(0).max(99999),
    certificateBonusPoints: z.coerce.number().int().min(0).max(200),
    published: z.boolean(),
  })
  .refine((pack) => pack.ageMin <= pack.ageMax, "The age range is backwards");

export const stepSchema = z.object({
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().min(2).max(400),
  videoUrl: videoUrlSchema.optional().or(z.literal("")),
  printableRef: z.string().trim().max(160).optional().or(z.literal("")),
  estimatedMinutes: z.coerce.number().int().min(1).max(120),
  points: z.coerce.number().int().min(1).max(50),
});

export const rewardSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{4,24}$/, "Use 4–24 letters or numbers"),
  headline: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(240),
  minPoints: z.coerce.number().int().min(0).max(99999),
  active: z.boolean(),
});

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function detectVideoProvider(url: string) {
  if (!url) return "mp4" as const;
  if (url.startsWith("storage://pack-videos/")) return "storage" as const;
  if (/youtu\.?be/.test(url)) return "youtube" as const;
  if (/vimeo\.com/.test(url)) return "vimeo" as const;
  return "mp4" as const;
}

export function youtubeId(url: string) {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/,
  );
  return match?.[1] ?? null;
}

export function vimeoId(url: string) {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] ?? null;
}
