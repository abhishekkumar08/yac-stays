import { Avatar } from "@kasumi/ui";
import { CircleUserRound } from "lucide-react";

export function UserAvatar({ user, name, hue, size = "md" }) {
  const n = (name ?? user?.name)?.replace(/\(.*?\)/g, "").trim();
  const h = hue ?? user?.avatarHue;
  if (!n) return <CircleUserRound className="h-7 w-7 text-fg-muted" aria-hidden="true" />;
  return <Avatar name={n} size={size} color={`hsl(${h ?? 180} 55% 42%)`} />;
}
