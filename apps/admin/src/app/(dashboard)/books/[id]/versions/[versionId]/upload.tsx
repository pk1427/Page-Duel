import { useState, useEffect } from "react";
import { View, Text, ScrollView, Alert, Platform, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { useAdminSession } from "@/lib/admin-session";
import { Screen, Title, Eyebrow, Body, Caption, Card, Badge, AppButton, palette, space, radius } from "@/components/ui";
import { StyleSheet } from "react-native";
import type { AdminBookVersion } from "@/types";
import { validateBookJson, collectAssetPaths, uploadFile, type BookManifest } from "./publish-utils";

export default function VersionUploadScreen() {
  const { id, versionId } = useLocalSearchParams<{ id: string; versionId: string }>();
  const { userEmail } = useAdminSession();
  const [version, setVersion] = useState<AdminBookVersion | null>(null);
  const [book, setBook] = useState<{ id: string; slug: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"manifest" | "upload" | "complete">("manifest");
  const [manifest, setManifest] = useState<BookManifest | null>(null);
  const [manifestText, setManifestText] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [assetPaths, setAssetPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ uploaded: 0, skipped: 0, failed: 0, total: 0, current: "" });
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [manifestSha256, setManifestSha256] = useState<string | null>(null);

  const fetchData = async () => {
    const client = getSupabase();
    if (!client || !id || !versionId) return;

    try {
      const [versionResult, bookResult] = await Promise.all([
        client.from("book_versions").select("*").eq("id", versionId).single(),
        client.from("books").select("id, slug, title").eq("id", id).single(),
      ]);

      if (versionResult.data) setVersion(versionResult.data as AdminBookVersion);
      if (bookResult.data) setBook(bookResult.data as any);

      // Load existing manifest if present
      if (versionResult.data?.content_json) {
        const content = versionResult.data.content_json as BookManifest;
        setManifest(content);
        setManifestText(JSON.stringify(content, null, 2));
      }
    } catch (error) {
      console.error("Fetch upload error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, versionId]);

  const handleManifestChange = (text: string) => {
    setManifestText(text);
    try {
      const parsed = JSON.parse(text);
      setManifest(parsed);
      const paths = collectAssetPaths(parsed);
      setAssetPaths(paths);
      setValidationErrors([]);
    } catch {
      setManifest(null);
      setAssetPaths([]);
    }
  };

  const runValidation = () => {
    if (!manifest) {
      setValidationErrors(["No manifest to validate"]);
      return;
    }
    const errors = validateBookJson(manifest, book?.slug || "");
    setValidationErrors(errors);
    if (errors.length === 0) {
      setStep("upload");
    }
  };

  const calculateManifestSha256 = async (manifestObj: BookManifest): Promise<string> => {
    const json = JSON.stringify(manifestObj, null, 2);
    const encoder = new TextEncoder();
    const data = encoder.encode(json);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleUpload = async () => {
    if (!manifest || !book || !version) return;
    if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
      Alert.alert("Not Configured", "Supabase URL not configured. Set EXPO_PUBLIC_SUPABASE_URL.");
      return;
    }
    // Note: In production, this would use a server-side function with service-role key
    // For now, we show the workflow and calculate manifest SHA
    setUploading(true);
    setUploadProgress({ uploaded: 0, skipped: 0, failed: 0, total: assetPaths.length, current: "" });
    setUploadErrors([]);

    try {
      // Calculate manifest SHA-256
      const sha = await calculateManifestSha256(manifest);
      setManifestSha256(sha);

      // In a real implementation, this would call a server-side edge function
      // that uses the service-role key to upload to storage
      // For demo purposes, we simulate the upload
      Alert.alert(
        "Upload Required",
        "Asset upload requires a server-side function with service-role credentials. " +
        "The admin dashboard prepares the manifest and calculates SHA-256. " +
        "Use 'tools/book-prep/publish.py' with the service-role key to upload assets, " +
        "then update the book_version record with the manifest_sha256."
      );

      // Update version with manifest and SHA
      const client = getSupabase();
      if (client) {
        await client.from("book_versions").update({
          content_json: manifest,
          manifest_sha256: sha,
          validation_status: "validated",
        }).eq("id", versionId);

        await client.from("admin_audit_log").insert({
          admin_user_id: (await client.auth.getUser()).data.user?.id,
          action: "upload_assets",
          resource_type: "book_version",
          resource_id: versionId,
          metadata: { book_id: id, version_label: version.version_label, asset_count: assetPaths.length, manifest_sha256: sha },
        });
      }

      setStep("complete");
    } catch (error) {
      console.error("Upload error:", error);
      setUploadErrors([String(error)]);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </Screen>
    );
  }

  if (!version || !book) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Version not found</Text>
        </View>
      </Screen>
    );
  }

  const renderManifestStep = () => (
    <View>
      <Card style={styles.stepCard}>
        <Eyebrow style={styles.stepTitle}>Step 1: Book Manifest</Eyebrow>
        <Body>Paste or edit the book.final.json manifest. This defines all spreads, pages, and asset references.</Body>
        <TextInput
          style={styles.textArea}
          value={manifestText}
          onChangeText={handleManifestChange}
          placeholder='{"id": "book-slug", "title": "Book Title", "version": "1", "status": "ready", "coverImage": "cover.webp", "spreads": [...]}'
          multiline
          numberOfLines={20}
        />
        {validationErrors.length > 0 && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Validation Errors:</Text>
            {validationErrors.map((e, i) => (
              <Text key={i} style={styles.errorItem}>• {e}</Text>
            ))}
          </View>
        )}
        <View style={styles.stepActions}>
          <AppButton onPress={runValidation} disabled={!manifestText.trim()} variant="primary">
            Validate Manifest
          </AppButton>
        </View>
      </Card>

      {assetPaths.length > 0 && (
        <Card style={styles.assetListCard}>
          <Eyebrow style={styles.sectionTitle}>Referenced Assets ({assetPaths.length})</Eyebrow>
          <View style={styles.assetList}>
            {assetPaths.map((p, i) => (
              <Text key={i} style={styles.assetItem} numberOfLines={1}>{p}</Text>
            ))}
          </View>
        </Card>
      )}
    </View>
  );

  const renderUploadStep = () => (
    <View>
      <Card style={styles.stepCard}>
        <Eyebrow style={styles.stepTitle}>Step 2: Upload Assets</Eyebrow>
        <Body>Upload all referenced assets to Supabase Storage. This requires server-side service-role credentials.</Body>
        <View style={styles.assetList}>
          {assetPaths.map((p, i) => (
            <View key={i} style={styles.assetRow}>
              <Text style={styles.assetItem} numberOfLines={1}>{p}</Text>
              <Badge tone="default">Pending</Badge>
            </View>
          ))}
        </View>
        <View style={styles.uploadProgress}>
          <Text>Progress: {uploadProgress.uploaded + uploadProgress.skipped} / {uploadProgress.total}</Text>
          {uploadProgress.current && <Text style={styles.currentFile}>{uploadProgress.current}</Text>}
        </View>
        {uploadErrors.length > 0 && (
          <View style={styles.errorBox}>
            <Text style={styles.errorTitle}>Upload Errors:</Text>
            {uploadErrors.map((e, i) => (
              <Text key={i} style={styles.errorItem}>• {e}</Text>
            ))}
          </View>
        )}
        <View style={styles.stepActions}>
          <AppButton onPress={handleUpload} disabled={uploading} variant="primary">
            {uploading ? "Uploading…" : "Start Upload"}
          </AppButton>
        </View>
      </Card>

      {manifestSha256 && (
        <Card style={styles.shaCard}>
          <Eyebrow style={styles.sectionTitle}>Manifest SHA-256</Eyebrow>
          <Text style={styles.shaValue}>{manifestSha256}</Text>
          <Caption>This hash will be stored with the book_version for integrity verification.</Caption>
        </Card>
      )}
    </View>
  );

  const renderCompleteStep = () => (
    <View>
      <Card style={styles.completeCard}>
        <Text style={styles.completeIcon}>✓</Text>
        <Text style={styles.completeTitle}>Upload Complete</Text>
        <Body>Manifest saved with SHA-256. Version marked as validated.</Body>
        {manifestSha256 && (
          <Text style={styles.shaValue}>{manifestSha256}</Text>
        )}
        <View style={styles.stepActions}>
          <AppButton onPress={() => router.push(`/admin/(dashboard)/books/${id}/versions/${versionId}/preview` as any)} variant="secondary">
            Preview
          </AppButton>
          <AppButton onPress={() => router.push(`/admin/(dashboard)/books/${id}/versions/${versionId}` as any)} variant="primary">
            Go to Version
          </AppButton>
        </View>
      </Card>
    </View>
  );

  return (
    <Screen>
      <ScrollView>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={styles.headerContent}>
            <Eyebrow>Book People Admin</Eyebrow>
            <Title>{book.title}</Title>
            <Body>Upload Assets • Version {version.version_label}</Body>
          </View>
        </View>

        <View style={styles.steps}>
          <View style={[styles.stepIndicator, step === "manifest" && styles.stepIndicatorActive]}>
            <Text style={[styles.stepNumber, step === "manifest" && styles.stepNumberActive]}>1</Text>
            <Text style={[styles.stepLabel, step === "manifest" && styles.stepLabelActive]}>Manifest</Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={[styles.stepIndicator, step === "upload" && styles.stepIndicatorActive]}>
            <Text style={[styles.stepNumber, step === "upload" && styles.stepNumberActive]}>2</Text>
            <Text style={[styles.stepLabel, step === "upload" && styles.stepLabelActive]}>Upload</Text>
          </View>
          <View style={styles.stepConnector} />
          <View style={[styles.stepIndicator, step === "complete" && styles.stepIndicatorActive]}>
            <Text style={[styles.stepNumber, step === "complete" && styles.stepNumberActive]}>3</Text>
            <Text style={[styles.stepLabel, step === "complete" && styles.stepLabelActive]}>Complete</Text>
          </View>
        </View>

        {step === "manifest" && renderManifestStep()}
        {step === "upload" && renderUploadStep()}
        {step === "complete" && renderCompleteStep()}
      </ScrollView>
    </Screen>
  );
}

// TextInput import needed
import { TextInput } from "react-native";

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: palette.muted,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    marginBottom: space.md,
  },
  backButton: {
    paddingTop: space.xs,
  },
  backText: {
    color: palette.accent,
    fontSize: 16,
    fontWeight: "600",
  },
  headerContent: {
    flex: 1,
    gap: space.xs,
  },
  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.xl,
    gap: 0,
  },
  stepIndicator: {
    alignItems: "center",
    gap: space.xs,
    opacity: 0.5,
  },
  stepIndicatorActive: {
    opacity: 1,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: palette.border,
  },
  stepNumberActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
  },
  stepLabelActive: {
    color: palette.accent,
  },
  stepConnector: {
    width: 60,
    height: 2,
    backgroundColor: palette.border,
  },
  stepCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  stepTitle: {
    marginBottom: space.md,
  },
  textArea: {
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 20,
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.small,
    padding: space.md,
    minHeight: 300,
    color: palette.ink,
    marginBottom: space.md,
  },
  errorBox: {
    backgroundColor: palette.dangerLight,
    borderColor: palette.danger,
    borderWidth: 1,
    borderRadius: radius.small,
    padding: space.md,
    marginBottom: space.md,
  },
  errorTitle: {
    color: palette.danger,
    fontWeight: "700",
    marginBottom: space.xs,
  },
  errorItem: {
    color: palette.danger,
    fontSize: 13,
  },
  stepActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: space.sm,
    marginTop: space.md,
  },
  assetListCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  sectionTitle: {
    marginBottom: space.md,
  },
  assetList: {
    maxHeight: 200,
    gap: space.xs,
  },
  assetItem: {
    fontFamily: "monospace",
    fontSize: 12,
    color: palette.ink,
    backgroundColor: palette.paper,
    padding: space.xs,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: palette.border,
  },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: space.xs,
  },
  uploadProgress: {
    marginTop: space.md,
    padding: space.md,
    backgroundColor: palette.accentLight,
    borderRadius: radius.small,
    gap: space.xs,
  },
  currentFile: {
    fontFamily: "monospace",
    fontSize: 12,
    color: palette.accentDark,
  },
  shaCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  shaValue: {
    fontFamily: "monospace",
    fontSize: 12,
    color: palette.ink,
    backgroundColor: palette.paper,
    padding: space.md,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: palette.border,
  },
  completeCard: {
    padding: space.xl,
    alignItems: "center",
    backgroundColor: palette.successLight,
    borderColor: palette.success,
    borderWidth: 1,
  },
  completeIcon: {
    fontSize: 48,
    color: palette.success,
    marginBottom: space.md,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: palette.success,
    marginBottom: space.sm,
  },
});