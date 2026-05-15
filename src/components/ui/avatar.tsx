"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ProfileAvatar({
  src,
  name,
  className,
  fallbackClassName,
}: {
  src?: string | null;
  name: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [loadedSrc, setLoadedSrc] = React.useState<string | null>(null);
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  const imageReady = Boolean(src) && loadedSrc === src && failedSrc !== src;
  const showImage = Boolean(src) && failedSrc !== src;
  const showFallback = !imageReady;

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full", className)}>
      {showFallback && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            fallbackClassName,
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {showImage && (
        <img
          key={src ?? undefined}
          src={src!}
          alt=""
          className={cn(
            "absolute inset-0 h-full w-full object-cover",
            !imageReady && "opacity-0",
          )}
          onLoad={() => setLoadedSrc(src!)}
          onError={() => setFailedSrc(src!)}
          ref={(node) => {
            if (node?.complete && node.naturalWidth > 0) {
              setLoadedSrc(src!);
            }
          }}
        />
      )}
    </div>
  );
}
