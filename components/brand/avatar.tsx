import { FamilyAvatar } from "@/components/brand/family-avatar";
import { boyAvatar, girlAvatar, type AvatarBuild } from "@/lib/avataaars-options";
import { eyeColourHex, hairColourHex, shirtColourHex, skinColourHex, avatarColourHex } from "@/lib/avatar-style";
import type { AvatarKey } from "@/lib/validators";

function legacyBuild(input: {
  colour?: string | null;
  face?: string | null;
  hairStyle?: string | null;
  hairColour?: string | null;
  glasses?: boolean | null;
  hat?: string | null;
  gender?: "boy" | "girl" | null;
  skin?: string | null;
  eyeColour?: string | null;
  shirt?: string | null;
  options?: string | null;
}): AvatarBuild | null {
  if (input.options) {
    try {
      return JSON.parse(input.options) as AvatarBuild;
    } catch {
      return null;
    }
  }
  if (!input.colour || !input.face) return null;
  const build = input.gender === "girl" ? girlAvatar() : boyAvatar();
  const length = input.hairStyle === "long" ? "long" : input.hairStyle === "medium" ? "medium" : "short";
  const girlTops = { short: "bob", medium: "straightAndStrand", long: "straight01" } as const;
  const boyTops = { short: "shortRound", medium: "shaggy", long: "shaggyMullet" } as const;
  const tops = input.gender === "girl" ? girlTops : boyTops;
  build.top = input.hat === "cap" || input.hat === "beanie" ? "winterHat03" : tops[length];
  build.background = avatarColourHex(input.colour).replace("#", "");
  build.hairColor = hairColourHex(input.hairColour ?? "brown").replace("#", "");
  build.skin = skinColourHex(input.skin ?? "light").replace("#", "");
  build.eyeColor = eyeColourHex(input.eyeColour ?? "brown").replace("#", "");
  build.clothesColor = shirtColourHex(input.shirt ?? "cream").replace("#", "");
  build.accessory = input.glasses ? "round" : "none";
  return build;
}

const backgrounds: Record<AvatarKey, string> = {
  pirate: "#e07a3d",
  captain: "#2f9d9a",
  magpie: "#7b6bb8",
  star: "#f0b429",
  dino: "#6aaa45",
  astronaut: "#3c6f9c",
  knight: "#8d6b3e",
  explorer: "#d06a45",
  fox: "#e07a3d",
  owl: "#6d5646",
};

export function Avatar({
  avatar,
  colour,
  face,
  hairStyle,
  hairColour,
  glasses,
  hat,
  gender,
  skin,
  eyeColour,
  shirt,
  options,
  className = "size-11",
  title,
}: {
  avatar: AvatarKey;
  colour?: string | null;
  face?: string | null;
  hairStyle?: string | null;
  hairColour?: string | null;
  glasses?: boolean | null;
  hat?: string | null;
  gender?: "boy" | "girl" | null;
  skin?: string | null;
  eyeColour?: string | null;
  shirt?: string | null;
  options?: string | null;
  className?: string;
  title?: string;
}) {
  const build = legacyBuild({ colour, face, hairStyle, hairColour, glasses, hat, gender, skin, eyeColour, shirt, options });
  if (build) {
    return <FamilyAvatar build={build} className={className} title={title} />;
  }
  return (
    <svg viewBox="0 0 64 64" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <circle cx="32" cy="32" r="32" fill={backgrounds[avatar]} />
      <circle cx="32" cy="36" r="16" fill="#ffe3c4" />
      {avatar === "pirate" && (
        <path d="M14 30c8-14 28-16 38-2-10-8-26-8-38 2z" fill="#b4232a" />
      )}
      {avatar === "captain" && (
        <>
          <path d="M16 28h32v6H16z" fill="#1e4d3a" />
          <path d="M20 28c4-10 20-10 24 0" fill="#1e4d3a" />
          <path d="M12 34h40v3H12z" fill="#f0b429" />
        </>
      )}
      {avatar === "magpie" && (
        <path d="M18 28c6-12 22-12 28 0-4 6-24 6-28 0z" fill="#1c1c1c" />
      )}
      {avatar === "star" && <path d="M32 12l3 8h8l-6.5 5 2.5 8L32 28l-7 5 2.5-8L21 20h8z" fill="#fff7d6" />}
      {avatar === "dino" && (
        <>
          <path d="M22 20l4 8 6-8 6 8 4-8v10H22z" fill="#245c20" />
          <circle cx="32" cy="36" r="16" fill="#d7efb0" />
        </>
      )}
      {avatar === "astronaut" && (
        <circle cx="32" cy="36" r="18" fill="none" stroke="#f7f7f7" strokeWidth="4" />
      )}
      {avatar === "knight" && <path d="M18 34c2-14 26-14 28 0v8H18z" fill="#d9dde3" />}
      {avatar === "explorer" && <path d="M14 32c6-12 30-12 36 0l-4 4H18z" fill="#f0d7a2" />}
      {avatar === "fox" && (
        <>
          <path d="M16 26l10 10 6-12 6 12 10-10-8 16H24z" fill="#c4551a" />
          <circle cx="32" cy="38" r="14" fill="#ffd0a4" />
        </>
      )}
      {avatar === "owl" && (
        <>
          <circle cx="26" cy="36" r="6" fill="#fff8ea" />
          <circle cx="38" cy="36" r="6" fill="#fff8ea" />
          <circle cx="26" cy="36" r="2" fill="#173528" />
          <circle cx="38" cy="36" r="2" fill="#173528" />
        </>
      )}
      {avatar !== "owl" && avatar !== "dino" && (
        <>
          <circle cx="26" cy="36" r="1.8" fill="#173528" />
          <circle cx="38" cy="36" r="1.8" fill="#173528" />
          <path d="M27 43c2 2.2 8 2.2 10 0" fill="none" stroke="#173528" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {avatar === "dino" && (
        <>
          <circle cx="26" cy="36" r="1.8" fill="#173528" />
          <circle cx="38" cy="36" r="1.8" fill="#173528" />
          <path d="M28 43h8" stroke="#173528" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
