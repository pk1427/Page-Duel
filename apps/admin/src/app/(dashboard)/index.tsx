import { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl } from "react-native";
import { router } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { Screen, Title, Eyebrow, Body, Caption, Card, Badge, AppButton, palette, space, radius } from "@/components/ui";
import { StyleSheet, Pressable } from "react-native";
import type { AdminBook } from "@/types";

export default function DashboardScreen() {
  const [stats, setStats] = useState<{
    totalBooks: number;
    publishedBooks: number;
    draftBooks: number;
    totalVersions: number;
    publishedVersions: number;
  } | null>(null);
  const [recentBooks, setRecentBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const client = getSupabase();
    if (!client) return;

    try {
      const [booksResult, versionsResult] = await Promise.all([
        client.from("books").select("id, status, created_at, title, slug, author, cover_asset_path, updated_at"),
        client.from("book_versions").select("id, book_id, publication_status, created_at"),
      ]);

      if (booksResult.data && versionsResult.data) {
        const books = booksResult.data as AdminBook[];
        const versions = versionsResult.data as Array<{ id: string; book_id: string; publication_status: string; created_at: string }>;

        setStats({
          totalBooks: books.length,
          publishedBooks: books.filter((b) => b.status === "published").length,
          draftBooks: books.filter((b) => b.status === "draft").length,
          totalVersions: versions.length,
          publishedVersions: versions.filter((v) => v.publication_status === "published").length,
        });

        const recent = [...books].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 5);
        setRecentBooks(recent);
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading dashboard…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.header}>
          <Eyebrow>Book People</Eyebrow>
          <Title>Admin Dashboard</Title>
          <Body>Manage your book catalog and publishing workflow.</Body>
        </View>

        <View style={styles.statsGrid}>
          <Card style={styles.statCard}>
            <Caption>Total Books</Caption>
            <Text style={styles.statValue}>{stats?.totalBooks ?? 0}</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCardPublished]}>
            <Caption>Published Books</Caption>
            <Text style={styles.statValue}>{stats?.publishedBooks ?? 0}</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCardDraft]}>
            <Caption>Draft Books</Caption>
            <Text style={styles.statValue}>{stats?.draftBooks ?? 0}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Caption>Total Versions</Caption>
            <Text style={styles.statValue}>{stats?.totalVersions ?? 0}</Text>
          </Card>
          <Card style={[styles.statCard, styles.statCardPublished]}>
            <Caption>Published Versions</Caption>
            <Text style={styles.statValue}>{stats?.publishedVersions ?? 0}</Text>
          </Card>
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <Eyebrow>Recent Books</Eyebrow>
            <Title>Latest Updates</Title>
          </View>
          <AppButton variant="secondary" onPress={() => router.push("/books" as any)}>
            View All
          </AppButton>
        </View>

        {recentBooks.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No books yet.</Text>
            <Caption>Create your first book to get started.</Caption>
            <AppButton onPress={() => router.push("/books/new" as any)} style={[styles.emptyButton, { marginTop: space.md }]}>
              Create Book
            </AppButton>
          </Card>
        ) : (
          <View style={styles.bookList}>
            {recentBooks.map((book) => (
              <Pressable
                key={book.id}
                onPress={() => router.push(`/books/${book.id}` as any)}
                style={({ pressed }) => [styles.bookRow, pressed && styles.bookRowPressed]}
              >
                <View style={styles.bookCover}>
                  {book.cover_asset_path ? (
                    <Text style={styles.coverPlaceholder}>📖</Text>
                  ) : (
                    <Text style={styles.coverPlaceholder}>📄</Text>
                  )}
                </View>
                <View style={styles.bookInfo}>
                  <Text style={styles.bookTitle}>{book.title}</Text>
                  <Text style={styles.bookMeta}>{book.author || "Unknown author"} • {book.slug}</Text>
                  <View style={styles.bookBadges}>
                    <Badge tone={book.status === "published" ? "moss" : book.status === "ready" ? "gold" : "default"}>
                      {book.status}
                    </Badge>
                  </View>
                </View>
                <Text style={styles.chevron}>→</Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <Eyebrow>Quick Actions</Eyebrow>
          <View style={styles.actionGrid}>
            <Pressable onPress={() => router.push("/books/new" as any)} style={styles.actionCard}>
              <Text style={styles.actionIcon}>➕</Text>
              <Text style={styles.actionLabel}>New Book</Text>
              <Caption>Add a new book to the catalog</Caption>
            </Pressable>
            <Pressable onPress={() => router.push("/books" as any)} style={styles.actionCard}>
              <Text style={styles.actionIcon}>📚</Text>
              <Text style={styles.actionLabel}>Manage Books</Text>
              <Caption>View and edit all books</Caption>
            </Pressable>
            <Pressable onPress={() => router.push("/audit" as any)} style={styles.actionCard}>
              <Text style={styles.actionIcon}>📋</Text>
              <Text style={styles.actionLabel}>Audit Log</Text>
              <Caption>Review admin activity</Caption>
            </Pressable>
          </View>
        </View>
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
    gap: space.xs,
    marginBottom: space.lg,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
    marginBottom: space.xl,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: space.lg,
    alignItems: "center",
    gap: space.xs,
  },
  statCardPublished: {
    borderColor: palette.moss,
    borderWidth: 2,
  },
  statCardDraft: {
    borderColor: palette.warning,
    borderWidth: 2,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "800",
    color: palette.ink,
    fontFamily: "serif",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: space.md,
  },
  sectionHeaderLeft: {
    gap: space.xs,
  },
  emptyCard: {
    alignItems: "center",
    padding: space.xl,
    gap: space.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.ink,
  },
  emptyButton: {
    minWidth: 160,
  },
  bookList: {
    gap: space.sm,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    padding: space.md,
    backgroundColor: palette.card,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: palette.border,
  },
  bookRowPressed: {
    backgroundColor: palette.accentLight,
  },
  bookCover: {
    width: 60,
    height: 84,
    borderRadius: radius.small,
    backgroundColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
  },
  coverPlaceholder: {
    fontSize: 24,
  },
  bookInfo: {
    flex: 1,
    gap: space.xxs,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.ink,
    fontFamily: "serif",
  },
  bookMeta: {
    fontSize: 13,
    color: palette.muted,
  },
  bookBadges: {
    flexDirection: "row",
    gap: space.xs,
    marginTop: space.xxs,
  },
  chevron: {
    fontSize: 20,
    color: palette.muted,
  },
  quickActions: {
    marginTop: space.xl,
    gap: space.md,
  },
  actionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.md,
  },
  actionCard: {
    flex: 1,
    minWidth: 150,
    maxWidth: "48%",
    padding: space.lg,
    alignItems: "center",
    gap: space.sm,
    backgroundColor: palette.card,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: palette.border,
  },
  actionIcon: {
    fontSize: 28,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.ink,
  },
});
