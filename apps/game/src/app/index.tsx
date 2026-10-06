import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppButton, Badge, Body, Eyebrow, Screen, Title, palette, radius, space } from "../ui";

export default function Home() {
  return (
    <Screen style={s.page}>
      <View style={s.hero}>
        <View style={s.copyColumn}>
          <Eyebrow>A shared-reading game</Eyebrow>
          <Title style={s.display}>Book People</Title>
          <Body style={s.lede}>
            Open a real illustrated book together. Reveal each page, count the people, and let the
            story settle the score.
          </Body>
          <View style={s.actions}>
            <AppButton onPress={() => router.push("/books" as Href)}>Choose a book</AppButton>
            <AppButton onPress={() => router.push("/how-to-play" as Href)} tone="quiet">
              How to play
            </AppButton>
          </View>
          <View style={s.promises}>
            <Badge tone="moss">Two players</Badge>
            <Text style={s.promiseText}>One open book · a fresh spread every round</Text>
          </View>
        </View>
        <View accessible accessibilityLabel="An open storybook" style={s.bookStage}>
          <View style={[s.pageArt, s.leftPage]}>
            <Text style={s.pageNumber}>I</Text>
            <View style={s.inkLine} />
            <View style={[s.inkLine, s.shortLine]} />
            <Text style={s.figure}>♙</Text>
          </View>
          <View style={s.spine} />
          <View style={[s.pageArt, s.rightPage]}>
            <Text style={s.pageNumber}>II</Text>
            <View style={s.inkLine} />
            <View style={[s.inkLine, s.shortLine]} />
            <Text style={s.figure}>♙ ♙</Text>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  page: { flexGrow: 1, justifyContent: "center", minHeight: "100%" },
  hero: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xl,
    justifyContent: "space-between",
  },
  copyColumn: { flexBasis: 340, flexGrow: 1, gap: space.sm, maxWidth: 580 },
  display: { fontSize: 58, letterSpacing: -2.2, lineHeight: 61 },
  lede: { fontSize: 20, lineHeight: 30, maxWidth: 540 },
  actions: { alignItems: "flex-start", gap: space.xs, marginTop: space.xs, width: "100%" },
  promises: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
    marginTop: space.sm,
  },
  promiseText: { color: palette.muted, fontSize: 14, fontWeight: "600" },
  bookStage: {
    alignItems: "center",
    flexDirection: "row",
    height: 330,
    justifyContent: "center",
    minWidth: 310,
    position: "relative",
  },
  pageArt: {
    backgroundColor: palette.paper,
    borderColor: "#CBB89B",
    borderWidth: 1,
    height: 282,
    justifyContent: "center",
    padding: space.sm,
    shadowColor: palette.ink,
    shadowOffset: { height: 10, width: 0 },
    shadowOpacity: 0.13,
    shadowRadius: 16,
    width: 150,
  },
  leftPage: {
    borderBottomLeftRadius: radius.small,
    borderTopLeftRadius: radius.small,
    transform: [{ perspective: 900 }, { rotateY: "-7deg" }],
  },
  rightPage: {
    borderBottomRightRadius: radius.small,
    borderTopRightRadius: radius.small,
    transform: [{ perspective: 900 }, { rotateY: "7deg" }],
  },
  spine: { backgroundColor: "#B59C7C", height: 278, width: 7, zIndex: 2 },
  pageNumber: { color: palette.muted, fontFamily: "serif", fontSize: 17, textAlign: "center" },
  inkLine: { backgroundColor: "#C6B394", height: 2, marginTop: 18, width: "100%" },
  shortLine: { alignSelf: "center", marginTop: 8, width: "68%" },
  figure: {
    color: palette.plum,
    fontSize: 46,
    letterSpacing: 2,
    marginTop: 38,
    textAlign: "center",
  },
});
