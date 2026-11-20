import { avatarColourHex, type AvatarFaceId } from "@/lib/avatar-style";

export function FamilyAvatar({
  colour,
  face,
  className = "size-16",
  title,
}: {
  colour: string;
  face: string;
  className?: string;
  title?: string;
}) {
  const background = colour.startsWith("#") ? colour : avatarColourHex(colour);
  const look = (["smile", "beam", "curious", "calm", "wink", "freckles"].includes(face) ? face : "smile") as AvatarFaceId;
  return (
    <svg viewBox="0 0 80 108" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width="80" height="108" rx="22" fill={background} />
      <path d="M16 78c6-16 42-16 48 0v30H16z" fill="#fff6ea" />
      <rect x="34" y="64" width="12" height="16" rx="5" fill="#f3c7a4" />
      <circle cx="40" cy="46" r="22" fill="#f6d3b4" />
      {look === "curious" ? (
        <>
          <circle cx="32" cy="46" r="2.2" fill="#173528" />
          <circle cx="48" cy="44" r="2.2" fill="#173528" />
        </>
      ) : look === "wink" ? (
        <>
          <path d="M28 46c2.5-2 6-2 8 0" fill="none" stroke="#173528" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="48" cy="46" r="2" fill="#173528" />
        </>
      ) : (
        <>
          <circle cx="32" cy="46" r="2" fill="#173528" />
          <circle cx="48" cy="46" r="2" fill="#173528" />
        </>
      )}
      {look === "freckles" && (
        <>
          <circle cx="28" cy="52" r="0.8" fill="#c4551a" />
          <circle cx="33" cy="54" r="0.8" fill="#c4551a" />
          <circle cx="47" cy="54" r="0.8" fill="#c4551a" />
          <circle cx="52" cy="52" r="0.8" fill="#c4551a" />
        </>
      )}
      {look === "calm" ? (
        <path d="M34 56h12" stroke="#173528" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path
          d={look === "beam" ? "M31 54c2.4 4 15.6 4 18 0" : "M33 55c2 2.4 12 2.4 14 0"}
          fill="none"
          stroke="#173528"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
