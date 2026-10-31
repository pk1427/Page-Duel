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
import { copy } from "../copy";

export default function BooksScreen() {
  return (
    <RequireAuth>
      <BooksContent />
    </RequireAuth>
  );
}

function BooksContent() {
  const {
    playableBooks,
    selectBook,
    error,
    catalogLoading,
    catalogError,
    bookshelfLanguage,
    setBookshelfLanguage,
  } = useGame();
  const filters = [
    { value: "en" as const, label: copy.language.english },
    { value: "hi" as const, label: copy.language.hindi },
    { value: "mr" as const, label: copy.language.marathi },
    { value: "all" as const, label: copy.language.allBooks },
  ];
  return (
    <Screen>
      <View style={styles.heading}>
        <Eyebrow>{copy.books.eyebrow}</Eyebrow>
        <Title>{copy.actions.chooseBook}</Title>
        <Body>{copy.books.detail}</Body>
      </View>
      <View accessibilityRole="radiogroup" style={styles.filters}>
        {filters.map((filter) => {
          const selected = bookshelfLanguage === filter.value;
          return (
            <Pressable
              key={filter.value}
              accessibilityLabel={filter.label}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setBookshelfLanguage(filter.value)}
              style={[styles.filter, selected && styles.filterSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {catalogLoading ? (
        <Card style={styles.catalogState}>
          <Text style={styles.catalogStateText}>{copy.books.loading}</Text>
        </Card>
      ) : catalogError ? (
        <Card style={styles.catalogState}>
          <Text accessibilityRole="alert" style={styles.error}>
            {copy.errors.catalogUnavailable}
          </Text>
          <Caption>{copy.books.retryWhenOnline}</Caption>
        </Card>
      ) : (
        playableBooks.length === 0 ? (
          <Card style={styles.catalogState}>
            <Text style={styles.catalogStateText}>{copy.language.noBooksTitle}</Text>
            <Caption>{copy.language.noBooksDetail}</Caption>
            {bookshelfLanguage !== "all" && (
              <Pressable accessibilityRole="button" onPress={() => setBookshelfLanguage("all")}>
                <Text style={styles.choose}>{copy.language.allBooks}</Text>
              </Pressable>
            )}
          </Card>
        ) : <View style={styles.shelf}>
          {playableBooks.map((book: CatalogBook, index) => {
            const bookContent = getPlayableBookContent(book);
            return (
              <Pressable
                key={book.id}
                accessibilityLabel={copy.books.chooseLabel(book.title)}
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
                      {index === 0 ? copy.books.featured : copy.books.ready}
                    </Badge>
                    <Text style={styles.bookTitle}>{book.title}</Text>
                    {book.author && <Text style={styles.author}>{book.author}</Text>}
                    {bookContent && (
                      <Text style={styles.spreadCount}>
                        {copy.books.spreadsReady(eligibleSpreads(toPlayableBook(bookContent)).length)}
                      </Text>
                    )}
                    <Text style={styles.choose}>{copy.books.choose}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
          <View style={styles.shelfBoard} />
        </View>
      )}
      <Caption>{copy.books.publishedOnly}</Caption>
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
  shelf: { flexDirection: "row", flexWrap: "wrap", gap: space[300], justifyContent: "center" },
  pressableRow: { flexBasis: 260, flexGrow: 1, maxWidth: 340 },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: space.xxs },
  filter: { borderColor: palette.line, borderRadius: radius.round, borderWidth: 1, paddingHorizontal: space.sm, paddingVertical: 8 },
  filterSelected: { backgroundColor: palette.ink, borderColor: palette.ink },
  filterText: { color: palette.ink, fontSize: 14, fontWeight: "700" },
  filterTextSelected: { color: palette.paper },
  rowPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
  row: {
    alignItems: "stretch",
    flexDirection: "column",
    gap: space[100],
    minHeight: 360,
    overflow: "hidden",
    padding: space[200],
  },
  featuredRow: { borderColor: palette.gold, borderWidth: 2 },
  spineEdge: {
    alignSelf: "auto",
    backgroundColor: palette.leather,
    borderRadius: radius.small,
    height: 8,
    width: "100%",
  },
  cover: { alignSelf: "center", height: 210, maxWidth: "100%", width: 142 },
  coverFallback: { backgroundColor: palette.leatherDeep, borderRadius: radius.small },
  rowCopy: { flex: 1, gap: space.xxs, justifyContent: "center" },
  bookTitle: {
    color: palette.ink,
    fontFamily: "serif",
    fontSize: 22,
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
