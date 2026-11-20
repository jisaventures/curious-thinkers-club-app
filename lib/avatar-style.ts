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

export type AvatarColourId = (typeof AVATAR_COLOURS)[number]["id"];
export type AvatarFaceId = (typeof AVATAR_FACES)[number];

export function avatarColourHex(id: string) {
  return AVATAR_COLOURS.find((colour) => colour.id === id)?.hex ?? "#7dba6a";
}
