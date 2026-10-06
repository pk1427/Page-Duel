import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { eligibleSpreads } from "@book-people/game-core";
import { toPlayableBook } from "@book-people/book-data";
import { resolveContentAsset } from "../content-assets";
import { useGame } from "../game-store";
import { Badge, Body, Card, Eyebrow, Screen, Title, palette, radius, space } from "../ui";

export default function BooksScreen() {
  const { playableBooks, selectBook, error } = useGame();
  return (
    <Screen>
      <View style={styles.heading}>
        <Eyebrow>Your library</Eyebrow>
        <Title>Choose a book</Title>
        <Body>Every match stays inside one book, so every spread belongs to the same world.</Body>
      </View>
      <View style={styles.grid}>
        {playableBooks.map((book, index) => (
          <Pressable
            key={book.id}
            accessibilityLabel={`Choose ${book.title}`}
            onPress={() => {
              selectBook(book.id);
              router.push("/setup");
            }}
            style={({ pressed }) => [styles.pressableCard, pressed && styles.cardPressed]}
          >
            <Card style={[styles.card, index === 0 && styles.featuredCard]}>
              <View style={styles.cover}>
                {book.coverImage && !book.coverImage.startsWith("placeholder:") ? (
                  <Image
                    accessibilityLabel={`${book.title} cover`}
                    source={{ uri: resolveContentAsset(book, { image: book.coverImage }) }}
                    style={styles.coverImage}
                  />
                ) : (
                  <Text style={styles.coverText}>{book.title.slice(0, 1)}</Text>
                )}
              </View>
              <View style={styles.cardCopy}>
                <Badge tone={index === 0 ? "accent" : "moss"}>
                  {index === 0 ? "Featured" : "Ready to play"}
                </Badge>
                <Text style={styles.bookTitle}>{book.title}</Text>
                {book.author && <Text style={styles.author}>{book.author}</Text>}
                <Text style={styles.spreadCount}>
                  {eligibleSpreads(toPlayableBook(book)).length} playable spreads
                </Text>
                <Text style={styles.choose}>Open this book →</Text>
              </View>
            </Card>
          </Pressable>
        ))}
      </View>
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  pressableCard: { flexBasis: 330, flexGrow: 1, maxWidth: 540 },
  cardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  card: {
    alignItems: "stretch",
    flexDirection: "row",
    gap: space.sm,
    height: "100%",
    minHeight: 195,
    padding: space.sm,
  },
  featuredCard: { borderColor: "#D7A88E", borderWidth: 2 },
  cover: {
    alignItems: "center",
    backgroundColor: palette.plum,
    borderRadius: radius.small,
    height: 160,
    justifyContent: "center",
    overflow: "hidden",
    width: 108,
  },
  coverText: { color: palette.paper, fontFamily: "serif", fontSize: 44, fontWeight: "700" },
  coverImage: { height: "100%", resizeMode: "cover", width: "100%" },
  cardCopy: { flex: 1, gap: space.xxs, justifyContent: "center" },
  bookTitle: {
    color: palette.ink,
    fontFamily: "serif",
    fontSize: 25,
    fontWeight: "800",
    lineHeight: 29,
  },
  author: { color: palette.muted, fontSize: 15, fontStyle: "italic" },
  spreadCount: { color: palette.moss, fontSize: 14, fontWeight: "700", marginTop: space.xxs },
  choose: { color: palette.accentDark, fontSize: 15, fontWeight: "800", marginTop: space.xs },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
});
