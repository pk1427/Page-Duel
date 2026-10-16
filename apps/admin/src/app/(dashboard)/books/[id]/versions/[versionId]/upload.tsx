import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Card, AppButton, Body, Eyebrow, Screen, Title, palette, space } from "@/components/ui";
import { getSupabase } from "@/lib/supabase";
import { secureBookPublish } from "@/lib/book-publish";
import { collectAssetPaths, validateBookJson, type BookManifest } from "./publish-utils";
import type { AdminBookVersion } from "@/types";

type SelectedAsset = { path: string; dataBase64: string; sha256: string };
const toBase64 = (bytes: Uint8Array) => { let value = ""; for (let i = 0; i < bytes.length; i += 0x8000) value += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(value); };
async function digest(bytes: Uint8Array) { return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join(""); }

export default function VersionUploadScreen() {
  const { id, versionId } = useLocalSearchParams<{ id: string; versionId: string }>();
  const [book, setBook] = useState<{ slug: string; title: string } | null>(null);
  const [version, setVersion] = useState<AdminBookVersion | null>(null);
  const [text, setText] = useState(""); const [manifest, setManifest] = useState<BookManifest | null>(null);
  const [files, setFiles] = useState<SelectedAsset[]>([]); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { void (async () => { const db = getSupabase(); if (!db || !id || !versionId) return; const [b, v] = await Promise.all([db.from("books").select("slug,title").eq("id", id).single(), db.from("book_versions").select("*").eq("id", versionId).eq("book_id", id).single()]); if (b.data) setBook(b.data); if (v.data) { setVersion(v.data as AdminBookVersion); setText(JSON.stringify(v.data.content_json ?? {}, null, 2)); } })(); }, [id, versionId]);
  const updateManifest = (value: string) => { setText(value); try { setManifest(JSON.parse(value) as BookManifest); setMessage(""); } catch { setManifest(null); } };
  const chooseAssets = async () => {
    if (!manifest) return; const result = await DocumentPicker.getDocumentAsync({ type: ["image/webp", "image/png", "image/jpeg"], multiple: true, copyToCacheDirectory: true });
    if (result.canceled) return;
    const expected = new Set(collectAssetPaths(manifest)); const picked: SelectedAsset[] = [];
    for (const file of result.assets) { const match = [...expected].find((path) => path === file.name || path.endsWith(`/${file.name}`)); if (!match) { setMessage(`Ignored ${file.name}: it is not referenced by the manifest.`); continue; } const bytes = new Uint8Array(await (await fetch(file.uri)).arrayBuffer()); picked.push({ path: match, dataBase64: toBase64(bytes), sha256: await digest(bytes) }); }
    setFiles(picked); setMessage(`${picked.length} expected asset(s) selected.`);
  };
  const upload = async () => { if (!manifest || !book || !version) return; const errors = validateBookJson(manifest, book.slug); if (errors.length) { setMessage(errors.join("\n")); return; } setBusy(true); try { const result = await secureBookPublish("upload", { bookId: id, versionId, manifest, assets: files }); const rows = (result.results as { status: string }[] ?? []); setMessage(`Upload: ${rows.filter((r) => r.status === "uploaded").length} uploaded, ${rows.filter((r) => r.status === "skipped").length} already present.`); } catch (error) { setMessage(String(error)); } finally { setBusy(false); } };
  const validate = async () => { if (!manifest) return; setBusy(true); try { await secureBookPublish("validate", { bookId: id, versionId, manifest }); setMessage("Server validation passed. You may preview and publish this version."); } catch (error) { setMessage(String(error)); } finally { setBusy(false); } };
  return <Screen><ScrollView><Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable><Eyebrow>Secure publishing</Eyebrow><Title>{book?.title ?? "Loading…"}</Title><Card style={styles.card}><Body>Paste the canonical manifest, select its referenced images, upload safely, then run server validation. Retries skip checksum-identical files.</Body><TextInput value={text} onChangeText={updateManifest} multiline style={styles.input} placeholder="Book manifest JSON" /><AppButton onPress={chooseAssets} disabled={!manifest || busy} variant="secondary">Select referenced images</AppButton><AppButton onPress={upload} disabled={!manifest || !files.length || busy} style={styles.action}>{busy ? "Working…" : "Upload assets"}</AppButton><AppButton onPress={validate} disabled={!manifest || busy} variant="secondary" style={styles.action}>Validate hosted version</AppButton>{message ? <Text style={styles.message}>{message}</Text> : null}</Card></ScrollView></Screen>;
}
const styles = StyleSheet.create({ back: { color: palette.accent, marginBottom: space.md }, card: { gap: space.md, padding: space.lg, marginTop: space.md }, input: { minHeight: 280, borderWidth: 1, borderColor: palette.border, padding: space.sm, fontFamily: "monospace", textAlignVertical: "top" }, action: { marginTop: space.sm }, message: { color: palette.ink } });
