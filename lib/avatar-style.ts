export const AVATAR_COLOURS = [
  { id: "leaf", label: "Leaf", hex: "#8fce78" },
  { id: "indigo", label: "Indigo", hex: "#6d5bd0" },
  { id: "pink", label: "Pink", hex: "#f09ac4" },
  { id: "sand", label: "Sand", hex: "#efd0a8" },
  { id: "teal", label: "Teal", hex: "#1a9a84" },
  { id: "violet", label: "Violet", hex: "#a35d9a" },
] as const;

export const AVATAR_FACES = ["smile", "beam", "curious", "calm", "wink", "freckles"] as const;

export const HAIR_STYLES = ["short", "medium", "long"] as const;
export const HAIR_COLOURS = [
  { id: "blonde", label: "Blonde", hex: "#e6c36a" },
  { id: "black", label: "Black", hex: "#1c1c1c" },
  { id: "brown", label: "Brown", hex: "#6b4423" },
  { id: "red", label: "Red", hex: "#c4482d" },
  { id: "ginger", label: "Ginger", hex: "#ff7a22" },
  { id: "blue", label: "Blue", hex: "#3d6fbf" },
  { id: "purple", label: "Purple", hex: "#7b4ea3" },
  { id: "pink", label: "Pink", hex: "#e36aa2" },
] as const;
export const AVATAR_HATS = ["none", "cap", "beanie"] as const;

export type AvatarColourId = (typeof AVATAR_COLOURS)[number]["id"];
export type AvatarFaceId = (typeof AVATAR_FACES)[number];
export type HairStyleId = (typeof HAIR_STYLES)[number];
export type HairColourId = (typeof HAIR_COLOURS)[number]["id"];
export type AvatarHatId = (typeof AVATAR_HATS)[number];

export const SKIN_COLOURS = [
  { id: "light", label: "Light", hex: "#ffdbb4" },
  { id: "warm", label: "Warm", hex: "#edb98a" },
  { id: "tan", label: "Tan", hex: "#d08b5b" },
  { id: "brown", label: "Brown", hex: "#ae5d29" },
  { id: "deep", label: "Deep", hex: "#614335" },
] as const;

export const EYE_COLOURS = [
  { id: "brown", label: "Brown", hex: "#2c1b18" },
  { id: "green", label: "Green", hex: "#3d7a4a" },
  { id: "blue", label: "Blue", hex: "#3d6fbf" },
  { id: "grey", label: "Grey", hex: "#6d7278" },
] as const;

export const HAT_COLOURS = [
  { id: "black", label: "Black", hex: "#1c1c1c" },
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "green", label: "Green", hex: "#1e4d3a" },
  { id: "gold", label: "Gold", hex: "#f0b429" },
] as const;

export const ACCESSORY_COLOURS = [
  { id: "black", label: "Black", hex: "#1c1c1c" },
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "brown", label: "Brown", hex: "#6b4423" },
  { id: "gold", label: "Gold", hex: "#f0b429" },
] as const;

export const CLOTHES_COLOURS = [
  { id: "white", label: "White", hex: "#ffffff" },
  { id: "black", label: "Black", hex: "#1c1c1c" },
  { id: "red", label: "Red", hex: "#e23d3d" },
  { id: "blue", label: "Blue", hex: "#3d6fbf" },
  { id: "green", label: "Green", hex: "#1e4d3a" },
  { id: "yellow", label: "Yellow", hex: "#f0b429" },
] as const;

export const SHIRT_COLOURS = [
  { id: "cream", label: "Cream", hex: "#fff6ea" },
  { id: "leaf", label: "Leaf", hex: "#7dba6a" },
  { id: "sea", label: "Sea", hex: "#3d8ea8" },
  { id: "coral", label: "Coral", hex: "#e07a5f" },
  { id: "plum", label: "Plum", hex: "#7b6bb8" },
  { id: "gold", label: "Gold", hex: "#f0b429" },
] as const;

export function hairColourHex(id: string) {
  return HAIR_COLOURS.find((colour) => colour.id === id)?.hex ?? "#6b4423";
}

export function skinColourHex(id: string) {
  return SKIN_COLOURS.find((colour) => colour.id === id)?.hex ?? "#ffdbb4";
}

export function eyeColourHex(id: string) {
  return EYE_COLOURS.find((colour) => colour.id === id)?.hex ?? "#6b4423";
}

export function shirtColourHex(id: string) {
  return SHIRT_COLOURS.find((colour) => colour.id === id)?.hex ?? "#fff6ea";
}

export function avatarColourHex(id: string) {
  return AVATAR_COLOURS.find((colour) => colour.id === id)?.hex ?? "#8fce78";
}
