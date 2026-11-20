import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { avatarColourHex, eyeColourHex, hairColourHex, shirtColourHex, skinColourHex, type AvatarFaceId } from "@/lib/avatar-style";

type Look = {
  mouth: "smile" | "twinkle" | "default" | "serious";
  eyes: "default" | "happy" | "surprised" | "wink";
  eyebrows: "defaultNatural" | "raisedExcitedNatural" | "raisedExcited" | "flatNatural" | "default";
};

const boyFaces: Record<AvatarFaceId, Look> = {
  smile: { mouth: "smile", eyes: "default", eyebrows: "defaultNatural" },
  beam: { mouth: "twinkle", eyes: "happy", eyebrows: "raisedExcitedNatural" },
  curious: { mouth: "default", eyes: "surprised", eyebrows: "raisedExcitedNatural" },
  calm: { mouth: "serious", eyes: "default", eyebrows: "flatNatural" },
  wink: { mouth: "smile", eyes: "wink", eyebrows: "defaultNatural" },
  freckles: { mouth: "smile", eyes: "happy", eyebrows: "defaultNatural" },
};

const girlFaces: Record<AvatarFaceId, Look> = {
  smile: { mouth: "smile", eyes: "happy", eyebrows: "default" },
  beam: { mouth: "twinkle", eyes: "happy", eyebrows: "raisedExcited" },
  curious: { mouth: "default", eyes: "surprised", eyebrows: "raisedExcited" },
  calm: { mouth: "serious", eyes: "happy", eyebrows: "default" },
  wink: { mouth: "twinkle", eyes: "wink", eyebrows: "default" },
  freckles: { mouth: "smile", eyes: "happy", eyebrows: "raisedExcited" },
};

const hairTops = {
  boy: { short: "shortRound", medium: "shaggy", long: "shaggyMullet" },
  girl: { short: "bob", medium: "straightAndStrand", long: "straight01" },
} as const;

function hex(value: string, fallback: string) {
  const colour = value.startsWith("#") ? value : fallback;
  return colour.replace("#", "");
}

export function FamilyAvatar({
  colour,
  face,
  hairStyle = "short",
  hairColour = "brown",
  glasses = false,
  hat = "none",
  gender = "boy",
  skin = "light",
  eyeColour = "brown",
  shirt = "cream",
  className = "h-24 w-16",
  title,
}: {
  colour: string;
  face: string;
  hairStyle?: string;
  hairColour?: string;
  glasses?: boolean;
  hat?: string;
  gender?: "boy" | "girl";
  skin?: string;
  eyeColour?: string;
  shirt?: string;
  className?: string;
  title?: string;
}) {
  const look = (face in boyFaces ? face : "smile") as AvatarFaceId;
  const length = hairStyle === "long" || hairStyle === "medium" ? hairStyle : "short";
  const person = gender === "girl" ? "girl" : "boy";
  const top = hat === "cap" ? "hat" : hat === "beanie" ? "winterHat1" : hairTops[person][length];
  const expression = (person === "girl" ? girlFaces : boyFaces)[look];
  const eye = hex(eyeColour, eyeColourHex(eyeColour));
  let svg = createAvatar(avataaars, {
    style: ["default"],
    top: [top],
    hairColor: [hex(hairColour, hairColourHex(hairColour))],
    hatColor: ["1e4d3a"],
    facialHairProbability: 0,
    accessories: ["round"],
    accessoriesProbability: glasses ? 100 : 0,
    accessoriesColor: ["262e33"],
    clothing: [person === "girl" ? "shirtScoopNeck" : "hoodie"],
    clothesColor: [hex(shirt, shirtColourHex(shirt))],
    skinColor: [hex(skin, skinColourHex(skin))],
    mouth: [expression.mouth],
    eyes: [expression.eyes],
    eyebrows: [expression.eyebrows],
    backgroundColor: [hex(colour, avatarColourHex(colour))],
    backgroundType: ["solid"],
    randomizeIds: true,
  }).toString();
  svg = svg.replace("<svg ", '<svg width="100%" height="100%" ');
  svg = svg.replace(/(<g transform="translate\(76 90\)">)([\s\S]*?)(<\/g>)/, (_match, open, inner, close) => {
    return `${open}${inner.replaceAll('fill="#000"', `fill="#${eye}"`)}${close}`;
  });
  if (hat === "cap" || hat === "beanie") {
    svg = svg.replace(
      "</svg>",
      `<g transform="translate(118,46)"><circle cx="22" cy="16" r="12" fill="#f5d90a"/><rect x="16" y="26" width="12" height="6" rx="1.5" fill="#e6c36a"/></g></svg>`,
    );
  }
  return (
    <span
      className={`inline-block ${className}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
