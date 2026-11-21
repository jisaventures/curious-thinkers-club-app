const MEMBER_COLOURS = [
  { dot: "#e07a3d", wash: "#fde8d8", ink: "#8a3e12" },
  { dot: "#2f9d8f", wash: "#dff6f2", ink: "#0f5c52" },
  { dot: "#7b6bb8", wash: "#eee8fa", ink: "#3d2f78" },
  { dot: "#d4567a", wash: "#fde8ef", ink: "#8a2348" },
  { dot: "#3c6f9c", wash: "#e6f0f8", ink: "#1e3f66" },
] as const;

export function memberColour(index: number) {
  return MEMBER_COLOURS[index % MEMBER_COLOURS.length];
}

export function colourForChild(childId: string, children: Array<{ id: string }>) {
  const index = children.findIndex((child) => child.id === childId);
  return memberColour(index < 0 ? 0 : index);
}
