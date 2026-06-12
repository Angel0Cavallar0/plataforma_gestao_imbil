import { describe, expect, it } from "vitest";
import {
  formatCaption,
  isCaptionWithinLimit,
  captionLength,
} from "@/lib/marketing/caption";
import { COPY_MAX_LENGTH, POST_STATUS_TRANSITIONS } from "@/lib/constants/marketing";

describe("formatCaption", () => {
  it("combines copy and hashtags", () => {
    expect(formatCaption("Olá mundo", ["imbil", "novidade"])).toBe(
      "Olá mundo\n\n#imbil #novidade",
    );
  });

  it("returns only hashtags when copy empty", () => {
    expect(formatCaption("", ["teste"])).toBe("#teste");
  });
});

describe("caption limits", () => {
  it("respects COPY_MAX_LENGTH", () => {
    const long = "a".repeat(COPY_MAX_LENGTH);
    expect(isCaptionWithinLimit(long, [])).toBe(true);
    expect(isCaptionWithinLimit(long + "b", [])).toBe(false);
    expect(captionLength(long, ["tag"])).toBeGreaterThan(COPY_MAX_LENGTH);
  });
});

describe("POST_STATUS_TRANSITIONS", () => {
  it("allows rascunho to agendado", () => {
    expect(POST_STATUS_TRANSITIONS.rascunho).toContain("agendado");
  });

  it("blocks transitions from publicado", () => {
    expect(POST_STATUS_TRANSITIONS.publicado).toHaveLength(0);
  });
});
