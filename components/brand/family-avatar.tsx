import { createAvatar } from "@dicebear/core";
import { avataaars } from "@dicebear/collection";
import type { AvatarBuild } from "@/lib/avataaars-options";

function paintEyes(svg: string, eye: string) {
  return svg.replace(/(<g transform="translate\(76 90\)">)([\s\S]*?)(<\/g>)/, (_match, open, inner, close) => {
    return `${open}${String(inner).replaceAll('fill="#000"', `fill="#${eye}"`)}${close}`;
  });
}

export function FamilyAvatar({
  build,
  className = "h-24 w-16",
  title,
}: {
  build: AvatarBuild;
  className?: string;
  title?: string;
}) {
  let svg = createAvatar(avataaars, {
    style: ["default"],
    top: [build.top],
    hairColor: [build.hairColor.replace("#", "")],
    hatColor: [build.hatColor.replace("#", "")],
    facialHair: build.facialHair === "none" ? ["beardLight"] : [build.facialHair],
    facialHairProbability: build.facialHair === "none" ? 0 : 100,
    facialHairColor: [build.facialHairColor.replace("#", "")],
    accessories: build.accessory === "none" ? ["round"] : [build.accessory],
    accessoriesProbability: build.accessory === "none" ? 0 : 100,
    accessoriesColor: [build.accessoryColor.replace("#", "")],
    clothing: [build.clothing],
    clothesColor: [build.clothesColor.replace("#", "")],
    clothingGraphic: [build.clothingGraphic],
    skinColor: [build.skin.replace("#", "")],
    mouth: [build.mouth],
    eyes: [build.eyes],
    eyebrows: [build.eyebrows],
    backgroundColor: [build.background.replace("#", "")],
    backgroundType: ["solid"],
    randomizeIds: true,
  }).toString();
  svg = svg.replace("<svg ", '<svg width="100%" height="100%" ');
  svg = paintEyes(svg, build.eyeColor.replace("#", ""));
  if (build.top === "hat" || build.top.startsWith("winterHat")) {
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
