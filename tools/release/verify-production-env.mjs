#!/usr/bin/env node

/**
 * Fails closed when a release build has no production Supabase/asset settings.
 * It intentionally reports only variable names and URL hosts, never key values.
 */
const required = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_BOOK_ASSET_BASE_URL",
];

const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length) {
  console.error(`Missing required production environment values: ${missing.join(", ")}`);
  process.exit(1);
}

let supabaseHost;
let assetUrl;
try {
  supabaseHost = new URL(process.env.EXPO_PUBLIC_SUPABASE_URL).hostname;
  assetUrl = new URL(process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL);
} catch {
  console.error("Production Supabase and asset base URLs must be valid HTTPS URLs.");
  process.exit(1);
}

if (
  !process.env.EXPO_PUBLIC_SUPABASE_URL.startsWith("https://") ||
  !assetUrl.href.startsWith("https://")
) {
  console.error("Production Supabase and asset base URLs must use HTTPS.");
  process.exit(1);
}

if (["localhost", "127.0.0.1", "idtukblrevdayhfjmetr.supabase.co"].includes(supabaseHost)) {
  console.error("Production build must not use a local or staging Supabase host.");
  process.exit(1);
}

if (!assetUrl.pathname.includes("/storage/v1/object/public/book-assets")) {
  console.error("Production asset base URL must target public book-assets storage.");
  process.exit(1);
}

console.log(`Production environment verified for Supabase host: ${supabaseHost}`);
