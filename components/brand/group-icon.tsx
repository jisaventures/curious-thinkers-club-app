import type { IconType } from "react-icons";
import {
  GiBroadsword,
  GiButterfly,
  GiCastle,
  GiCompass,
  GiCrown,
  GiDinosaurRex,
  GiHearts,
  GiLightBulb,
  GiMagicHat,
  GiMoon,
  GiOpenBook,
  GiPencil,
  GiPirateHat,
  GiPuzzle,
  GiRobotGolem,
  GiRocket,
  GiSailboat,
  GiSpyglass,
  GiStarMedal,
  GiSun,
  GiThreeLeaves,
  GiUnicorn,
} from "react-icons/gi";

const ICONS = [
  "star",
  "moon",
  "rocket",
  "crown",
  "sun",
  "heart",
  "book",
  "leaf",
  "sword",
  "robot",
  "castle",
  "compass",
  "boat",
  "spyglass",
  "puzzle",
  "pirate",
  "wizard",
  "dinosaur",
  "butterfly",
  "unicorn",
  "bulb",
  "pencil",
] as const;

const GLYPHS: Record<(typeof ICONS)[number], IconType> = {
  star: GiStarMedal,
  moon: GiMoon,
  rocket: GiRocket,
  crown: GiCrown,
  sun: GiSun,
  heart: GiHearts,
  book: GiOpenBook,
  leaf: GiThreeLeaves,
  sword: GiBroadsword,
  robot: GiRobotGolem,
  castle: GiCastle,
  compass: GiCompass,
  boat: GiSailboat,
  spyglass: GiSpyglass,
  puzzle: GiPuzzle,
  pirate: GiPirateHat,
  wizard: GiMagicHat,
  dinosaur: GiDinosaurRex,
  butterfly: GiButterfly,
  unicorn: GiUnicorn,
  bulb: GiLightBulb,
  pencil: GiPencil,
};

export type GroupIconId = (typeof ICONS)[number];

export const GROUP_ICONS = ICONS;

export function GroupIcon({
  icon,
  background,
  colour,
  className = "",
  title,
}: {
  icon: GroupIconId;
  background: string;
  colour: string;
  className?: string;
  title?: string;
}) {
  const fill = colour.startsWith("#") ? colour : `#${colour}`;
  const wash = background.startsWith("#") ? background : `#${background}`;
  const Glyph = GLYPHS[icon];
  return (
    <span className={`flex items-center justify-center ${className}`} style={{ background: wash }} title={title} aria-hidden={title ? undefined : true}>
      <Glyph color={fill} aria-hidden="true" className="h-[62%] w-[62%]" />
    </span>
  );
}
