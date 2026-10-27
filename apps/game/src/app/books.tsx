import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { eligibleSpreads } from "@book-people/game-core";
import { toPlayableBook } from "@book-people/book-data";
import { BookCover } from "../cover-image";
import { useGame } from "../game-store";
import { getPlayableBookContent } from "../catalog";
import type { CatalogBook } from "../catalog";
import { Badge, Body, Caption, Card, Eyebrow, Screen, Title, palette, radius, space } from "../ui";

import { RequireAuth } from "../require-auth";

export default function BooksScreen() {
  return (
    <RequireAuth>
      <BooksContent />
    </RequireAuth>
  );
}

function BooksContent() {
  const { playableBooks, selectBook, error, catalogLoading, catalogError } = useGame();
  return (
    <Screen>
      <View style={styles.heading}>
        <Eyebrow>Your library</Eyebrow>
        <Title>Choose a book</Title>
        <Body>Pick a volume off the shelf. Every match stays inside one book.</Body>
      </View>
      {catalogLoading ? (
        <Card style={styles.catalogState}>
          <Text style={styles.catalogStateText}>Loading your library…</Text>
        </Card>
      ) : catalogError ? (
        <Card style={styles.catalogState}>
          <Text accessibilityRole="alert" style={styles.error}>
            Your library is temporarily unavailable.
          </Text>
          <Caption>Check your connection and try again later.</Caption>
        </Card>
      ) : (
        <View style={styles.shelf}>
          {playableBooks.map((book: CatalogBook, index) => {
            const bookContent = getPlayableBookContent(book);
            return (
              <Pressable
                key={book.id}
                accessibilityLabel={`Choose ${book.title}`}
                accessibilityRole="button"
                onPress={() => {
                  selectBook(book.id);
                  router.push("/setup");
                }}
                style={({ pressed }) => [styles.pressableRow, pressed && styles.rowPressed]}
              >
                <Card style={[styles.row, index === 0 && styles.featuredRow]}>
                  <View style={styles.spineEdge} />
                  {bookContent ? (
                    <BookCover book={bookContent} style={styles.cover} />
                  ) : (
                    <View style={[styles.cover, styles.coverFallback]} />
                  )}
                  <View style={styles.rowCopy}>
                    <Badge tone={index === 0 ? "accent" : "moss"}>
                      {index === 0 ? "Featured" : "Ready to play"}
                    </Badge>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    {book.author && <Text style={styles.author}>{book.author}</Text>}
                    {bookContent && (
                      <Text style={styles.spreadCount}>
                        {eligibleSpreads(toPlayableBook(bookContent)).length} playable spreads
                      </Text>
                    )}
                    <Text style={styles.choose}>Open this book →</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
          <View style={styles.shelfBoard} />
        </View>
      )}
      <Caption>Books from the catalog. More shelves arrive with future books.</Caption>
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 620 },
  catalogState: { gap: space.xs, minHeight: 120, justifyContent: "center" },
  catalogStateText: { color: palette.muted, fontSize: 16, fontWeight: "700", textAlign: "center" },
  shelf: { gap: space.sm },
  pressableRow: { width: "100%" },
  rowPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: space.sm,
    minHeight: 172,
    overflow: "hidden",
    padding: space.sm,
    paddingLeft: space.xs,
  },
  featuredRow: { borderColor: palette.gold, borderWidth: 2 },
  spineEdge: {
    alignSelf: "stretch",
    backgroundColor: palette.leather,
    borderRadius: radius.small,
    width: 8,
  },
  cover: { height: 148, width: 100 },
  coverFallback: { backgroundColor: palette.leatherDeep, borderRadius: radius.small },
  rowCopy: { flex: 1, flexShrink: 1, gap: space.xxs, justifyContent: "center" },
  bookTitle: {
    color: palette.ink,
    fontFamily: "serif",
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 28,
  },
  author: { color: palette.muted, fontSize: 15, fontStyle: "italic" },
  spreadCount: { color: palette.moss, fontSize: 14, fontWeight: "700" },
  choose: { color: palette.accentDark, fontSize: 16, fontWeight: "800", marginTop: space.xxs },
  shelfBoard: {
    backgroundColor: palette.leather,
    borderRadius: radius.small,
    height: 12,
    width: "100%",
  },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
});
