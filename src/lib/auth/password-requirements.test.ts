import { describe, expect, it } from "vitest";
import { getPasswordRequirementStatuses, isPasswordValid } from "./password-requirements";

describe("password requirements", () => {
  it("marks all rules when password is strong and confirmed", () => {
    const statuses = getPasswordRequirementStatuses("SenhaForte@123", "SenhaForte@123");
    expect(statuses.every((s) => s.met)).toBe(true);
    expect(isPasswordValid("SenhaForte@123", "SenhaForte@123")).toBe(true);
  });

  it("fails when missing special character", () => {
    const statuses = getPasswordRequirementStatuses("SenhaForte123", "SenhaForte123");
    expect(statuses.find((s) => s.id === "special")?.met).toBe(false);
  });
});
