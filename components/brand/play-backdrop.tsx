import {
  BookOpen,
  Bot,
  Castle,
  Compass,
  Crown,
  Fish,
  Flag,
  Gem,
  Lightbulb,
  PawPrint,
  Puzzle,
  Rainbow,
  Rocket,
  Ship,
  Star,
  Sword,
  Telescope,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

const ICONS: Array<{ Icon: LucideIcon; size: number }> = [
  { Icon: Crown, size: 84 },
  { Icon: Sword, size: 42 },
  { Icon: Bot, size: 64 },
  { Icon: Rocket, size: 36 },
  { Icon: Star, size: 52 },
  { Icon: Ship, size: 76 },
  { Icon: Compass, size: 40 },
  { Icon: Castle, size: 58 },
  { Icon: Telescope, size: 34 },
  { Icon: Puzzle, size: 70 },
  { Icon: BookOpen, size: 46 },
  { Icon: Flag, size: 80 },
  { Icon: WandSparkles, size: 38 },
  { Icon: Fish, size: 60 },
  { Icon: Rainbow, size: 48 },
  { Icon: Gem, size: 32 },
  { Icon: Lightbulb, size: 72 },
  { Icon: PawPrint, size: 44 },
];

export function PlayBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 grid grid-cols-3 grid-rows-6 sm:grid-cols-6 sm:grid-rows-3" aria-hidden="true">
      {ICONS.map(({ Icon, size }, index) => (
        <div key={index} className="flex items-center justify-center">
          <Icon
            strokeWidth={1.75}
            className="text-white/70"
            style={{ width: size, height: size, maxWidth: "46%", maxHeight: "46%" }}
          />
        </div>
      ))}
    </div>
  );
}
