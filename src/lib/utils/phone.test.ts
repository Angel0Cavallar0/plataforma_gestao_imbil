import { describe, expect, it } from "vitest";
import { formatBrazilPhone, normalizeBrazilPhoneDisplay } from "@/lib/utils/phone";

describe("formatBrazilPhone", () => {
  it("formats progressively while typing", () => {
    expect(formatBrazilPhone("1")).toBe("(1");
    expect(formatBrazilPhone("19")).toBe("(19");
    expect(formatBrazilPhone("199")).toBe("(19) 9");
    expect(formatBrazilPhone("1999243")).toBe("(19) 99243");
    expect(formatBrazilPhone("19992433914")).toBe("(19) 99243-3914");
  });

  it("strips non-digits and caps at 11 digits", () => {
    expect(formatBrazilPhone("(19) 99243-3914")).toBe("(19) 99243-3914");
    expect(formatBrazilPhone("19992433914123")).toBe("(19) 99243-3914");
  });

  it("normalizes stored raw digits", () => {
    expect(normalizeBrazilPhoneDisplay("11987654321")).toBe("(11) 98765-4321");
  });
});
