// Secure book publishing boundary. Deploy with `supabase functions deploy book-publish`.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const BUCKET = "book-assets";
const IMAGE_TYPES: Record<string, string> = {
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
};
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type" };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function relativePath(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && !/^[a-z][a-z0-9+.-]*:/i.test(value)
    && !value.startsWith("/") && !value.includes("\\") && !value.split("/").includes("..");
}
function imageType(path: string): string | undefined {
  return IMAGE_TYPES["." + (path.split(".").pop() || "").toLowerCase()];
}
function assets(manifest: Record<string, unknown>): string[] {
  const found: string[] = [];
  if (typeof manifest.coverImage === "string" && !manifest.coverImage.startsWith("placeholder:")) found.push(manifest.coverImage);
  for (const spread of Array.isArray(manifest.spreads) ? manifest.spreads : []) {
    if (!spread || typeof spread !== "object") continue;
    for (const side of ["left", "right"]) {
      const image = (spread as Record<string, any>)[side]?.image;
      if (typeof image === "string" && !image.startsWith("placeholder:")) found.push(image);
    }
  }
  return found;
}
async function sha256(bytes: Uint8Array) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((x) => x.toString(16).padStart(2, "0")).join("");
}
function validateManifest(manifest: Record<string, unknown>, slug: string, label: string): string[] {
  const errors: string[] = [];
  if (manifest.id !== slug) errors.push("Manifest book id does not match book slug.");
  if (manifest.version !== label) errors.push("Manifest version does not match version label.");
  if (!Array.isArray(manifest.spreads) || manifest.spreads.length === 0) errors.push("Manifest must contain spreads.");
  const paths = assets(manifest), unique = new Set(paths);
  if (unique.size !== paths.length) errors.push("Manifest contains duplicate asset paths.");
  for (const path of paths) {
    if (!relativePath(path)) errors.push(`Invalid asset path: ${path}`);
    else if (!imageType(path)) errors.push(`Unsupported image type: ${path}`);
  }
  if (typeof manifest.coverImage !== "string" || !manifest.coverImage || manifest.coverImage.startsWith("placeholder:")) errors.push("A hosted cover image is required.");
  return errors;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (request.method !== "POST") return json({ error: "POST required" }, 405);
  const url = Deno.env.get("SUPABASE_URL")!;
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!service) return json({ error: "Server upload is not configured." }, 503);
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Authentication required." }, 401);
  const auth = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: userData } = await auth.auth.getUser();
  if (!userData.user) return json({ error: "Invalid session." }, 401);
  const { data: admin } = await auth.rpc("is_admin");
  if (admin !== true) return json({ error: "Admin authorization required." }, 403);
  let payload: any;
  try { payload = await request.json(); } catch { return json({ error: "Invalid JSON." }, 400); }
  const { action, bookId, versionId, manifest } = payload ?? {};
  if (!bookId || !versionId || !manifest || typeof manifest !== "object") return json({ error: "bookId, versionId, and manifest are required." }, 400);
  const db = createClient(url, service);
  const { data: version } = await db.from("book_versions").select("id, book_id, version_label").eq("id", versionId).eq("book_id", bookId).single();
  const { data: book } = await db.from("books").select("id, slug").eq("id", bookId).single();
  if (!version || !book) return json({ error: "Book/version pair not found." }, 404);
  const errors = validateManifest(manifest, book.slug, version.version_label);
  if (errors.length) return json({ error: "Manifest validation failed.", errors }, 422);
  const prefix = `books/${book.slug}/versions/${version.version_label}/`;
  const expected = assets(manifest);
  if (action === "upload") {
    const incoming = Array.isArray(payload.assets) ? payload.assets : [];
    const results: any[] = [];
    for (const item of incoming) {
      if (!item || !expected.includes(item.path) || !relativePath(item.path) || !imageType(item.path) || typeof item.dataBase64 !== "string") {
        results.push({ path: item?.path ?? "unknown", status: "failed", error: "Asset is not an expected image path." }); continue;
      }
      let bytes: Uint8Array; try { bytes = Uint8Array.from(atob(item.dataBase64), (c) => c.charCodeAt(0)); } catch { results.push({ path: item.path, status: "failed", error: "Invalid asset encoding." }); continue; }
      const digest = await sha256(bytes);
      if (item.sha256 && item.sha256 !== digest) { results.push({ path: item.path, status: "failed", error: "Asset checksum mismatch." }); continue; }
      const objectPath = prefix + item.path;
      const { data: existing } = await db.storage.from(BUCKET).download(objectPath);
      if (existing) {
        const existingDigest = await sha256(new Uint8Array(await existing.arrayBuffer()));
        results.push(existingDigest === digest ? { path: item.path, status: "skipped", sha256: digest } : { path: item.path, status: "conflict", error: "Existing asset checksum differs." });
        continue;
      }
      const { error } = await db.storage.from(BUCKET).upload(objectPath, bytes, { contentType: imageType(item.path), upsert: false });
      results.push(error ? { path: item.path, status: "failed", error: error.message } : { path: item.path, status: "uploaded", sha256: digest });
    }
    await db.from("admin_audit_log").insert({ admin_user_id: userData.user.id, action: "upload_assets", resource_type: "book_version", resource_id: versionId, metadata: { book_id: bookId, result: results } });
    return json({ results });
  }
  const stored = await Promise.all(expected.map(async (path) => ({ path, result: await db.storage.from(BUCKET).download(prefix + path) })));
  const missing = stored.filter(({ result }) => result.error || !result.data).map(({ path }) => path);
  const canonical = JSON.stringify(manifest);
  const manifestSha256 = await sha256(new TextEncoder().encode(canonical));
  if (action === "validate") {
    const outcome = { book_id: bookId, missing_assets: missing, manifest_sha256: manifestSha256 };
    if (missing.length) { await db.from("book_versions").update({ validation_status: "unvalidated" }).eq("id", versionId); await db.from("admin_audit_log").insert({ admin_user_id: userData.user.id, action: "validation_failed", resource_type: "book_version", resource_id: versionId, metadata: outcome }); return json({ ok: false, errors: missing.map((p) => `Missing asset: ${p}`), ...outcome }, 422); }
    const { error: validationUpdateError } = await db
      .from("book_versions")
      .update({ content_json: manifest, manifest_sha256: manifestSha256, validation_status: "validated" })
      .eq("id", versionId);
    if (validationUpdateError) {
      return json({ error: "Unable to persist server validation.", code: validationUpdateError.code, details: validationUpdateError.message }, 500);
    }
    await db.from("admin_audit_log").insert({ admin_user_id: userData.user.id, action: "validation_performed", resource_type: "book_version", resource_id: versionId, metadata: outcome });
    return json({ ok: true, ...outcome });
  }
  if (action === "publish") {
    if (missing.length) return json({ error: "Cannot publish: assets are missing.", errors: missing }, 422);
    const { error } = await db.rpc("publish_validated_book_version", { p_book_id: bookId, p_version_id: versionId, p_manifest_sha256: manifestSha256 });
    if (error) return json({ error: error.message }, 422);
    await db.from("admin_audit_log").insert({ admin_user_id: userData.user.id, action: "publish", resource_type: "book_version", resource_id: versionId, metadata: { book_id: bookId, manifest_sha256: manifestSha256 } });
    return json({ ok: true });
  }
  if (action === "unpublish") {
    const { error } = await db.rpc("unpublish_book_version", { p_book_id: bookId, p_version_id: versionId });
    if (error) return json({ error: error.message }, 422);
    await db.from("admin_audit_log").insert({ admin_user_id: userData.user.id, action: "unpublish", resource_type: "book_version", resource_id: versionId, metadata: { book_id: bookId } });
    return json({ ok: true });
  }
  return json({ error: "Unsupported action." }, 400);
});
