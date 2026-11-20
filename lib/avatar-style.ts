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

export function hairColourHex(id: string) {
  return HAIR_COLOURS.find((colour) => colour.id === id)?.hex ?? "#6b4423";
}

export function avatarColourHex(id: string) {
  return AVATAR_COLOURS.find((colour) => colour.id === id)?.hex ?? "#7dba6a";
}
