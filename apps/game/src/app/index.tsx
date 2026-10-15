import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { BookCover } from "../cover-image";
import { useGame } from "../game-store";
import { getPlayableBookContent } from "../catalog";
import { playTarget } from "../auth-routing";
import { useSession } from "../session-store";
import {
  AppButton,
  Badge,
  Body,
  Caption,
  Eyebrow,
  Screen,
  Title,
  palette,
  radius,
  space,
} from "../ui";

export default function Home() {
  const { playableBooks } = useGame();
  const { status } = useSession();
  const leftBook = playableBooks.find((book) => book.id === "alice-loc-1885");
  const rightBook = playableBooks.find((book) => book.id === "tales-of-punjab-1894");
  const leftBookContent = leftBook ? getPlayableBookContent(leftBook) : undefined;
  const rightBookContent = rightBook ? getPlayableBookContent(rightBook) : undefined;

  return (
    <Screen style={s.page}>
      <View style={s.hero}>
        <View style={s.copyColumn}>
          <Eyebrow>A two-player counting game</Eyebrow>
          <Title style={s.display}>Book People</Title>
          <Body style={s.lede}>
            Two players. One open book.{"\n"}More people on your page wins the round.
          </Body>
          <View style={s.actions}>
            <AppButton onPress={() => router.push(playTarget(status) as Href)}>Play</AppButton>
            <AppButton onPress={() => router.push("/how-to-play" as Href)} tone="quiet">
              How to Play
            </AppButton>
          </View>
          <View style={s.promises}>
            <Badge tone="moss">Two players</Badge>
            <Badge tone="moss">Real illustrated books</Badge>
            {status === "signed-in" ? (
              <Badge tone="accent">Signed in — press Play</Badge>
            ) : (
              <Badge tone="neutral">Sign in to play</Badge>
            )}
          </View>
        </View>
        <View style={s.shelf}>
          <View accessible accessibilityLabel="An open storybook" style={s.bookStage}>
            <View style={[s.pageArt, s.leftPage]}>
              {leftBookContent ? (
                <BookCover book={leftBookContent} style={s.stageCover} />
              ) : (
                <Text style={s.pageNumber}>I</Text>
              )}
              <Text style={s.pageOwner}>Left page · Player 1</Text>
            </View>
            <View style={s.spine} />
            <View style={[s.pageArt, s.rightPage]}>
              {rightBookContent ? (
                <BookCover book={rightBookContent} style={s.stageCover} />
              ) : (
                <Text style={s.pageNumber}>II</Text>
              )}
              <Text style={s.pageOwner}>Right page · Player 2</Text>
            </View>
          </View>
          <Caption style={s.shelfCaption}>
            Alice&apos;s Adventures in Wonderland meets Tales of the Punjab — count the people, take
            the round.
          </Caption>
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
  lede: { fontSize: 20, fontWeight: "700", lineHeight: 30, maxWidth: 540 },
  actions: { alignItems: "flex-start", gap: space.xs, marginTop: space.xs, width: "100%" },
  promises: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
    marginTop: space.sm,
  },
  shelf: { alignItems: "center", flexBasis: 320, flexGrow: 1, gap: space.xs, maxWidth: 520 },
  bookStage: {
    alignItems: "center",
    backgroundColor: palette.leather,
    borderColor: palette.leatherDeep,
    borderRadius: radius.large,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    minWidth: 300,
    padding: space.sm,
    width: "100%",
  },
  pageArt: {
    alignItems: "center",
    backgroundColor: palette.paper,
    flex: 1,
    gap: space.xxs,
    height: 300,
    justifyContent: "center",
    padding: space.xs,
  },
  leftPage: {
    borderBottomLeftRadius: radius.small,
    borderTopLeftRadius: radius.small,
  },
  rightPage: {
    borderBottomRightRadius: radius.small,
    borderTopRightRadius: radius.small,
  },
  stageCover: { flex: 1, width: "100%" },
  spine: {
    backgroundColor: palette.leatherDeep,
    borderLeftColor: palette.gold,
    borderLeftWidth: 1,
    borderRightColor: palette.gold,
    borderRightWidth: 1,
    height: 300,
    width: 10,
    zIndex: 2,
  },
  pageNumber: { color: palette.muted, fontFamily: "serif", fontSize: 17, textAlign: "center" },
  pageOwner: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  shelfCaption: { maxWidth: 420, textAlign: "center" },
});
