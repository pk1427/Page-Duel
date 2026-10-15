import { useEffect, useState } from "react";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { useAdminSession } from "@/lib/admin-session";
import { Screen, Title, Eyebrow, Body, Caption, Card, Badge, AppButton, palette, space, radius } from "@/components/ui";
import { StyleSheet } from "react-native";
import type { AdminBookVersion } from "@/types";
import { validateContentPack, type BookContent } from "@book-people/book-data";

export default function VersionDetailScreen() {
  const { id, versionId } = useLocalSearchParams<{ id: string; versionId: string }>();
  const { userEmail } = useAdminSession();
  const [version, setVersion] = useState<AdminBookVersion | null>(null);
  const [book, setBook] = useState<{ id: string; slug: string; title: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [validationResult, setValidationResult] = useState<{ ok: boolean; errors: string[]; warnings: string[] } | null>(null);

  const fetchVersion = async () => {
    const client = getSupabase();
    if (!client || !id || !versionId) return;

    try {
      const [versionResult, bookResult] = await Promise.all([
        client.from("book_versions").select("*").eq("id", versionId).single(),
        client.from("books").select("id, slug, title").eq("id", id).single(),
      ]);

      if (versionResult.data) setVersion(versionResult.data as AdminBookVersion);
      if (bookResult.data) setBook(bookResult.data as any);
    } catch (error) {
      console.error("Fetch version error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersion();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, versionId]);

  const runValidation = async () => {
    if (!version?.content_json) {
      setValidationResult({ ok: false, errors: ["No content JSON to validate"], warnings: [] });
      return;
    }
    setValidating(true);
    try {
      const content = version.content_json as unknown as BookContent;
      const validation = validateContentPack(content);
      setValidationResult({ ok: validation.ok, errors: validation.errors, warnings: [] });

      // Update validation status in DB
      const client = getSupabase();
      if (client) {
        await client.from("book_versions").update({
          validation_status: validation.ok ? "validated" : "unvalidated",
        }).eq("id", versionId);
        // Refresh
        fetchVersion();
      }
    } catch (error) {
      console.error("Validation error:", error);
      setValidationResult({ ok: false, errors: ["Validation failed: " + String(error)], warnings: [] });
    } finally {
      setValidating(false);
    }
  };

  const handlePublish = async () => {
    if (!version || !validationResult?.ok) {
      Alert.alert("Cannot Publish", "Version must pass validation before publishing.");
      return;
    }
    if (version.publication_status === "published") {
      Alert.alert("Already Published", "This version is already published.");
      return;
    }

    const client = getSupabase();
    if (!client) return;

    Alert.alert(
      "Publish Version",
      `Publish version ${version.version_label} of "${book?.title}"? This will make it visible to all players.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Publish",
          onPress: async () => {
            setPublishing(true);
            try {
              // Check if another version is already published for this book
              const { data: existing } = await client
                .from("book_versions")
                .select("id, version_label")
                .eq("book_id", id)
                .eq("publication_status", "published")
                .neq("id", versionId);

              if (existing && existing.length > 0) {
                Alert.alert(
                  "Another Version Published",
                  `Version ${existing[0].version_label} is already published. Only one published version per book is allowed. Unpublish the other version first.`,
                  [{ text: "OK" }]
                );
                setPublishing(false);
                return;
              }

              const { error } = await client.from("book_versions").update({
                publication_status: "published",
                published_at: new Date().toISOString(),
              }).eq("id", versionId);

              if (error) throw error;

              // Update book status to published if not already
              await client.from("books").update({ status: "published" }).eq("id", id);

              await client.from("admin_audit_log").insert({
                admin_user_id: (await client.auth.getUser()).data.user?.id,
                action: "publish",
                resource_type: "book_version",
                resource_id: versionId,
                metadata: { book_id: id, version_label: version.version_label },
              });

              Alert.alert("Published", "Version is now live for players.");
              fetchVersion();
            } catch (error) {
              console.error("Publish error:", error);
              Alert.alert("Error", "Failed to publish version");
            } finally {
              setPublishing(false);
            }
          },
        },
      ]
    );
  };

  const handleUnpublish = async () => {
    if (!version || version.publication_status !== "published") {
      Alert.alert("Not Published", "This version is not currently published.");
      return;
    }

    const client = getSupabase();
    if (!client) return;

    Alert.alert(
      "Unpublish Version",
      `Unpublish version ${version.version_label}? This will hide it from players. Game history will be preserved.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unpublish",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await client.from("book_versions").update({
                publication_status: "unpublished",
                published_at: null,
              }).eq("id", versionId);

              if (error) throw error;

              // Check if any other versions are published for this book
              const { data: otherPublished } = await client
                .from("book_versions")
                .select("id")
                .eq("book_id", id)
                .eq("publication_status", "published");

              if (!otherPublished || otherPublished.length === 0) {
                await client.from("books").update({ status: "ready" }).eq("id", id);
              }

              await client.from("admin_audit_log").insert({
                admin_user_id: (await client.auth.getUser()).data.user?.id,
                action: "unpublish",
                resource_type: "book_version",
                resource_id: versionId,
                metadata: { book_id: id, version_label: version.version_label },
              });

              Alert.alert("Unpublished", "Version is no longer visible to players.");
              fetchVersion();
            } catch (error) {
              console.error("Unpublish error:", error);
              Alert.alert("Error", "Failed to unpublish version");
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!version) return;

    Alert.alert(
      "Delete Version",
      `Permanently delete version ${version.version_label}? This cannot be undone. Assets in storage will NOT be deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const client = getSupabase();
            if (!client) return;
            try {
              await client.from("book_versions").delete().eq("id", versionId);
              await client.from("admin_audit_log").insert({
                admin_user_id: (await client.auth.getUser()).data.user?.id,
                action: "delete",
                resource_type: "book_version",
                resource_id: versionId,
                metadata: { book_id: id, version_label: version.version_label },
              });
              router.push(`/admin/(dashboard)/books/${id}` as any);
            } catch (error) {
              console.error("Delete version error:", error);
              Alert.alert("Error", "Failed to delete version");
            }
          },
        },
      ]
    );
  };

  const handlePreview = () => {
    if (!version || !book) return;
    router.push(`/admin/(dashboard)/books/${id}/versions/${versionId}/preview` as any);
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading version…</Text>
        </View>
      </Screen>
    );
  }

  if (!version) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Version not found</Text>
        </View>
      </Screen>
    );
  }

  const statusTone = version.publication_status === "published" ? "moss" :
    version.validation_status === "validated" ? "gold" :
    version.validation_status === "validating" ? "warning" : "default";

  return (
    <Screen>
      <ScrollView>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={styles.headerContent}>
            <Eyebrow>Book People Admin</Eyebrow>
            <Title>{book?.title}</Title>
            <Body>Version {version.version_label} • {book?.slug}</Body>
          </View>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.statusBadge}>
            <Badge tone={statusTone}>
              {version.validation_status}
              {version.publication_status === "published" && " • Published"}
            </Badge>
          </View>
          <View style={styles.toolbarActions}>
            <AppButton variant="secondary" onPress={handlePreview} disabled={!validationResult?.ok}>
              Preview
            </AppButton>
            {version.publication_status === "published" ? (
              <AppButton variant="danger" onPress={handleUnpublish}>
                Unpublish
              </AppButton>
            ) : (
              <AppButton onPress={handlePublish} disabled={!validationResult?.ok || publishing} variant="primary">
                {publishing ? "Publishing…" : "Publish"}
              </AppButton>
            )}
          </View>
        </View>

        <Card style={styles.infoCard}>
          <Eyebrow style={styles.sectionTitle}>Version Info</Eyebrow>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Caption>Version Label</Caption>
              <Text style={styles.infoValue}>v{version.version_label}</Text>
            </View>
            <View style={styles.infoItem}>
              <Caption>Validation Status</Caption>
              <Badge tone={version.validation_status === "validated" ? "moss" : version.validation_status === "validating" ? "warning" : "default"}>
                {version.validation_status}
              </Badge>
            </View>
            <View style={styles.infoItem}>
              <Caption>Publication Status</Caption>
              <Badge tone={version.publication_status === "published" ? "moss" : "default"}>
                {version.publication_status}
              </Badge>
            </View>
            <View style={styles.infoItem}>
              <Caption>Manifest SHA-256</Caption>
              <Text style={[styles.infoValue, styles.mono]}>
                {version.manifest_sha256 ? version.manifest_sha256.slice(0, 24) + "…" : "Not set"}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Caption>Created</Caption>
              <Text style={styles.infoValue}>{new Date(version.created_at).toLocaleString()}</Text>
            </View>
            <View style={styles.infoItem}>
              <Caption>Published</Caption>
              <Text style={styles.infoValue}>
                {version.published_at ? new Date(version.published_at).toLocaleString() : "Never"}
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.validationCard}>
          <View style={styles.sectionHeader}>
            <Eyebrow style={styles.sectionTitle}>Validation</Eyebrow>
            <AppButton
              onPress={runValidation}
              disabled={validating || !version.content_json}
              variant={validationResult?.ok ? "secondary" : "primary"}
            >
              {validating ? "Validating…" : "Run Validation"}
            </AppButton>
          </View>

          {validationResult ? (
            <View style={styles.validationResult}>
              <Badge tone={validationResult.ok ? "moss" : "danger"} style={styles.validationBadge}>
                {validationResult.ok ? "Valid" : "Invalid"}
              </Badge>
              {validationResult.errors.length > 0 && (
                <View style={styles.errorList}>
                  {validationResult.errors.map((e, i) => (
                    <Text key={i} style={styles.errorItem}>• {e}</Text>
                  ))}
                </View>
              )}
              {validationResult.ok && validationResult.errors.length === 0 && (
                <Text style={styles.successText}>All checks passed. Ready to publish.</Text>
              )}
            </View>
          ) : version.content_json ? (
            <Caption>Click 'Run Validation' to check this version.</Caption>
          ) : (
            <Caption>No content JSON to validate. Add content or upload prepared assets.</Caption>
          )}
        </Card>

        {version.content_json && (
          <Card style={styles.contentCard}>
            <Eyebrow style={styles.sectionTitle}>Content Manifest</Eyebrow>
            <Text style={styles.jsonView}>
              {JSON.stringify(version.content_json, null, 2)}
            </Text>
          </Card>
        )}

        <Card style={styles.dangerCard}>
          <Eyebrow style={{ color: palette.danger }}>Danger Zone</Eyebrow>
          <Body>These actions are irreversible.</Body>
          <AppButton variant="danger" onPress={handleDelete} style={[styles.deleteButton, { marginTop: space.md }]}>
            Delete Version Permanently
          </AppButton>
        </Card>
      </ScrollView>
    </Screen>
  );
}

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
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  statusBadge: {},
  toolbarActions: {
    flexDirection: "row",
    gap: space.sm,
  },
  infoCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  sectionTitle: {
    marginBottom: space.md,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.lg,
  },
  infoItem: {
    flex: 1,
    minWidth: 150,
    gap: space.xs,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.ink,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  validationCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  validationResult: {
    gap: space.md,
    marginTop: space.md,
  },
  validationBadge: {
    alignSelf: "flex-start",
  },
  errorList: {
    gap: space.xs,
  },
  errorItem: {
    color: palette.danger,
    fontSize: 14,
  },
  successText: {
    color: palette.moss,
    fontWeight: "600",
  },
  contentCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  jsonView: {
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
    color: palette.ink,
    backgroundColor: palette.paper,
    padding: space.md,
    borderRadius: radius.small,
    borderWidth: 1,
    borderColor: palette.border,
  },
  dangerCard: {
    padding: space.lg,
    borderColor: palette.danger,
    borderWidth: 1,
    backgroundColor: palette.dangerLight,
  },
  deleteButton: {
    width: "100%",
  },
});