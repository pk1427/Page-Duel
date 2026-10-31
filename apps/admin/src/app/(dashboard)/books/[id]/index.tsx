import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { useAdminSession } from "@/lib/admin-session";
import {
  Screen,
  Title,
  Eyebrow,
  Body,
  Caption,
  Card,
  Badge,
  AppButton,
  palette,
  space,
  radius,
} from "@/components/ui";
import { StyleSheet } from "react-native";
import type { AdminBook, AdminBookVersion } from "@/types";

export default function BookDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userEmail } = useAdminSession();
  const [book, setBook] = useState<AdminBook | null>(null);
  const [versions, setVersions] = useState<AdminBookVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    author: "",
    description: "",
    language: "en",
    cover_asset_path: "",
    status: "draft" as "draft" | "ready" | "published",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fetchBook = async () => {
    const client = getSupabase();
    if (!client || !id) return;

    try {
      const [bookResult, versionsResult] = await Promise.all([
        client.from("books").select("*").eq("id", id).single(),
        client
          .from("book_versions")
          .select("*")
          .eq("book_id", id)
          .order("created_at", { ascending: false }),
      ]);

      if (bookResult.data) {
        const b = bookResult.data as AdminBook;
        setBook(b);
        setForm({
          slug: b.slug,
          title: b.title,
          author: b.author || "",
          description: b.description || "",
          language: b.language || "en",
          cover_asset_path: b.cover_asset_path || "",
          status: b.status,
        });
      }
      if (versionsResult.data) {
        setVersions(versionsResult.data as AdminBookVersion[]);
      }
    } catch (error) {
      console.error("Fetch book error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.slug.trim()) newErrors.slug = "Slug is required";
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      newErrors.slug = "Slug must be lowercase letters, numbers, and hyphens only";
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (!(["en", "hi", "mr"] as const).includes(form.language as "en" | "hi" | "mr")) {
      newErrors.language = "Choose English (en), Hindi (hi), or Marathi (mr)";
    }
    if (
      form.cover_asset_path &&
      (form.cover_asset_path.startsWith("/") ||
        form.cover_asset_path.includes("\\") ||
        form.cover_asset_path.includes("://") ||
        form.cover_asset_path.includes(".."))
    ) {
      newErrors.cover_asset_path = "Cover path must be a relative path (no /, \\, ://, or ..)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate() || !id) return;
    setSaving(true);
    const client = getSupabase();
    if (!client) {
      setSaving(false);
      return;
    }

    try {
      const { error } = await client
        .from("books")
        .update({
          slug: form.slug.trim(),
          title: form.title.trim(),
          author: form.author.trim() || null,
          description: form.description.trim() || null,
          language: form.language || "en",
          cover_asset_path: form.cover_asset_path.trim() || null,
          status: form.status,
        })
        .eq("id", id);

      if (error) {
        if (error.code === "23505") {
          setErrors({ slug: "A book with this slug already exists" });
        } else {
          setErrors({ form: error.message });
        }
        setSaving(false);
        return;
      }

      await client.from("admin_audit_log").insert({
        admin_user_id: (await client.auth.getUser()).data.user?.id,
        action: "update",
        resource_type: "book",
        resource_id: id,
        metadata: { slug: form.slug, title: form.title },
      });

      Alert.alert("Saved", "Book updated successfully");
      fetchBook();
    } catch (error) {
      console.error("Update book error:", error);
      setErrors({ form: "Failed to update book" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Book",
      "This will permanently delete the book and all its versions. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const client = getSupabase();
            if (!client || !id) return;
            try {
              await client.from("books").delete().eq("id", id);
              await client.from("admin_audit_log").insert({
                admin_user_id: (await client.auth.getUser()).data.user?.id,
                action: "delete",
                resource_type: "book",
                resource_id: id,
                metadata: { slug: book?.slug, title: book?.title },
              });
              router.push("/books" as any);
            } catch (error) {
              console.error("Delete book error:", error);
              Alert.alert("Error", "Failed to delete book");
            }
          },
        },
      ],
    );
  };

  const handleNewVersion = () => {
    router.push(`/books/${id}/versions/new` as any);
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading book…</Text>
        </View>
      </Screen>
    );
  }

  if (!book) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Book not found</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Back"
          >
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={styles.headerContent}>
            <Eyebrow>Book People Admin</Eyebrow>
            <Title>{book.title}</Title>
            <Body>
              {book.slug} • {book.author || "Unknown author"}
            </Body>
          </View>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.statusBadge}>
            <Badge
              tone={
                book.status === "published" ? "moss" : book.status === "ready" ? "gold" : "default"
              }
            >
              {book.status}
            </Badge>
          </View>
          <AppButton onPress={handleNewVersion} variant="primary">
            + New Version
          </AppButton>
        </View>

        <Card style={styles.formCard}>
          <Eyebrow style={styles.sectionTitle}>Edit Book</Eyebrow>
          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Slug *</Text>
              <TextInput
                style={[styles.input, errors.slug && styles.inputError]}
                value={form.slug}
                onChangeText={(v) => setForm({ ...form, slug: v.toLowerCase() })}
                autoCapitalize="none"
                autoComplete="off"
                editable={!saving}
              />
              {errors.slug && <Text style={styles.fieldError}>{errors.slug}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={form.title}
                onChangeText={(v) => setForm({ ...form, title: v })}
                editable={!saving}
              />
              {errors.title && <Text style={styles.fieldError}>{errors.title}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Author</Text>
              <TextInput
                style={styles.input}
                value={form.author}
                onChangeText={(v) => setForm({ ...form, author: v })}
                editable={!saving}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Language</Text>
              <TextInput
                style={styles.input}
                value={form.language}
                onChangeText={(v) => setForm({ ...form, language: v.toLowerCase() })}
                editable={!saving}
              />
              {errors.language && <Text style={styles.fieldError}>{errors.language}</Text>}
              <Caption>Content language: en for English, hi for Hindi, or mr for Marathi.</Caption>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                multiline
                numberOfLines={4}
                editable={!saving}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cover Asset Path</Text>
              <TextInput
                style={[styles.input, errors.cover_asset_path && styles.inputError]}
                value={form.cover_asset_path}
                onChangeText={(v) => setForm({ ...form, cover_asset_path: v })}
                autoCapitalize="none"
                editable={!saving}
              />
              {errors.cover_asset_path && (
                <Text style={styles.fieldError}>{errors.cover_asset_path}</Text>
              )}
              <Caption>Relative path (e.g., cover.webp). No absolute paths or URLs.</Caption>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Publication status</Text>
              <Badge
                tone={
                  form.status === "published"
                    ? "moss"
                    : form.status === "ready"
                      ? "gold"
                      : "default"
                }
              >
                {form.status}
              </Badge>
              <Caption>
                Publication status is changed only by secure version validation, publish, and
                unpublish actions.
              </Caption>
            </View>
          </View>
          <View style={styles.formActions}>
            <AppButton onPress={handleSave} disabled={saving} variant="primary">
              {saving ? "Saving…" : "Save Changes"}
            </AppButton>
          </View>
        </Card>

        <Card style={styles.versionsCard}>
          <View style={styles.sectionHeader}>
            <Eyebrow style={styles.sectionTitle}>Versions</Eyebrow>
            {versions.length > 0 && <Caption>{versions.length} version(s)</Caption>}
          </View>

          {versions.length === 0 ? (
            <View style={styles.emptyVersions}>
              <Text style={styles.emptyText}>No versions yet.</Text>
              <Caption>Create a version to add content and assets.</Caption>
              <AppButton
                onPress={handleNewVersion}
                variant="primary"
                style={[styles.emptyButton, { marginTop: space.md }]}
              >
                Create First Version
              </AppButton>
            </View>
          ) : (
            <View style={styles.versionList}>
              {versions.map((version) => (
                <Pressable
                  key={version.id}
                  onPress={() => router.push(`/books/${id}/versions/${version.id}` as any)}
                  style={({ pressed }) => [styles.versionRow, pressed && styles.versionRowPressed]}
                >
                  <View style={styles.versionInfo}>
                    <View style={styles.versionTitleRow}>
                      <Text style={styles.versionLabel}>v{version.version_label}</Text>
                      <Badge
                        tone={
                          version.publication_status === "published"
                            ? "moss"
                            : version.validation_status === "validated"
                              ? "gold"
                              : version.validation_status === "validating"
                                ? "warning"
                                : "default"
                        }
                      >
                        {version.validation_status}
                        {version.publication_status === "published" && " • Published"}
                      </Badge>
                    </View>
                    <Text style={styles.versionMeta}>
                      {version.manifest_sha256
                        ? `SHA: ${version.manifest_sha256.slice(0, 12)}…`
                        : "No manifest"}
                      • Created {new Date(version.created_at).toLocaleDateString()}
                      {version.published_at &&
                        ` • Published ${new Date(version.published_at).toLocaleDateString()}`}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>→</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Card>

        <Card style={styles.preparationCard}>
          <Eyebrow style={styles.sectionTitle}>Local preparation workflow</Eyebrow>
          <Body>
            Prepare a rights-cleared PDF on your computer, review every people count, then create a
            version and use Upload Assets.
          </Body>
          <Caption>
            A book stays unavailable to players until its version passes hosted validation and is
            published through secure publishing.
          </Caption>
        </Card>

        <Card style={styles.dangerCard}>
          <Eyebrow style={{ color: palette.danger }}>Danger Zone</Eyebrow>
          <Body>These actions are irreversible.</Body>
          <AppButton
            variant="danger"
            onPress={handleDelete}
            style={[styles.deleteButton, { marginTop: space.md }]}
          >
            Delete Book Permanently
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
  formCard: {
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
  form: {
    gap: space.lg,
  },
  field: {
    gap: space.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.ink,
  },
  input: {
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.small,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 16,
    color: palette.ink,
    minHeight: 44,
  },
  inputError: {
    borderColor: palette.danger,
  },
  fieldError: {
    fontSize: 12,
    color: palette.danger,
    fontWeight: "500",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  statusButtons: {
    flexDirection: "row",
    gap: space.sm,
    flexWrap: "wrap",
  },
  statusButton: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.paper,
  },
  statusButtonActive: {
    borderWidth: 2,
    backgroundColor: palette.accentLight,
    borderColor: palette.accent,
  },
  statusButtonPressed: {
    opacity: 0.8,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.ink,
  },
  statusButtonTextActive: {
    color: palette.accentDark,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  versionsCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  preparationCard: {
    padding: space.lg,
    marginBottom: space.md,
    gap: space.sm,
  },
  emptyVersions: {
    alignItems: "center",
    padding: space.xl,
    gap: space.md,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.ink,
  },
  emptyButton: {
    minWidth: 200,
  },
  versionList: {
    gap: space.sm,
  },
  versionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: space.md,
    backgroundColor: palette.paper,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: palette.border,
  },
  versionRowPressed: {
    backgroundColor: palette.accentLight,
  },
  versionInfo: {
    flex: 1,
    gap: space.xxs,
  },
  versionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    flexWrap: "wrap",
  },
  versionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.ink,
    fontFamily: "serif",
  },
  versionMeta: {
    fontSize: 12,
    color: palette.muted,
  },
  chevron: {
    fontSize: 20,
    color: palette.muted,
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
