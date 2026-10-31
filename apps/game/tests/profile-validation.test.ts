import { describe, expect, it } from "vitest";
import { validateDisplayName } from "../src/auth-routing";

describe("validateDisplayName", () => {
  it("accepts ordinary names and trims the check", () => {
    expect(validateDisplayName("Ava")).toBeNull();
    expect(validateDisplayName("  Ava  ")).toBeNull();
    expect(validateDisplayName("x".repeat(40))).toBeNull();
  });
  it("rejects blank names", () => {
    expect(validateDisplayName("")).toBe("Enter a display name, then try again.");
    expect(validateDisplayName("   ")).toBe("Enter a display name, then try again.");
  });
  it("rejects names longer than the profiles CHECK allows", () => {
    expect(validateDisplayName("x".repeat(41))).toBe(
      "Use a display name with 1 to 40 characters, then try again.",
    );
  });
});
