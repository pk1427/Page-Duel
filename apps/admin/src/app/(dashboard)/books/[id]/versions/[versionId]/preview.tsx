import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, StyleSheet, Pressable } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { Screen, Title, Eyebrow, Body, Caption, Card, Badge, palette, space, radius } from "@/components/ui";
import type { AdminBookVersion } from "@/types";
import { resolvePageAsset, type BookContent } from "@book-people/book-data";

export default function VersionPreviewScreen() {
  const { id, versionId } = useLocalSearchParams<{ id: string; versionId: string }>();
  const [version, setVersion] = useState<AdminBookVersion | null>(null);
  const [book, setBook] = useState<{ id: string; slug: string; title: string; cover_asset_path: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [assetBaseUrl, setAssetBaseUrl] = useState("");

  const fetchData = async () => {
    const client = getSupabase();
    if (!client || !id || !versionId) return;

    try {
      const [versionResult, bookResult] = await Promise.all([
        client.from("book_versions").select("*").eq("id", versionId).single(),
        client.from("books").select("id, slug, title, cover_asset_path").eq("id", id).single(),
      ]);

      if (versionResult.data) setVersion(versionResult.data as AdminBookVersion);
      if (bookResult.data) setBook(bookResult.data as any);

      // Determine asset base URL from env
      const envBase = process.env.EXPO_PUBLIC_BOOK_ASSET_BASE_URL;
      const bookSlugUpper = bookResult.data?.slug?.replace(/-/g, "_").toUpperCase();
      const perBookEnv = bookSlugUpper ? process.env[`EXPO_PUBLIC_BOOK_ASSET_BASE_URL_${bookSlugUpper}`] : null;
      setAssetBaseUrl(perBookEnv || envBase || "");
    } catch (error) {
      console.error("Fetch preview error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/set-state-in-effect
  }, [id, versionId]);

  const getImageUrl = (relativePath: string) => {
    if (!relativePath || relativePath.startsWith("placeholder:")) return null;
    if (assetBaseUrl) {
      return `${assetBaseUrl.replace(/\/+$/, "")}/${relativePath.replace(/^\/+/, "")}`;
    }
    return null;
  };

  const renderSpreads = () => {
    if (!version?.content_json) return null;
    const content = version.content_json as unknown as BookContent;
    const spreads = content.spreads || [];
    return spreads.slice(0, 6).map((spread, index) => (
      <View key={spread.id} style={styles.spread}>
        <Text style={styles.spreadLabel}>Spread {index + 1}: {spread.id}</Text>
        <View style={styles.spreadPages}>
          {["left", "right"].map((side) => {
            const page = spread[side as "left" | "right"];
            const imageUrl = getImageUrl(page.image);
            return (
              <View key={side} style={styles.page}>
                <Text style={styles.pageLabel}>{side} p.{page.page}</Text>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.pageImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={[styles.pageImage, styles.pagePlaceholder]}>
                    <Text style={styles.placeholderText}>{page.image || "no image"}</Text>
                  </View>
                )}
                <Text style={styles.peopleCount}>People: {page.people ?? "?"}</Text>
              </View>
            );
          })}
        </View>
      </View>
    ));
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading preview…</Text>
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

  const content = version.content_json as unknown as BookContent | null;
  const coverUrl = book.cover_asset_path ? getImageUrl(book.cover_asset_path) : null;

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
            <Body>Preview • Version {version.version_label} • {version.validation_status}</Body>
          </View>
        </View>

        <Card style={styles.coverCard}>
          <Eyebrow style={styles.sectionTitle}>Cover</Eyebrow>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} resizeMode="contain" />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]}>
              <Text style={styles.placeholderText}>No cover image</Text>
            </View>
          )}
          <Caption>Asset: {book.cover_asset_path || "none"}</Caption>
          {assetBaseUrl && (
            <Caption style={styles.urlCaption}>Base URL: {assetBaseUrl}</Caption>
          )}
        </Card>

        {content && (
          <Card style={styles.metaCard}>
            <Eyebrow style={styles.sectionTitle}>Metadata</Eyebrow>
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Caption>Book ID</Caption>
                <Text style={styles.metaValue}>{content.id}</Text>
              </View>
              <View style={styles.metaItem}>
                <Caption>Version</Caption>
                <Text style={styles.metaValue}>{content.version}</Text>
              </View>
              <View style={styles.metaItem}>
                <Caption>Status</Caption>
                <Text style={styles.metaValue}>{content.status}</Text>
              </View>
              <View style={styles.metaItem}>
                <Caption>Spreads</Caption>
                <Text style={styles.metaValue}>{content.spreads?.length || 0}</Text>
              </View>
              <View style={styles.metaItem}>
                <Caption>Author</Caption>
                <Text style={styles.metaValue}>{content.author || "Unknown"}</Text>
              </View>
              <View style={styles.metaItem}>
                <Caption>Validation</Caption>
                <Badge tone={version.validation_status === "validated" ? "moss" : "default"}>
                  {version.validation_status}
                </Badge>
              </View>
              <View style={styles.metaItem}>
                <Caption>Publication</Caption>
                <Badge tone={version.publication_status === "published" ? "moss" : "default"}>
                  {version.publication_status}
                </Badge>
              </View>
              <View style={styles.metaItem}>
                <Caption>Manifest SHA</Caption>
                <Text style={[styles.metaValue, styles.mono]}>
                  {version.manifest_sha256?.slice(0, 16) || "none"}…
                </Text>
              </View>
            </View>
          </Card>
        )}

        <Card style={styles.spreadsCard}>
          <Eyebrow style={styles.sectionTitle}>Spreads (first 6)</Eyebrow>
          {renderSpreads()}
          {content && content.spreads && content.spreads.length > 6 && (
            <Caption style={styles.moreCaption}>… and {content.spreads.length - 6} more spreads</Caption>
          )}
        </Card>

        <Card style={styles.validationCard}>
          <Eyebrow style={styles.sectionTitle}>Validation Status</Eyebrow>
          <Badge tone={version.validation_status === "validated" ? "moss" : version.validation_status === "validating" ? "warning" : "default"} style={styles.largeBadge}>
            {version.validation_status}
          </Badge>
          <Caption style={styles.validationCaption}>
            {version.validation_status === "validated"
              ? "This version has passed validation and can be published."
              : version.validation_status === "validating"
              ? "Validation in progress…"
              : "This version has not been validated. Run validation before publishing."}
          </Caption>
        </Card>

        <Card style={styles.publicationCard}>
          <Eyebrow style={styles.sectionTitle}>Publication Status</Eyebrow>
          <Badge tone={version.publication_status === "published" ? "moss" : "default"} style={styles.largeBadge}>
            {version.publication_status}
          </Badge>
          <Caption style={styles.publicationCaption}>
            {version.publication_status === "published"
              ? `Published on ${version.published_at ? new Date(version.published_at).toLocaleString() : "unknown date"}. Visible to players.`
              : "Not published. Players cannot see this version."}
          </Caption>
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
  coverCard: {
    padding: space.lg,
    marginBottom: space.md,
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: space.md,
    alignSelf: "flex-start",
  },
  coverImage: {
    width: "100%",
    maxWidth: 300,
    height: 400,
    borderRadius: radius.medium,
    backgroundColor: palette.border,
  },
  coverPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: palette.muted,
    fontSize: 14,
  },
  urlCaption: {
    fontFamily: "monospace",
    fontSize: 11,
    color: palette.muted,
    marginTop: space.xs,
  },
  metaCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  metaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.lg,
  },
  metaItem: {
    flex: 1,
    minWidth: 120,
    gap: space.xs,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.ink,
  },
  mono: {
    fontFamily: "monospace",
    fontSize: 12,
  },
  spreadsCard: {
    padding: space.lg,
    marginBottom: space.md,
  },
  spread: {
    marginBottom: space.lg,
    paddingBottom: space.lg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  spreadLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.ink,
    marginBottom: space.sm,
  },
  spreadPages: {
    flexDirection: "row",
    gap: space.md,
  },
  page: {
    flex: 1,
    gap: space.xs,
  },
  pageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
  },
  pageImage: {
    aspectRatio: 3/4,
    borderRadius: radius.small,
    backgroundColor: palette.border,
  },
  pagePlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  peopleCount: {
    fontSize: 12,
    color: palette.accent,
    fontWeight: "600",
  },
  moreCaption: {
    textAlign: "center",
    marginTop: space.md,
  },
  validationCard: {
    padding: space.lg,
    marginBottom: space.md,
    alignItems: "center",
  },
  publicationCard: {
    padding: space.lg,
    alignItems: "center",
  },
  largeBadge: {
    fontSize: 14,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.sm,
  },
  validationCaption: {
    textAlign: "center",
  },
  publicationCaption: {
    textAlign: "center",
  },
});