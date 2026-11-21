const ICONS = ["star", "moon", "rocket", "crown", "sun", "heart", "book", "leaf"] as const;

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
  return (
    <span className={`flex items-center justify-center ${className}`} style={{ background: wash }} title={title} aria-hidden={title ? undefined : true}>
      <svg viewBox="0 0 64 64" className="h-[58%] w-[58%]" aria-hidden="true">
        {icon === "star" && <path d="M32 8l6.5 14.2 15.5 1.8-11.6 10.4 3.3 15.1L32 41.8 18.3 49.5l3.3-15.1L10 24l15.5-1.8z" fill={fill} />}
        {icon === "moon" && <path d="M36 8a20 20 0 1 0 14 34A16 16 0 1 1 36 8z" fill={fill} />}
        {icon === "rocket" && (
          <>
            <path d="M32 6c10 8 14 18 14 28l-8 6H26l-8-6c0-10 4-20 14-28z" fill={fill} />
            <circle cx="32" cy="26" r="4" fill={wash} />
            <path d="M24 42l-6 10 10-4 4 6 4-6 10 4-6-10z" fill={fill} />
          </>
        )}
        {icon === "crown" && <path d="M10 44h44l-4-20-10 10-8-16-8 16-10-10z" fill={fill} />}
        {icon === "sun" && (
          <>
            <circle cx="32" cy="32" r="10" fill={fill} />
            <path d="M32 6v8M32 50v8M6 32h8M50 32h8M13 13l6 6M45 45l6 6M51 13l-6 6M19 45l-6 6" stroke={fill} strokeWidth="4" strokeLinecap="round" />
          </>
        )}
        {icon === "heart" && <path d="M32 54L12 32a12 12 0 0 1 18-16l2 2 2-2a12 12 0 0 1 18 16z" fill={fill} />}
        {icon === "book" && (
          <>
            <path d="M32 16v32" stroke={fill} strokeWidth="3" />
            <path d="M32 18c-6-4-14-4-20 0v28c6-4 14-4 20 0z" fill={fill} />
            <path d="M32 18c6-4 14-4 20 0v28c-6-4-14-4-20 0z" fill={fill} />
          </>
        )}
        {icon === "leaf" && <path d="M16 46C18 28 30 14 50 12 48 34 34 48 16 50c0-2 0-3 0-4z" fill={fill} />}
      </svg>
    </span>
  );
}
