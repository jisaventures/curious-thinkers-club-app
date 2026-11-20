const OPTION_LABELS: Record<string, string> = {
  prescription01: "Square",
  eyepatch: "Eye patch",
  dreads: "Locs",
  dreads01: "Spiked",
  shortCurly: "Short",
  theCaesar: "Buzz",
  longButNotTooLong: "Long",
  frida: "Flowers",
  straight01: "Straight",
};

export function optionLabel(id: string) {
  if (OPTION_LABELS[id]) return OPTION_LABELS[id];
  const spaced = id
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([a-zA-Z])(\d+)/g, "$1 $2")
    .replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

export const AVATAAARS_TOPS = [
  "bob",
  "bun",
  "curly",
  "curvy",
  "dreads",
  "frida",
  "fro",
  "froBand",
  "longButNotTooLong",
  "miaWallace",
  "shavedSides",
  "straight02",
  "straight01",
  "straightAndStrand",
  "dreads01",
  "dreads02",
  "frizzle",
  "shaggy",
  "shaggyMullet",
  "shortCurly",
  "shortFlat",
  "shortRound",
  "shortWaved",
  "theCaesar",
  "theCaesarAndSidePart",
  "hijab",
  "turban",
  "winterHat03",
  "winterHat04",
] as const;

export const BOY_HAIR = [
  "bun",
  "curly",
  "dreads",
  "dreads01",
  "fro",
  "shaggy",
  "shortCurly",
  "shortFlat",
  "shortRound",
  "shortWaved",
  "theCaesar",
  "longButNotTooLong",
] as const satisfies readonly (typeof AVATAAARS_TOPS)[number][];

export const GIRL_HAIR = [
  "bob",
  "bun",
  "curly",
  "curvy",
  "dreads",
  "fro",
  "froBand",
  "hijab",
  "frida",
  "longButNotTooLong",
  "straight01",
] as const satisfies readonly (typeof AVATAAARS_TOPS)[number][];

export const AVATAAARS_EYES = ["default", "happy", "side", "wink"] as const;

export const AVATAAARS_EYEBROWS = ["defaultNatural"] as const;

export const AVATAAARS_MOUTHS = ["default", "smile", "tongue"] as const;

export const AVATAAARS_FACIAL_HAIR = ["none"] as const;

export const AVATAAARS_ACCESSORIES = ["none", "prescription01", "round", "eyepatch"] as const;

export const AVATAAARS_CLOTHES = ["shirtCrewNeck", "shirtVNeck"] as const;

export const AVATAAARS_GRAPHICS = ["bat", "bear", "cumbia", "deer", "diamond", "hola", "pizza", "resist", "skull", "skullOutline"] as const;

export type AvatarBuild = {
  top: (typeof AVATAAARS_TOPS)[number];
  hairColor: string;
  hatColor: string;
  skin: string;
  eyes: (typeof AVATAAARS_EYES)[number];
  eyeColor: string;
  eyebrows: (typeof AVATAAARS_EYEBROWS)[number];
  mouth: (typeof AVATAAARS_MOUTHS)[number];
  facialHair: (typeof AVATAAARS_FACIAL_HAIR)[number];
  facialHairColor: string;
  accessory: (typeof AVATAAARS_ACCESSORIES)[number];
  accessoryColor: string;
  clothing: (typeof AVATAAARS_CLOTHES)[number];
  clothesColor: string;
  clothingGraphic: (typeof AVATAAARS_GRAPHICS)[number];
  background: string;
};

export function boyAvatar(): AvatarBuild {
  return {
    top: "shortRound",
    hairColor: "6b4423",
    hatColor: "1e4d3a",
    skin: "ffdbb4",
    eyes: "happy",
    eyeColor: "2c1b18",
    eyebrows: "defaultNatural",
    mouth: "smile",
    facialHair: "none",
    facialHairColor: "6b4423",
    accessory: "none",
    accessoryColor: "1c1c1c",
    clothing: "shirtCrewNeck",
    clothesColor: "ffffff",
    clothingGraphic: "bear",
    background: "8fce78",
  };
}

export function girlAvatar(): AvatarBuild {
  return {
    ...boyAvatar(),
    top: "bob",
    clothing: "shirtVNeck",
  };
}
