import { useState, useEffect } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TextInput, Alert, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { useAdminSession } from "@/lib/admin-session";
import { Screen, Title, Eyebrow, Body, Caption, Card, Badge, AppButton, palette, space, radius } from "@/components/ui";
import { StyleSheet } from "react-native";
import type { AdminBook } from "@/types";

export default function NewVersionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userEmail } = useAdminSession();
  const [book, setBook] = useState<AdminBook | null>(null);
  const [form, setForm] = useState({
    version_label: "",
    content_json: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchBook = async () => {
    const client = getSupabase();
    if (!client || !id) return;

    try {
      const { data } = await client.from("books").select("*").eq("id", id).single();
      if (data) setBook(data as AdminBook);
    } catch (error) {
      console.error("Fetch book error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBook();
  }, [id]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.version_label.trim()) newErrors.version_label = "Version label is required";
    else if (!/^[a-zA-Z0-9._-]+$/.test(form.version_label)) newErrors.version_label = "Version label must contain only letters, numbers, dots, underscores, and hyphens";

    if (form.content_json.trim()) {
      try {
        JSON.parse(form.content_json);
      } catch (e) {
        newErrors.content_json = "Invalid JSON";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !id) return;
    setSaving(true);
    const client = getSupabase();
    if (!client) { setSaving(false); return; }

    try {
      let contentJson = null;
      if (form.content_json.trim()) {
        contentJson = JSON.parse(form.content_json);
      }

      // Validate content if provided
      if (contentJson) {
        const { validateContentPack } = await import("@book-people/book-data");
        const validation = validateContentPack(contentJson);
        if (!validation.ok) {
          setErrors({ content_json: validation.errors.join("; ") });
          setSaving(false);
          return;
        }
      }

      const { error } = await client.from("book_versions").insert({
        book_id: id,
        version_label: form.version_label.trim(),
        manifest_sha256: null,
        content_json: contentJson,
        validation_status: contentJson ? "validated" : "unvalidated",
        publication_status: "unpublished",
      });

      if (error) {
        if (error.code === "23505") {
          setErrors({ version_label: "A version with this label already exists for this book" });
        } else {
          setErrors({ form: error.message });
        }
        setSaving(false);
        return;
      }

      await client.from("admin_audit_log").insert({
        admin_user_id: (await client.auth.getUser()).data.user?.id,
        action: "create",
        resource_type: "book_version",
        resource_id: (await client.from("book_versions").select("id").eq("book_id", id).eq("version_label", form.version_label.trim()).single()).data?.id,
        metadata: { book_id: id, version_label: form.version_label },
      });

      Alert.alert("Success", "Version created successfully");
      router.push(`/admin/(dashboard)/books/${id}` as any);
    } catch (error) {
      console.error("Create version error:", error);
      setErrors({ form: "Failed to create version" });
    } finally {
      setSaving(false);
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
          <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Back">
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
          <View style={styles.headerContent}>
            <Eyebrow>Book People Admin</Eyebrow>
            <Title>New Version</Title>
            <Body>{book.title} • {book.slug}</Body>
          </View>
        </View>

        {errors.form && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText} role="alert">{errors.form}</Text>
          </Card>
        )}

        <Card style={styles.formCard}>
          <View style={styles.form}>

            <View style={styles.field}>
              <Text style={styles.label}>Version Label *</Text>
              <TextInput
                style={[styles.input, errors.version_label && styles.inputError]}
                value={form.version_label}
                onChangeText={(v) => setForm({ ...form, version_label: v })}
                placeholder="1.0.0"
                autoCapitalize="none"
                autoComplete="off"
                editable={!saving}
              />
              {errors.version_label && <Text style={styles.fieldError}>{errors.version_label}</Text>}
              <Caption>Unique per book. Letters, numbers, dots, underscores, hyphens only.</Caption>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Content JSON (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, errors.content_json && styles.inputError]}
                value={form.content_json}
                onChangeText={(v) => setForm({ ...form, content_json: v })}
                placeholder='{"id": "book-slug", "title": "Book Title", "version": "1", "status": "ready", "coverImage": "cover.webp", "spreads": [...]}'
                multiline
                numberOfLines={15}
                editable={!saving}
              />
              {errors.content_json && <Text style={styles.fieldError}>{errors.content_json}</Text>}
              <Caption>Full book content manifest. Must match the book-data BookContent schema. Validation runs on save.</Caption>
            </View>

          </View>
          <View style={styles.formActions}>
            <AppButton variant="secondary" onPress={() => router.back()} disabled={saving}>
              Cancel
            </AppButton>
            <AppButton onPress={handleSubmit} disabled={saving} variant="primary">
              {saving ? "Creating…" : "Create Version"}
            </AppButton>
          </View>
        </Card>

        <Card style={styles.helpCard}>
          <Eyebrow>Content JSON Schema</Eyebrow>
          <Body>The content JSON must follow the BookContent structure:</Body>
          <Text style={styles.codeBlock}>
{`{
  "id": "book-slug",
  "title": "Book Title",
  "author": "Author Name",
  "description": "Optional description",
  "coverImage": "cover.webp",
  "version": "1",
  "status": "ready",
  "spreads": [
    {
      "id": "spread-001",
      "left": { "page": 1, "image": "pages/p001.webp", "people": 3 },
      "right": { "page": 2, "image": "pages/p002.webp", "people": 1 },
      "flags": []
    }
  ]
}`}
          </Text>
          <Caption>All image paths must be relative. Use the prepared book workflow for automatic asset upload and manifest generation.</Caption>
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
  errorCard: {
    backgroundColor: palette.dangerLight,
    borderColor: palette.danger,
    marginBottom: space.md,
  },
  errorText: {
    color: palette.danger,
    fontWeight: "600",
  },
  formCard: {
    padding: space.lg,
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
    minHeight: 200,
    textAlignVertical: "top",
    fontFamily: "monospace",
    fontSize: 13,
    lineHeight: 20,
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: palette.border,
  },
  helpCard: {
    padding: space.lg,
  },
  codeBlock: {
    backgroundColor: palette.ink,
    color: palette.paper,
    fontFamily: "monospace",
    fontSize: 12,
    lineHeight: 18,
    padding: space.md,
    borderRadius: radius.small,
    marginTop: space.sm,
    marginBottom: space.sm,
  },
});