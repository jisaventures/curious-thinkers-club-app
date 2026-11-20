export const AVATAR_COLOURS = [
  { id: "leaf", label: "Leaf", hex: "#7dba6a" },
  { id: "bottle", label: "Bottle", hex: "#1e4d3a" },
  { id: "gold", label: "Gold", hex: "#f0b429" },
  { id: "coral", label: "Coral", hex: "#e07a5f" },
  { id: "sea", label: "Sea", hex: "#3d8ea8" },
  { id: "plum", label: "Plum", hex: "#7b6bb8" },
  { id: "sand", label: "Sand", hex: "#e6c89a" },
  { id: "sky", label: "Sky", hex: "#8ecae6" },
] as const;

export const AVATAR_FACES = ["smile", "beam", "curious", "calm", "wink", "freckles"] as const;

export const HAIR_STYLES = ["short", "medium", "long"] as const;
export const HAIR_COLOURS = [
  { id: "blonde", label: "Blonde", hex: "#e6c36a" },
  { id: "black", label: "Black", hex: "#1c1c1c" },
  { id: "brown", label: "Brown", hex: "#6b4423" },
  { id: "red", label: "Red", hex: "#c4482d" },
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
  { id: "peach", label: "Peach", hex: "#fd9841" },
  { id: "warm", label: "Warm", hex: "#edb98a" },
  { id: "golden", label: "Golden", hex: "#f8d25c" },
  { id: "tan", label: "Tan", hex: "#d08b5b" },
  { id: "brown", label: "Brown", hex: "#ae5d29" },
  { id: "deep", label: "Deep", hex: "#614335" },
] as const;

export const EYE_COLOURS = [
  { id: "brown", label: "Brown", hex: "#6b4423" },
  { id: "hazel", label: "Hazel", hex: "#8a7a3a" },
  { id: "green", label: "Green", hex: "#3d7a4a" },
  { id: "blue", label: "Blue", hex: "#3d6fbf" },
  { id: "grey", label: "Grey", hex: "#6d7278" },
  { id: "dark", label: "Dark", hex: "#2c1b18" },
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
  return AVATAR_COLOURS.find((colour) => colour.id === id)?.hex ?? "#7dba6a";
}
