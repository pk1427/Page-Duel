import { useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, Pressable } from "react-native";
import { router } from "expo-router";
import { getSupabase } from "@/lib/supabase";
import { Screen, Title, Eyebrow, Body, Caption, Card, Badge, AppButton, palette, space, radius } from "@/components/ui";
import { StyleSheet } from "react-native";
import type { AdminBook } from "@/types";

export default function BooksListScreen() {
  const [books, setBooks] = useState<AdminBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBooks = async () => {
    const client = getSupabase();
    if (!client) return;

    try {
      const { data, error } = await client
        .from("books")
        .select(`
          id, slug, title, author, description, language, cover_asset_path, status, created_at, updated_at,
          book_versions!left (id, version_label, validation_status, publication_status, created_at)
        `)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      const mapped: AdminBook[] = (data || []).map((row: any) => ({
        ...row,
        version_count: row.book_versions?.length ?? 0,
        latest_version: row.book_versions?.[0] ? {
          id: row.book_versions[0].id,
          book_id: row.id,
          version_label: row.book_versions[0].version_label,
          manifest_sha256: null,
          content_json: null,
          validation_status: row.book_versions[0].validation_status,
          publication_status: row.book_versions[0].publication_status,
          published_at: null,
          created_at: row.book_versions[0].created_at,
        } : undefined,
      }));
      setBooks(mapped);
    } catch (error) {
      console.error("Books fetch error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBooks();
  };

  const handleNewBook = () => {
    router.push("/books/new" as any);
  };

  if (loading) {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Loading books…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View style={styles.header}>
          <Eyebrow>Book People Admin</Eyebrow>
          <Title>Books</Title>
          <Body>Manage your book catalog. Draft books are invisible to players.</Body>
        </View>

        <View style={styles.toolbar}>
          <AppButton onPress={handleNewBook} variant="primary">
            + New Book
          </AppButton>
        </View>

        {books.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyText}>No books yet.</Text>
            <Caption>Create your first book to get started.</Caption>
            <AppButton onPress={handleNewBook} style={[styles.emptyButton, { marginTop: space.md }]}>
              Create Book
            </AppButton>
          </Card>
        ) : (
          <View style={styles.bookList}>
            {books.map((book) => (
              <Pressable
                key={book.id}
                onPress={() => router.push(`/books/${book.id}` as any)}
                style={({ pressed }) => [styles.bookRow, pressed && styles.bookRowPressed]}
              >
                <View style={styles.bookCover}>
                  <Text style={styles.coverPlaceholder}>📖</Text>
                </View>
                <View style={styles.bookInfo}>
                  <View style={styles.bookTitleRow}>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    <Badge tone={book.status === "published" ? "moss" : book.status === "ready" ? "gold" : "default"}>
                      {book.status}
                    </Badge>
                  </View>
                  <Text style={styles.bookMeta}>{book.author || "Unknown author"} • {book.slug}</Text>
                  <Text style={styles.bookMeta}>{book.version_count} version(s)</Text>
                  <View style={styles.bookBadges}>
                    {book.latest_version && (
                      <Badge tone={
                        book.latest_version.publication_status === "published" ? "moss" :
                        book.latest_version.validation_status === "validated" ? "gold" : "default"
                      }>
                        v{book.latest_version.version_label}: {book.latest_version.validation_status}
                        {book.latest_version.publication_status === "published" ? " • Published" : ""}
                      </Badge>
                    )}
                  </View>
                </View>
                <Text style={styles.chevron}>→</Text>
              </Pressable>
            ))}
          </View>
        )}
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
    marginBottom: space.md,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: space.md,
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
  bookTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
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
    flexWrap: "wrap",
  },
  chevron: {
    fontSize: 20,
    color: palette.muted,
  },
});
