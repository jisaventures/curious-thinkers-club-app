import { avatarColourHex, hairColourHex, type AvatarFaceId, type AvatarHatId, type HairStyleId } from "@/lib/avatar-style";

export function FamilyAvatar({
  colour,
  face,
  hairStyle = "short",
  hairColour = "brown",
  glasses = false,
  hat = "none",
  className = "h-24 w-16",
  title,
}: {
  colour: string;
  face: string;
  hairStyle?: string;
  hairColour?: string;
  glasses?: boolean;
  hat?: string;
  className?: string;
  title?: string;
}) {
  const background = colour.startsWith("#") ? colour : avatarColourHex(colour);
  const hair = hairColour.startsWith("#") ? hairColour : hairColourHex(hairColour);
  const look = (["smile", "beam", "curious", "calm", "wink", "freckles"].includes(face) ? face : "smile") as AvatarFaceId;
  const style = (["short", "medium", "long"].includes(hairStyle) ? hairStyle : "short") as HairStyleId;
  const top = (["none", "cap", "beanie"].includes(hat) ? hat : "none") as AvatarHatId;
  const skin = "#f6d3b4";

  return (
    <svg viewBox="0 0 96 120" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width="96" height="120" rx="24" fill={background} />
      {style === "long" && (
        <>
          <path d="M22 48c-6 18-4 42 2 58h10c-4-16-2-36 2-50z" fill={hair} />
          <path d="M74 48c6 18 4 42-2 58H62c4-16 2-36-2-50z" fill={hair} />
        </>
      )}
      <path d="M18 86c2 6 2 18 0 26h8c2-8 1-16 0-22z" fill={skin} />
      <path d="M78 86c-2 6-2 18 0 26h-8c-2-8-1-16 0-22z" fill={skin} />
      <circle cx="22" cy="112" r="5" fill={skin} />
      <circle cx="74" cy="112" r="5" fill={skin} />
      <path d="M28 88c6-16 34-16 40 0v32H28z" fill="#fff6ea" />
      <rect x="42" y="74" width="12" height="16" rx="5" fill={skin} />
      <circle cx="48" cy="52" r="22" fill={skin} />
      {style === "short" && <path d="M28 42c4-16 32-16 40 0-8-8-32-8-40 0z" fill={hair} />}
      {style === "medium" && (
        <>
          <path d="M26 44c2-18 40-18 44 0-6 8-10 16-8 28-8-10-22-10-28 0-2-12-6-20-8-28z" fill={hair} />
          <path d="M30 40c6-12 28-12 36 0-10-6-26-6-36 0z" fill={hair} />
        </>
      )}
      {style === "long" && <path d="M28 40c6-14 32-14 40 0-8-8-32-8-40 0z" fill={hair} />}
      {look === "curious" ? (
        <>
          <circle cx="40" cy="52" r="2.2" fill="#173528" />
          <circle cx="56" cy="50" r="2.2" fill="#173528" />
        </>
      ) : look === "wink" ? (
        <>
          <path d="M36 52c2.5-2 6-2 8 0" fill="none" stroke="#173528" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="56" cy="52" r="2" fill="#173528" />
        </>
      ) : (
        <>
          <circle cx="40" cy="52" r="2" fill="#173528" />
          <circle cx="56" cy="52" r="2" fill="#173528" />
        </>
      )}
      {look === "freckles" && (
        <>
          <circle cx="36" cy="58" r="0.8" fill="#c4551a" />
          <circle cx="41" cy="60" r="0.8" fill="#c4551a" />
          <circle cx="55" cy="60" r="0.8" fill="#c4551a" />
          <circle cx="60" cy="58" r="0.8" fill="#c4551a" />
        </>
      )}
      {look === "calm" ? (
        <path d="M42 64h12" stroke="#173528" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path
          d={look === "beam" ? "M39 62c2.4 4 15.6 4 18 0" : "M41 63c2 2.4 12 2.4 14 0"}
          fill="none"
          stroke="#173528"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
      {glasses && (
        <>
          <circle cx="40" cy="52" r="6" fill="none" stroke="#173528" strokeWidth="1.6" />
          <circle cx="56" cy="52" r="6" fill="none" stroke="#173528" strokeWidth="1.6" />
          <path d="M46 52h4" stroke="#173528" strokeWidth="1.6" />
        </>
      )}
      {top === "cap" && (
        <>
          <path d="M28 40c6-16 34-16 40 0v6H28z" fill="#1e4d3a" />
          <path d="M24 46h40l6 4H22z" fill="#1e4d3a" />
          <Bulb cx={48} cy={40} />
        </>
      )}
      {top === "beanie" && (
        <>
          <path d="M28 44c2-20 38-20 40 0v8H28z" fill="#1e4d3a" />
          <path d="M26 48h44v5H26z" fill="#16392c" />
          <Bulb cx={48} cy={36} />
        </>
      )}
    </svg>
  );
}

function Bulb({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="4.5" fill="#f5d90a" />
      <rect x={cx - 2} y={cy + 3} width="4" height="2.5" rx="0.6" fill="#e6c36a" />
    </g>
  );
}
