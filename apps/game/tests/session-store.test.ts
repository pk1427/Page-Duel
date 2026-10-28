import { describe, expect, it } from "vitest";
import {
  authDiagnosticFrom,
  friendlyAuthError,
  sessionStatusForEmail,
} from "../src/auth-diagnostics";

describe("auth diagnostics", () => {
  it("keeps invalid credentials friendly while preserving safe metadata", () => {
    const error = {
      code: "invalid_credentials",
      status: 400,
      name: "AuthApiError",
      message: "Invalid login credentials",
    };
    expect(friendlyAuthError(error.message)).toBe(
      "Those sign-in details did not match. Check them and try again.",
    );
    expect(authDiagnosticFrom(error)).toEqual(error);
  });

  it("preserves email confirmation metadata", () => {
    const error = {
      code: "email_not_confirmed",
      status: 400,
      name: "AuthApiError",
      message: "Email not confirmed",
    };
    expect(friendlyAuthError(error.message)).toContain("Check your email");
    expect(authDiagnosticFrom(error)).toEqual(error);
  });

  it("preserves rate-limit metadata", () => {
    const error = {
      code: "over_email_send_rate_limit",
      status: 429,
      name: "AuthApiError",
      message: "Email rate limit exceeded",
    };
    expect(friendlyAuthError(error.message)).toContain("Too many requests");
    expect(authDiagnosticFrom(error)).toEqual(error);
  });

  it("captures a network failure without inventing API metadata", () => {
    const error = new TypeError("Failed to fetch");
    expect(friendlyAuthError(error.message)).toBe(
      "We could not connect. Check your internet connection, then try again.",
    );
    expect(authDiagnosticFrom(error)).toEqual({
      code: null,
      status: null,
      name: "TypeError",
      message: "Failed to fetch",
    });
  });
});

describe("session identity", () => {
  it("signs out a session that has no email identity", () => {
    expect(sessionStatusForEmail(undefined)).toBe("signed-out");
    expect(sessionStatusForEmail(null)).toBe("signed-out");
    expect(sessionStatusForEmail("reader@example.com")).toBe("signed-in");
  });
});
