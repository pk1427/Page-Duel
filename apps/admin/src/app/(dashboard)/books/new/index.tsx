import { useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { router } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { useAdminSession } from "@/lib/admin-session";
import { Screen, Title, Eyebrow, Body, Caption, Card, Badge, AppButton, palette, space, radius } from "@/components/ui";
import { StyleSheet } from "react-native";

export default function NewBookScreen() {
  const { userEmail } = useAdminSession();
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.slug.trim()) newErrors.slug = "Slug is required";
    else if (!/^[a-z0-9-]+$/.test(form.slug)) newErrors.slug = "Slug must be lowercase letters, numbers, and hyphens only";
    if (!form.title.trim()) newErrors.title = "Title is required";
    if (form.cover_asset_path && (form.cover_asset_path.startsWith("/") || form.cover_asset_path.includes("\\") || form.cover_asset_path.includes("://") || form.cover_asset_path.includes(".."))) {
      newErrors.cover_asset_path = "Cover path must be a relative path (no /, \\, ://, or ..)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return;
    }

    try {
      const { error } = await client.from("books").insert({
        slug: form.slug.trim(),
        title: form.title.trim(),
        author: form.author.trim() || null,
        description: form.description.trim() || null,
        language: form.language || "en",
        cover_asset_path: form.cover_asset_path.trim() || null,
        status: form.status,
      });

      if (error) {
        if (error.code === "23505") {
          setErrors({ slug: "A book with this slug already exists" });
        } else {
          setErrors({ form: error.message });
        }
        setLoading(false);
        return;
      }

      // Audit log
      await client.from("admin_audit_log").insert({
        admin_user_id: (await client.auth.getUser()).data.user?.id,
        action: "create",
        resource_type: "book",
        resource_id: (await client.from("books").select("id").eq("slug", form.slug.trim()).single()).data?.id,
        metadata: { slug: form.slug, title: form.title },
      });

      setSuccess(true);
      setTimeout(() => router.push("/admin/(dashboard)/books" as any), 1000);
    } catch (error) {
      console.error("Create book error:", error);
      setErrors({ form: "Failed to create book" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView>
        <View style={styles.header}>
          <Eyebrow>Book People Admin</Eyebrow>
          <Title>New Book</Title>
          <Body>Create a new book entry. Draft books are invisible to players.</Body>
        </View>

        {success && (
          <Card style={styles.successCard}>
            <Text style={styles.successText}>Book created successfully! Redirecting…</Text>
          </Card>
        )}

        {errors.form && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText} role="alert">{errors.form}</Text>
          </Card>
        )}

        <Card style={styles.formCard}>
          <View style={styles.form}>

            <View style={styles.field}>
              <Text style={styles.label}>Slug *</Text>
              <TextInput
                style={[styles.input, errors.slug && styles.inputError]}
                value={form.slug}
                onChangeText={(v) => setForm({ ...form, slug: v.toLowerCase() })}
                placeholder="alice-loc-1885"
                autoCapitalize="none"
                autoComplete="off"
                editable={!loading}
              />
              {errors.slug && <Text style={styles.fieldError}>{errors.slug}</Text>}
              <Caption>Unique identifier. Lowercase, numbers, hyphens only. Matches content JSON id.</Caption>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={[styles.input, errors.title && styles.inputError]}
                value={form.title}
                onChangeText={(v) => setForm({ ...form, title: v })}
                placeholder="Alice's Adventures in Wonderland"
                editable={!loading}
              />
              {errors.title && <Text style={styles.fieldError}>{errors.title}</Text>}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Author</Text>
              <TextInput
                style={styles.input}
                value={form.author}
                onChangeText={(v) => setForm({ ...form, author: v })}
                placeholder="Lewis Carroll"
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Language</Text>
              <TextInput
                style={styles.input}
                value={form.language}
                onChangeText={(v) => setForm({ ...form, language: v })}
                placeholder="en"
                editable={!loading}
              />
              <Caption>ISO 639-1 code (e.g., en, fr, de). Optional region: en-US</Caption>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={form.description}
                onChangeText={(v) => setForm({ ...form, description: v })}
                placeholder="A brief description of the book"
                multiline
                numberOfLines={4}
                editable={!loading}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Cover Asset Path</Text>
              <TextInput
                style={[styles.input, errors.cover_asset_path && styles.inputError]}
                value={form.cover_asset_path}
                onChangeText={(v) => setForm({ ...form, cover_asset_path: v })}
                placeholder="cover.webp"
                autoCapitalize="none"
                editable={!loading}
              />
              {errors.cover_asset_path && <Text style={styles.fieldError}>{errors.cover_asset_path}</Text>}
              <Caption>Relative path to cover image within the book's asset folder (e.g., cover.webp). No absolute paths or URLs.</Caption>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Status</Text>
              <View style={styles.statusButtons}>
                {(["draft", "ready", "published"] as const).map((s) => (
                  <Pressable
                    key={s}
                    onPress={() => setForm({ ...form, status: s })}
                    style={({ pressed }) => [
                      styles.statusButton,
                      form.status === s && styles.statusButtonActive,
                      pressed && styles.statusButtonPressed,
                    ]}
                  >
                    <Text style={[
                      styles.statusButtonText,
                      form.status === s && styles.statusButtonTextActive,
                      s === "published" && styles.statusPublished,
                      s === "ready" && styles.statusReady,
                      s === "draft" && styles.statusDraft,
                    ]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <Caption>Draft = invisible to players. Ready = validated but not published. Published = visible to players.</Caption>
            </View>

          </View>
        </Card>

        <View style={styles.actions}>
          <AppButton variant="secondary" onPress={() => router.back()} editable={!loading}>
            Cancel
          </AppButton>
          <AppButton onPress={handleSubmit} editable={!loading} variant="primary">
            {loading ? "Creating…" : "Create Book"}
          </AppButton>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space.xs,
    marginBottom: space.md,
  },
  successCard: {
    backgroundColor: palette.successLight,
    borderColor: palette.success,
    marginBottom: space.md,
  },
  successText: {
    color: palette.success,
    fontWeight: "600",
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
  statusPublished: {},
  statusReady: {},
  statusDraft: {},
  actions: {
    flexDirection: "row",
    gap: space.md,
    justifyContent: "flex-end",
    marginTop: space.lg,
    paddingHorizontal: space.md,
  },
});