import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import { avatarColourHex, hairColourHex, type AvatarFaceId } from "@/lib/avatar-style";

const faces: Record<AvatarFaceId, { mouth: "smile" | "twinkle" | "default" | "serious"; eyes: "default" | "happy" | "surprised" | "wink"; eyebrows: "defaultNatural" | "raisedExcitedNatural" | "raisedExcited" | "flatNatural" }> = {
  smile: { mouth: "smile", eyes: "default", eyebrows: "defaultNatural" },
  beam: { mouth: "twinkle", eyes: "happy", eyebrows: "raisedExcitedNatural" },
  curious: { mouth: "default", eyes: "surprised", eyebrows: "raisedExcited" },
  calm: { mouth: "serious", eyes: "default", eyebrows: "flatNatural" },
  wink: { mouth: "smile", eyes: "wink", eyebrows: "defaultNatural" },
  freckles: { mouth: "smile", eyes: "happy", eyebrows: "defaultNatural" },
};

const hairTops = {
  short: "shortFlat",
  medium: "shaggy",
  long: "straight01",
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
  className = "h-24 w-16",
  title,
}: {
  colour: string;
  face: string;
  hairStyle?: string;
  hairColour?: string;
  glasses?: boolean;
  hat?: string;
  className?: string;
  title?: string;
}) {
  const look = (face in faces ? face : "smile") as AvatarFaceId;
  const length = hairStyle === "long" || hairStyle === "medium" ? hairStyle : "short";
  const top = hat === "cap" ? "hat" : hat === "beanie" ? "winterHat1" : hairTops[length];
  const expression = faces[look];
  let svg = createAvatar(avataaars, {
    style: ["default"],
    top: [top],
    hairColor: [hex(hairColour, hairColourHex(hairColour))],
    hatColor: ["1e4d3a"],
    facialHairProbability: 0,
    accessories: ["round"],
    accessoriesProbability: glasses ? 100 : 0,
    accessoriesColor: ["262e33"],
    clothing: ["shirtCrewNeck"],
    clothesColor: ["fff6ea"],
    skinColor: ["ffdbb4"],
    mouth: [expression.mouth],
    eyes: [expression.eyes],
    eyebrows: [expression.eyebrows],
    backgroundColor: [hex(colour, avatarColourHex(colour))],
    backgroundType: ["solid"],
    randomizeIds: true,
  }).toString();
  svg = svg.replace("<svg ", '<svg width="100%" height="100%" ');
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
