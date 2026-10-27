export type AuthDiagnostic = {
  code: string | null;
  status: number | null;
  name: string | null;
  message: string;
};

export function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (/invalid login credentials/i.test(message)) return "That email and password did not match. Try again.";
  if (/already registered|already exists/i.test(message)) return "That email already has an account. Try signing in instead.";
  if (/email address invalid/i.test(message) || /invalid email/i.test(lower)) return "Please enter a valid email address.";
  if (/weak_password|weak password/i.test(message)) return "Please choose a stronger password.";
  if (/password/i.test(message) && /short|length|characters/i.test(message)) return "Use a password of at least 6 characters.";
  if (/rate.?limit|over_email_send_rate_limit|too many/i.test(lower)) return "Too many accounts have been created recently. Please try again later.";
  if (/email.not.confirmed|confirmation/i.test(lower)) return "Account created. Check your email for the confirmation link, then sign in.";
  if (/failed to fetch|network|connection/i.test(lower)) return "Unable to connect. Please check your internet connection.";
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

export function sessionStatusForEmail(email: string | null | undefined): "signed-in" | "signed-out" {
  return email ? "signed-in" : "signed-out";
}
