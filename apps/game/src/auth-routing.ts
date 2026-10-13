import type { SessionStatus } from "./session-store";

/** Routes that require a signed-in user. Everything else public stays public. */
export const PROTECTED_ROUTES = [
  "/books",
  "/setup",
  "/game",
  "/result",
  "/profile",
  "/history",
] as const;

export type ProtectedRoute = (typeof PROTECTED_ROUTES)[number];

/** Destinations a post-auth redirect may land on. Closed list: no open redirects. */
const SAFE_NEXT_ROUTES: readonly string[] = ["/books", "/history"];

export const DEFAULT_NEXT: ProtectedRoute = "/books";

export function isProtectedRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const clean = pathname.split("?")[0]?.split("#")[0] ?? "";
  return (PROTECTED_ROUTES as readonly string[]).includes(clean);
}

/** Resolve an untrusted `next` search param to a safe internal destination. */
export function resolveNextParam(raw: string | string[] | undefined): ProtectedRoute {
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first && (SAFE_NEXT_ROUTES as readonly string[]).includes(first)) {
    return first as ProtectedRoute;
  }
  return DEFAULT_NEXT;
}

/** Pure validation mirroring the profiles display_name CHECK (1–40 chars, trimmed). */
export function validateDisplayName(name: string): string | null {
  const clean = name.trim();
  if (!clean) return "Enter a display name.";
  if (clean.length > 40) return "Use a display name of 1–40 characters.";
  return null;
}

/** Where Play goes: straight to the shelf when signed in, via Sign In otherwise. */
export function playTarget(status: SessionStatus): {
  pathname: "/books" | "/sign-in";
  params?: { next: ProtectedRoute };
} {
  if (status === "signed-in") return { pathname: "/books" };
  return { pathname: "/sign-in", params: { next: DEFAULT_NEXT } };
}
