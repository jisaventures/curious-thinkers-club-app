import { GiIcon } from "@/components/brand/gi-icon";
import type { GiName } from "@/components/brand/gi-data";

const GREEN = "#306a51";
const GOLD = "#e8a428";

const ICONS: Array<{ name: GiName; size: number; angle: number; color: string }> = [
  { name: "GiPirateHat", size: 100, angle: -18, color: GOLD },
  { name: "GiBroadsword", size: 54, angle: 24, color: GREEN },
  { name: "GiRobotGolem", size: 80, angle: 0, color: GREEN },
  { name: "GiRocket", size: 56, angle: 14, color: GOLD },
  { name: "GiStarMedal", size: 64, angle: -8, color: GOLD },
  { name: "GiSailboat", size: 92, angle: 12, color: GREEN },
  { name: "GiCompass", size: 52, angle: -26, color: GOLD },
  { name: "GiCastle", size: 74, angle: 0, color: GREEN },
  { name: "GiSpyglass", size: 46, angle: 20, color: GREEN },
  { name: "GiPuzzle", size: 84, angle: -14, color: GOLD },
  { name: "GiOpenBook", size: 58, angle: 8, color: GREEN },
  { name: "GiCrown", size: 96, angle: -6, color: GOLD },
  { name: "GiMagicHat", size: 56, angle: 18, color: GREEN },
  { name: "GiDinosaurRex", size: 76, angle: -22, color: GOLD },
  { name: "GiButterfly", size: 62, angle: 12, color: GREEN },
  { name: "GiUnicorn", size: 58, angle: -10, color: GOLD },
  { name: "GiLightBulb", size: 88, angle: 0, color: GOLD },
  { name: "GiPencil", size: 56, angle: -16, color: GREEN },
];

export function PlayBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 grid grid-cols-3 grid-rows-6 sm:grid-cols-6 sm:grid-rows-3" aria-hidden="true">
      {ICONS.map(({ name, size, angle, color }, index) => (
        <div key={index} className="flex items-center justify-center">
          <GiIcon
            name={name}
            color={color}
            style={{ width: size, height: size, maxWidth: "54%", maxHeight: "54%", opacity: 0.22, transform: `rotate(${angle}deg)` }}
          />
        </div>
      ))}
    </div>
  );
}
