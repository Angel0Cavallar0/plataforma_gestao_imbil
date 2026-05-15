"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarContextValue = {
  imageLoaded: boolean;
  setImageLoaded: (loaded: boolean) => void;
};

const AvatarContext = React.createContext<AvatarContextValue | null>(null);

function useAvatarContext() {
  const ctx = React.useContext(AvatarContext);
  if (!ctx) {
    throw new Error("AvatarImage and AvatarFallback must be used within Avatar");
  }
  return ctx;
}

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false);

    return (
      <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
        <div
          ref={ref}
          className={cn(
            "relative h-8 w-8 shrink-0 overflow-hidden rounded-full",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </AvatarContext.Provider>
    );
  },
);
Avatar.displayName = "Avatar";

const AvatarImage = React.forwardRef<
  HTMLImageElement,
  React.ImgHTMLAttributes<HTMLImageElement>
>(({ className, src, alt = "", onLoad, onError, ...props }, ref) => {
  const { setImageLoaded } = useAvatarContext();

  React.useEffect(() => {
    setImageLoaded(false);
  }, [src, setImageLoaded]);

  if (!src) return null;

  return (
    <img
      ref={ref}
      src={src}
      alt={alt}
      onLoad={(e) => {
        setImageLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        setImageLoaded(false);
        onError?.(e);
      }}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { imageLoaded } = useAvatarContext();

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 flex h-full w-full items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground",
        imageLoaded && "pointer-events-none opacity-0",
        className,
      )}
      aria-hidden={imageLoaded}
      {...props}
    />
  );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
