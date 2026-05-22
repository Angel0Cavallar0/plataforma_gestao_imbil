import Image from "next/image";
import { cn } from "@/lib/utils";

export const SOCIAL_PROFILE_AVATAR_PATH = "/profile_picture_social_midia.jpg";

const SIZE_CLASS = {
  sm: "h-8 w-8",
  md: "h-9 w-9",
} as const;

export function SocialProfileAvatar({
  className,
  size = "sm",
}: {
  className?: string;
  size?: keyof typeof SIZE_CLASS;
}) {
  const dim = SIZE_CLASS[size];
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full ring-1 ring-neutral-200",
        dim,
        className,
      )}
    >
      <Image
        src={SOCIAL_PROFILE_AVATAR_PATH}
        alt="Imbil"
        fill
        className="object-cover"
        sizes={size === "md" ? "36px" : "32px"}
      />
    </div>
  );
}
