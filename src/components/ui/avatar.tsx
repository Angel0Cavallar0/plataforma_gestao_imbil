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

function ProfileAvatarInner({
  src,
  name,
  className,
  fallbackClassName,
}: {
  src: string;
  name: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const showImage = !failed;

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-full", className)}>
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center rounded-full bg-sidebar-accent font-medium text-sidebar-accent-foreground",
          fallbackClassName,
          showImage && loaded && "opacity-0",
        )}
        aria-hidden={showImage && loaded}
      >
        {getInitials(name)}
      </div>
      {showImage && (
        // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica do Supabase Storage
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
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
  if (!src) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden rounded-full", className)}>
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center rounded-full bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            fallbackClassName,
          )}
        >
          {getInitials(name)}
        </div>
      </div>
    );
  }

  return (
    <ProfileAvatarInner
      key={src}
      src={src}
      name={name}
      className={className}
      fallbackClassName={fallbackClassName}
    />
  );
}
