export function optionLabel(id: string) {
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
  "sides",
  "theCaesar",
  "theCaesarAndSidePart",
  "bigHair",
  "hat",
  "hijab",
  "turban",
  "winterHat1",
  "winterHat02",
  "winterHat03",
  "winterHat04",
] as const;

export const AVATAAARS_EYES = [
  "closed",
  "cry",
  "default",
  "eyeRoll",
  "happy",
  "hearts",
  "side",
  "squint",
  "surprised",
  "winkWacky",
  "wink",
  "xDizzy",
] as const;

export const AVATAAARS_EYEBROWS = [
  "angryNatural",
  "defaultNatural",
  "flatNatural",
  "frownNatural",
  "raisedExcitedNatural",
  "sadConcernedNatural",
  "unibrowNatural",
  "upDownNatural",
  "angry",
  "default",
  "raisedExcited",
  "sadConcerned",
  "upDown",
] as const;

export const AVATAAARS_MOUTHS = [
  "concerned",
  "default",
  "disbelief",
  "eating",
  "grimace",
  "sad",
  "screamOpen",
  "serious",
  "smile",
  "tongue",
  "twinkle",
  "vomit",
] as const;

export const AVATAAARS_FACIAL_HAIR = ["none", "beardLight", "beardMajestic", "beardMedium", "moustacheFancy", "moustacheMagnum"] as const;

export const AVATAAARS_ACCESSORIES = ["none", "kurt", "prescription01", "prescription02", "round", "sunglasses", "wayfarers", "eyepatch"] as const;

export const AVATAAARS_CLOTHES = [
  "blazerAndShirt",
  "blazerAndSweater",
  "collarAndSweater",
  "graphicShirt",
  "hoodie",
  "overall",
  "shirtCrewNeck",
  "shirtScoopNeck",
  "shirtVNeck",
] as const;

export const AVATAAARS_GRAPHICS = ["bat", "bear", "cumbia", "deer", "diamond", "hola", "pizza", "resist", "skull", "skullOutline"] as const;

export const AVATAAARS_PALETTE = [
  "2c1b18",
  "4a312c",
  "724133",
  "a55728",
  "b58143",
  "c93305",
  "d6b370",
  "e6c36a",
  "ecdcbf",
  "e8e1e1",
  "f59797",
  "262e33",
  "3c4f5c",
  "25557c",
  "5199e4",
  "65c9ff",
  "b1e2ff",
  "929598",
  "e6e6e6",
  "ffffff",
  "a7ffc4",
  "ffdeb5",
  "ffafb9",
  "ffffb1",
  "ff488e",
  "ff5c5c",
  "1e4d3a",
  "7dba6a",
  "3d6fbf",
  "7b4ea3",
  "e36aa2",
  "1c1c1c",
] as const;

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
    eyes: "default",
    eyeColor: "6b4423",
    eyebrows: "defaultNatural",
    mouth: "smile",
    facialHair: "none",
    facialHairColor: "a55728",
    accessory: "none",
    accessoryColor: "262e33",
    clothing: "hoodie",
    clothesColor: "fff6ea",
    clothingGraphic: "bear",
    background: "7dba6a",
  };
}

export function girlAvatar(): AvatarBuild {
  return {
    ...boyAvatar(),
    top: "bob",
    eyes: "happy",
    eyebrows: "default",
    clothing: "shirtScoopNeck",
  };
}
