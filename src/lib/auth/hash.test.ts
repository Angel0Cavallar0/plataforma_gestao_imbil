import { describe, expect, it } from "vitest";
import { formatAuthHashError, getPasswordPathForAuthType, parseAuthHash } from "./hash";

describe("parseAuthHash", () => {
  it("parses invite tokens", () => {
    const parsed = parseAuthHash("#access_token=abc&type=invite");
    expect(parsed?.accessToken).toBe("abc");
    expect(parsed?.type).toBe("invite");
  });

  it("parses otp_expired error", () => {
    const parsed = parseAuthHash("#error=access_denied&error_code=otp_expired");
    expect(parsed?.errorCode).toBe("otp_expired");
    expect(formatAuthHashError(parsed!)).toContain("expirou");
  });

  it("maps recovery type to trocar-senha", () => {
    expect(getPasswordPathForAuthType("recovery")).toBe("/trocar-senha");
    expect(getPasswordPathForAuthType("invite")).toBe("/cadastrar-senha");
  });
});
