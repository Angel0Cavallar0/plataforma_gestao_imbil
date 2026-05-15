"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarContextValue = {
  hasSrc: boolean;
  setHasSrc: (has: boolean) => void;
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

function isImageReady(img: HTMLImageElement | null): boolean {
  return Boolean(img?.complete && img.naturalWidth > 0);
}

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const [hasSrc, setHasSrc] = React.useState(false);
    const [imageLoaded, setImageLoaded] = React.useState(false);

    return (
      <AvatarContext.Provider value={{ hasSrc, setHasSrc, imageLoaded, setImageLoaded }}>
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
  const { setHasSrc, setImageLoaded } = useAvatarContext();
  const imgRef = React.useRef<HTMLImageElement | null>(null);

  const markLoadedIfReady = React.useCallback(() => {
    if (isImageReady(imgRef.current)) {
      setImageLoaded(true);
    }
  }, [setImageLoaded]);

  React.useLayoutEffect(() => {
    const active = Boolean(src);
    setHasSrc(active);
    setImageLoaded(false);
    if (!active) return;
    markLoadedIfReady();
  }, [src, setHasSrc, setImageLoaded, markLoadedIfReady]);

  if (!src) return null;

  return (
    <img
      ref={(node) => {
        imgRef.current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
        if (isImageReady(node)) {
          setImageLoaded(true);
        }
      }}
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
      className={cn("absolute inset-0 z-10 h-full w-full object-cover", className)}
      {...props}
    />
  );
});
AvatarImage.displayName = "AvatarImage";

const AvatarFallback = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const { hasSrc, imageLoaded } = useAvatarContext();

  if (hasSrc && imageLoaded) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn(
        "absolute inset-0 z-0 flex h-full w-full items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
AvatarFallback.displayName = "AvatarFallback";

export { Avatar, AvatarImage, AvatarFallback };
