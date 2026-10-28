export type AuthDiagnostic = {
  code: string | null;
  status: number | null;
  name: string | null;
  message: string;
};

export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (/invalid login credentials/i.test(message))
    return "Those sign-in details did not match. Check them and try again.";
  if (/already registered|already exists/i.test(message))
    return "That email already has an account. Sign in instead.";
  if (/email address invalid/i.test(message) || /invalid email/i.test(lower))
    return copy.auth.invalidEmail;
  if (/weak_password|weak password/i.test(message))
    return "Choose a stronger password, then try again.";
  if (/password/i.test(message) && /short|length|characters/i.test(message))
    return "Use a password with at least 6 characters, then try again.";
  if (/rate.?limit|over_email_send_rate_limit|too many/i.test(lower)) return copy.auth.rateLimited;
  if (/email.not.confirmed|confirmation/i.test(lower)) return copy.auth.confirmationSent;
  if (/failed to fetch|network|connection/i.test(lower)) return copy.auth.noConnection;
  return message;
}

/** Keep only stable AuthError metadata; never retain request/response or credential fields. */
export function authDiagnosticFrom(error: unknown): AuthDiagnostic {
  const candidate = error && typeof error === "object" ? (error as Record<string, unknown>) : {};
  return {
    code: typeof candidate.code === "string" ? candidate.code : null,
    status: typeof candidate.status === "number" ? candidate.status : null,
    name: typeof candidate.name === "string" ? candidate.name : null,
    message: typeof candidate.message === "string" ? candidate.message : String(error),
  };
}

export function sessionStatusForEmail(
  email: string | null | undefined,
): "signed-in" | "signed-out" {
  return email ? "signed-in" : "signed-out";
}
import { copy } from "./copy/en";
