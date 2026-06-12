"use client";

import { SocialProfileAvatar } from "@/components/marketing/calendar/SocialProfileAvatar";

const ACCOUNT_LABEL = "imbil";

export function FacebookPublishedPreview({ message }: { message: string | null }) {
  const text = message?.trim() ?? "";
  const lines = text.split("\n");
  const firstLine = lines[0] ?? "";
  const rest = lines.slice(1).join("\n");

  return (
    <div className="overflow-hidden rounded-xl border bg-white text-black shadow-sm">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-3 py-2">
        <SocialProfileAvatar />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{ACCOUNT_LABEL}</p>
          <p className="text-[10px] text-neutral-500">Publicação no Facebook</p>
        </div>
      </div>

      <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 bg-neutral-50 px-6 text-center">
        <p className="text-sm text-neutral-500">
          Prévia visual indisponível para esta publicação.
        </p>
        <p className="text-xs text-neutral-400">
          Vincule ao Instagram em cross_post_links para exibir mídia.
        </p>
      </div>

      <div className="space-y-1 border-t border-neutral-200 px-3 py-2 text-xs">
        <div className="flex gap-3 text-[#1877F2]">
          <span aria-hidden>👍</span>
          <span aria-hidden>💬</span>
          <span aria-hidden>↗</span>
        </div>
        {text ? (
          <p className="whitespace-pre-wrap break-words leading-snug">
            <span className="font-semibold">{ACCOUNT_LABEL} </span>
            {firstLine}
            {rest ? `\n${rest}` : ""}
          </p>
        ) : (
          <p className="text-neutral-400">Sem texto na publicação</p>
        )}
      </div>
    </div>
  );
}
