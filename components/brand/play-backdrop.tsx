import {
  GiBroadsword,
  GiCastle,
  GiCompass,
  GiCrown,
  GiDinosaurRex,
  GiKite,
  GiLightBulb,
  GiOpenBook,
  GiPencil,
  GiPirateHat,
  GiPuzzle,
  GiRobotGolem,
  GiRocketFlight,
  GiSailboat,
  GiSpyglass,
  GiStarMedal,
  GiTreasureMap,
  GiWizardStaff,
  type IconType,
} from "react-icons/gi";

const GREEN = "#306a51";
const GOLD = "#e8a428";

const ICONS: Array<{ Icon: IconType; size: number; angle: number; color: string }> = [
  { Icon: GiPirateHat, size: 86, angle: -18, color: GOLD },
  { Icon: GiBroadsword, size: 44, angle: 24, color: GREEN },
  { Icon: GiRobotGolem, size: 68, angle: 0, color: GREEN },
  { Icon: GiRocketFlight, size: 40, angle: 16, color: GOLD },
  { Icon: GiStarMedal, size: 54, angle: -8, color: GOLD },
  { Icon: GiSailboat, size: 78, angle: 12, color: GREEN },
  { Icon: GiCompass, size: 42, angle: -26, color: GOLD },
  { Icon: GiCastle, size: 62, angle: 0, color: GREEN },
  { Icon: GiSpyglass, size: 36, angle: 20, color: GREEN },
  { Icon: GiPuzzle, size: 72, angle: -14, color: GOLD },
  { Icon: GiOpenBook, size: 48, angle: 8, color: GREEN },
  { Icon: GiCrown, size: 82, angle: -6, color: GOLD },
  { Icon: GiWizardStaff, size: 40, angle: 28, color: GREEN },
  { Icon: GiDinosaurRex, size: 64, angle: -22, color: GOLD },
  { Icon: GiKite, size: 50, angle: 18, color: GREEN },
  { Icon: GiTreasureMap, size: 34, angle: -12, color: GOLD },
  { Icon: GiLightBulb, size: 74, angle: 0, color: GOLD },
  { Icon: GiPencil, size: 46, angle: -16, color: GREEN },
];

export function PlayBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 grid grid-cols-3 grid-rows-6 sm:grid-cols-6 sm:grid-rows-3" aria-hidden="true">
      {ICONS.map(({ Icon, size, angle, color }, index) => (
        <div key={index} className="flex items-center justify-center">
          <Icon
            color={color}
            aria-hidden="true"
            style={{ width: size, height: size, maxWidth: "46%", maxHeight: "46%", opacity: 0.22, transform: `rotate(${angle}deg)` }}
          />
        </div>
      ))}
    </div>
  );
}
