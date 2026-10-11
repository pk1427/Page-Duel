import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { eligibleSpreads } from "@book-people/game-core";
import { toPlayableBook } from "@book-people/book-data";
import { BookCover } from "../cover-image";
import { useGame } from "../game-store";
import { Badge, Body, Caption, Card, Eyebrow, Screen, Title, palette, radius, space } from "../ui";

export default function BooksScreen() {
  const { playableBooks, selectBook, error } = useGame();
  return (
    <Screen>
      <View style={styles.heading}>
        <Eyebrow>Your library</Eyebrow>
        <Title>Choose a book</Title>
        <Body>Pick a volume off the shelf. Every match stays inside one book.</Body>
      </View>
      <View style={styles.shelf}>
        {playableBooks.map((book, index) => (
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
              <BookCover book={book} style={styles.cover} />
              <View style={styles.rowCopy}>
                <Badge tone={index === 0 ? "accent" : "moss"}>
                  {index === 0 ? "Featured" : "Ready to play"}
                </Badge>
                <Text style={styles.bookTitle}>{book.title}</Text>
                {(book.author || book.year) && (
                  <Text style={styles.author}>
                    {[book.author, book.year].filter(Boolean).join(" · ")}
                  </Text>
                )}
                <Text style={styles.spreadCount}>
                  {eligibleSpreads(toPlayableBook(book)).length} playable spreads
                </Text>
                <Text style={styles.choose}>Open this book →</Text>
              </View>
            </Card>
          </Pressable>
        ))}
        <View style={styles.shelfBoard} />
      </View>
      <Caption>Three real volumes. More shelves arrive with future books.</Caption>
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
