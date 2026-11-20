import {
  GiBroadsword,
  GiCastle,
  GiCompass,
  GiCrown,
  GiDinosaurRex,
  GiButterfly,
  GiLightBulb,
  GiMagicHat,
  GiOpenBook,
  GiPencil,
  GiPirateHat,
  GiPuzzle,
  GiRobotGolem,
  GiRocket,
  GiSailboat,
  GiSpyglass,
  GiStarMedal,
  GiUnicorn,
  type IconType,
} from "react-icons/gi";

const GREEN = "#306a51";
const GOLD = "#e8a428";

const ICONS: Array<{ Icon: IconType; size: number; angle: number; color: string }> = [
  { Icon: GiPirateHat, size: 100, angle: -18, color: GOLD },
  { Icon: GiBroadsword, size: 54, angle: 24, color: GREEN },
  { Icon: GiRobotGolem, size: 80, angle: 0, color: GREEN },
  { Icon: GiRocket, size: 56, angle: 14, color: GOLD },
  { Icon: GiStarMedal, size: 64, angle: -8, color: GOLD },
  { Icon: GiSailboat, size: 92, angle: 12, color: GREEN },
  { Icon: GiCompass, size: 52, angle: -26, color: GOLD },
  { Icon: GiCastle, size: 74, angle: 0, color: GREEN },
  { Icon: GiSpyglass, size: 46, angle: 20, color: GREEN },
  { Icon: GiPuzzle, size: 84, angle: -14, color: GOLD },
  { Icon: GiOpenBook, size: 58, angle: 8, color: GREEN },
  { Icon: GiCrown, size: 96, angle: -6, color: GOLD },
  { Icon: GiMagicHat, size: 56, angle: 18, color: GREEN },
  { Icon: GiDinosaurRex, size: 76, angle: -22, color: GOLD },
  { Icon: GiButterfly, size: 62, angle: 12, color: GREEN },
  { Icon: GiUnicorn, size: 58, angle: -10, color: GOLD },
  { Icon: GiLightBulb, size: 88, angle: 0, color: GOLD },
  { Icon: GiPencil, size: 56, angle: -16, color: GREEN },
];

export function PlayBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 grid grid-cols-3 grid-rows-6 sm:grid-cols-6 sm:grid-rows-3" aria-hidden="true">
      {ICONS.map(({ Icon, size, angle, color }, index) => (
        <div key={index} className="flex items-center justify-center">
          <Icon
            color={color}
            aria-hidden="true"
            style={{ width: size, height: size, maxWidth: "54%", maxHeight: "54%", opacity: 0.22, transform: `rotate(${angle}deg)` }}
          />
        </div>
      ))}
    </div>
  );
}
