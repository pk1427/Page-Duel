import { router } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { eligibleSpreads } from "@book-people/game-core";
import { toPlayableBook } from "@book-people/book-data";
import { resolveContentAsset } from "../content-assets";
import { useGame } from "../game-store";

export default function BooksScreen() {
  const { playableBooks, selectBook, error } = useGame();
  return (
    <View style={styles.page}>
      <Text style={styles.title}>Choose a book</Text>
      <Text style={styles.copy}>Each game uses spreads from one book only.</Text>
      {playableBooks.map((book) => (
        <Pressable
          key={book.id}
          accessibilityLabel={`Choose ${book.title}`}
          onPress={() => {
            selectBook(book.id);
            router.push("/setup");
          }}
          style={styles.card}
        >
          <View style={styles.cover}>
            {book.coverImage && !book.coverImage.startsWith("placeholder:") ? (
              <Image
                accessibilityLabel={`${book.title} cover`}
                source={{ uri: resolveContentAsset(book, { image: book.coverImage }) }}
                style={styles.coverImage}
              />
            ) : (
              <Text style={styles.coverText}>{book.coverImage ? "Book" : "No cover"}</Text>
            )}
          </View>
          <View style={styles.cardCopy}>
            <Text style={styles.bookTitle}>{book.title}</Text>
            {book.author && <Text>{book.author}</Text>}
            <Text>{eligibleSpreads(toPlayableBook(book)).length} playable spreads</Text>
          </View>
        </Pressable>
      ))}
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, gap: 14, padding: 24, backgroundColor: "#f8f2e6" },
  title: { fontSize: 32, fontWeight: "800", color: "#30251c" },
  copy: { fontSize: 17, color: "#594a3d" },
  card: {
    alignItems: "center",
    backgroundColor: "white",
    borderColor: "#8b7765",
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 14,
  },
  cover: {
    alignItems: "center",
    backgroundColor: "#e6a93c",
    borderRadius: 6,
    height: 76,
    justifyContent: "center",
    width: 56,
  },
  coverText: { fontSize: 12, fontWeight: "700" },
  coverImage: { height: "100%", resizeMode: "cover", width: "100%" },
  cardCopy: { flex: 1, gap: 4 },
  bookTitle: { fontSize: 19, fontWeight: "700" },
  error: { color: "#a22" },
});
