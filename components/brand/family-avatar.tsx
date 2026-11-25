import { avatarSvg } from "@/lib/avatar-markup";
import type { AvatarBuild } from "@/lib/avataaars-options";

export function FamilyAvatar({
  build,
  className = "h-24 w-16",
  title,
}: {
  build: AvatarBuild;
  className?: string;
  title?: string;
}) {
  const svg = avatarSvg(build);
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
