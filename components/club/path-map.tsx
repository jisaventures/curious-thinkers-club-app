import { Avatar } from "@/components/brand/avatar";
import { shortName } from "@/lib/format";
import type { PackChildView } from "@/lib/club/data";

type Step = { id: string; position: number; title: string };

export function PathMap({
  steps,
  walkers,
  activePosition,
  focusId,
}: {
  steps: Step[];
  walkers: PackChildView[];
  activePosition: number | null;
  focusId: string | null;
}) {
  const width = 420;
  const height = 150 + steps.length * 86;
  const points = steps.map((step, index) => {
    const t = steps.length === 1 ? 1 : index / (steps.length - 1);
    const y = height - 64 - t * (height - 160);
    const x = width / 2 + Math.sin(t * Math.PI * 1.35 + 0.35) * 86;
    return { ...step, x, y };
  });
  const path = curve(points);
  const top = points[points.length - 1];
  const focus = walkers.find((child) => child.id === focusId) ?? null;
  const focusDone = (position: number) => {
    if (!focus) return false;
    if (focus.finished) return true;
    return focus.nextPosition !== null && position < focus.nextPosition;
  };

  return (
    <div>
      <div className="mb-2 flex flex-wrap gap-3 text-xs font-bold text-[#5e7266]">
        <span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-[#1e4d3a]" /> Done</span>
        <span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-[#f0b429]" /> Here now</span>
        <span className="inline-flex items-center gap-1"><i className="size-2.5 rounded-full bg-[#e6d3b0]" /> Still to come</span>
      </div>
      <div className="relative mx-auto w-full max-w-[460px]" style={{ aspectRatio: `${width} / ${height}` }}>
        <svg viewBox={`0 0 ${width} ${height}`} className="absolute inset-0 h-full w-full">
          <path d={path} fill="none" stroke="#e6d3b0" strokeWidth="28" strokeLinecap="round" />
          {top && (
            <path
              d={`M ${top.x} ${top.y} L 210 46`}
              fill="none"
              stroke="#e6d3b0"
              strokeWidth="8"
              strokeDasharray="2 10"
              strokeLinecap="round"
            />
          )}
          <circle cx="210" cy="46" r="22" fill="#f0b429" />
          <text x="210" y="51" textAnchor="middle" fontSize="16" fill="#1e4d3a">
            ★
          </text>
          <text x="210" y="86" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e4d3a">
            Certificate · +50 points
          </text>
          {points.map((point) => {
            const done = focusDone(point.position);
            const current = point.position === activePosition;
            const fill = done || current ? "#1e4d3a" : "#f7f1e6";
            const ink = done || current ? "#fffdf8" : "#8a7760";
            return (
              <g key={point.id}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={current ? 26 : 22}
                  fill={fill}
                  stroke={current ? "#f0b429" : "#e4d3b5"}
                  strokeWidth={current ? 6 : 2}
                />
                <text x={point.x} y={point.y + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={ink}>
                  {done ? "✓" : current ? "▶" : point.position}
                </text>
                <text
                  x={point.x > width / 2 ? point.x - 36 : point.x + 36}
                  y={point.y + 4}
                  textAnchor={point.x > width / 2 ? "end" : "start"}
                  fontSize="12"
                  fontWeight="800"
                  fill="#1e4d3a"
                >
                  {point.position}. {point.title}
                </text>
              </g>
            );
          })}
        </svg>
        {walkers.map((child) => {
          const place = child.finished ? { x: 210, y: 46 } : points.find((point) => point.position === (child.nextPosition ?? 1));
          if (!place) return null;
          const showPill = child.id !== focusId && child.started && !child.finished;
          return (
            <div
              key={child.id}
              className="absolute"
              style={{
                left: `${(place.x / width) * 100}%`,
                top: `${(place.y / height) * 100}%`,
                transform: "translate(30%, 20%)",
              }}
            >
              <Avatar avatar={child.avatar_key} title={child.nickname} className="size-7 rounded-full ring-2 ring-white" />
              {showPill && (
                <span className="absolute top-7 left-0 whitespace-nowrap rounded-full bg-[#f0b429] px-2 py-0.5 text-[10px] font-extrabold text-[#1a3b2c]">
                  {shortName(child.nickname)} is here
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function curve(points: Array<{ x: number; y: number }>) {
  if (points.length === 0) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1];
    const point = points[i];
    const midY = (prev.y + point.y) / 2;
    d += ` C ${prev.x} ${midY}, ${point.x} ${midY}, ${point.x} ${point.y}`;
  }
  return d;
}
