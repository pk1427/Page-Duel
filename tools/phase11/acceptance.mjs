/** Real, opt-in staging verification for Phase 11. Credentials are never logged. */
// This harness deliberately reuses the installed admin client dependency rather
// than adding a production dependency at the monorepo root.
import { createClient } from "../../apps/admin/node_modules/@supabase/supabase-js/dist/index.mjs";
import { readFile } from "node:fs/promises";

const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const adminEmail = process.env.STAGING_ADMIN_EMAIL;
const adminPassword = process.env.STAGING_ADMIN_PASSWORD;
const playerEmail = process.env.STAGING_PLAYER_EMAIL;
const playerPassword = process.env.STAGING_PLAYER_PASSWORD;
const report = [];
const ok = (name) => report.push(`[PASS] ${name}`);
const no = (name) => report.push(`[FAIL] ${name}`);
const need = (value) => { if (!value) throw new Error("Phase 11 authenticated acceptance requires staging credentials in environment variables."); return value; };
const expect = (value, message) => { if (!value) throw new Error(message); };
const stamp = Date.now().toString(36);
const slug = `phase11-automated-${stamp}`;
let admin; let player; let bookId; let versionId;
const assetPaths = ["cover.webp", "pages/p269.webp", "pages/p286.webp"];
const prefix = `books/${slug}/versions/1/`;

async function checksum(bytes) { return Buffer.from(await crypto.subtle.digest("SHA-256", bytes)).toString("hex"); }
async function invoke(action, manifest, assets = []) {
  const session = await admin.auth.getSession();
  const response = await fetch(`${url}/functions/v1/book-publish`, { method: "POST", headers: { authorization: `Bearer ${session.data.session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ action, bookId, versionId, manifest, assets }) });
  return { response, body: await response.json() };
}
function uploadFailure(result) {
  const body = result.body && typeof result.body === "object" ? result.body : {};
  return JSON.stringify({
    status: result.response.status,
    error: body.error,
    code: body.code,
    errors: Array.isArray(body.errors) ? body.errors : undefined,
    results: Array.isArray(body.results)
      ? body.results.map(({ path, status, error }) => ({ path, status, error }))
      : undefined,
  });
}
async function cleanup() {
  if (!admin || !bookId) return;
  await admin.storage.from("book-assets").remove(assetPaths.map((path) => prefix + path));
  await admin.from("books").delete().eq("id", bookId);
}

try {
  need(process.env.PHASE11_STAGING === "1"); need(url); need(key); need(adminEmail); need(adminPassword); need(playerEmail); need(playerPassword);
  const unauth = await fetch(`${url}/functions/v1/book-publish`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  expect(unauth.status === 401, "Unauthenticated function request was not rejected."); ok("unauthenticated Edge Function rejected");
  admin = createClient(url, key);
  const signedIn = await admin.auth.signInWithPassword({ email: adminEmail, password: adminPassword }); if (signedIn.error) throw signedIn.error;
  const claim = await admin.rpc("is_admin"); expect(!claim.error && claim.data === true, "Admin authorization failed."); ok("admin authentication");
  const book = await admin.from("books").insert({ slug, title: "Phase 11 automated acceptance", language: "en", status: "draft" }).select("id").single(); if (book.error) throw book.error; bookId = book.data.id; ok("test book creation");
  const manifest = { id: slug, title: "Phase 11 automated acceptance", version: "1", status: "ready", coverImage: assetPaths[0], spreads: [{ id: "spread-1", left: { page: 1, image: assetPaths[1], people: 1 }, right: { page: 2, image: assetPaths[2], people: 2 } }] };
  const version = await admin.from("book_versions").insert({ book_id: bookId, version_label: "1", manifest_sha256: "0".repeat(64), content_json: manifest }).select("id").single(); if (version.error) throw version.error; versionId = version.data.id; ok("version creation");
  const fixtureRoot = ".local/book-people-everyday-life-india/everyday-life-india-1881";
  const assets = await Promise.all(assetPaths.map(async (path) => {
    const bytes = new Uint8Array(await readFile(`${fixtureRoot}/${path}`));
    return { path, dataBase64: Buffer.from(bytes).toString("base64"), sha256: await checksum(bytes) };
  }));
  let result = await invoke("upload", manifest, assets); expect(result.response.ok && result.body.results?.every((entry) => entry.status === "uploaded"), `Upload failed: ${uploadFailure(result)}`); ok("real asset upload");
  result = await invoke("upload", manifest, assets); expect(result.response.ok && result.body.results?.every((entry) => entry.status === "skipped"), `Idempotency failed: ${uploadFailure(result)}`); ok("upload idempotency");
  const altered = new Uint8Array([1, 2, 3]); result = await invoke("upload", manifest, [{ path: assetPaths[0], dataBase64: Buffer.from(altered).toString("base64"), sha256: await checksum(altered) }]); expect(result.response.ok && result.body.results?.[0]?.status === "conflict", `Conflict protection failed: ${uploadFailure(result)}`); ok("conflict protection");
  result = await invoke("validate", manifest); expect(result.response.ok && result.body.ok, `Validation failed: ${uploadFailure(result)}`);
  const persistedValidation = await admin.from("book_versions").select("validation_status,manifest_sha256").eq("id", versionId).single();
  expect(
    !persistedValidation.error
      && persistedValidation.data.validation_status === "validated"
      && persistedValidation.data.manifest_sha256 === result.body.manifest_sha256,
    `Validation was not persisted: ${JSON.stringify({ status: persistedValidation.data?.validation_status, hasExpectedHash: persistedValidation.data?.manifest_sha256 === result.body.manifest_sha256, error: persistedValidation.error?.message })}`,
  );
  ok("validation");
  result = await invoke("publish", manifest); expect(result.response.ok && result.body.ok, `Publishing failed: ${uploadFailure(result)}`); ok("publish");
  player = createClient(url, key);
  const playerSignIn = await player.auth.signInWithPassword({ email: playerEmail, password: playerPassword });
  if (playerSignIn.error) throw new Error(`Player authentication failed: ${playerSignIn.error.message}`);
  const catalog = await player.from("books").select("slug,book_versions!inner(id)").eq("slug", slug).eq("book_versions.publication_status", "published"); expect(!catalog.error && catalog.data.length === 1, "Player cannot see published catalog item."); ok("player catalog visibility");
  const playerSession = await player.auth.getSession(); const denied = await fetch(`${url}/functions/v1/book-publish`, { method: "POST", headers: { authorization: `Bearer ${playerSession.data.session.access_token}`, "content-type": "application/json" }, body: JSON.stringify({ action: "upload", bookId, versionId, manifest, assets }) }); expect(denied.status === 403, "Player upload was accepted."); ok("player authorization blocked");
  for (const invalid of ["../x.webp", "/tmp/x.webp", "https://x/y.webp", "x.txt"]) { const bad = { ...manifest, coverImage: invalid }; result = await invoke("validate", bad); expect(result.response.status === 422, "Invalid path accepted."); } ok("invalid path rejection");
  result = await invoke("unpublish", manifest); expect(result.response.ok, `Unpublish failed: ${uploadFailure(result)}`); const hidden = await player.from("books").select("slug").eq("slug", slug); expect(!hidden.error && hidden.data.length === 0, "Unpublished book remains visible."); ok("unpublish"); ok("catalog removal");
} catch (error) { no(error instanceof Error ? error.message : String(error)); }
finally { try { await cleanup(); if (bookId) ok("cleanup"); } catch (error) { no("cleanup: " + String(error)); } console.log("PHASE 11 AUTOMATED ACCEPTANCE"); report.forEach((line) => console.log(line)); if (report.some((line) => line.startsWith("[FAIL]"))) process.exitCode = 1; }
