import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import {
  AppButton,
  Body,
  Caption,
  Card,
  Eyebrow,
  Screen,
  Title,
  palette,
  radius,
  space,
} from "../ui";
import { copy } from "../copy";
import { StepIllustration } from "../illustrations";

export default function How() {
  return (
    <Screen style={s.page}>
      <View style={s.hero}>
        <Eyebrow>{copy.howToPlay.eyebrow}</Eyebrow>
        <Title style={s.heroTitle}>{copy.howToPlay.title}</Title>
        <Body style={s.heroBody}>{copy.howToPlay.detail}</Body>
      </View>
      <Card style={s.example}>
        <View style={s.examplePages}>
          <View style={[s.examplePage, s.exampleLeft]}>
            <Text style={s.exampleDots}>{"● ".repeat(3)}</Text>
            <Text style={s.exampleCount}>{copy.howToPlay.exampleCount}</Text>
          </View>
          <View style={s.exampleSpine} />
          <View style={[s.examplePage, s.exampleRight]}>
            <Text style={s.exampleDots}>{"● ".repeat(5)}</Text>
            <Text style={s.exampleCount}>{copy.howToPlay.exampleCount}</Text>
          </View>
        </View>
        <Caption style={s.exampleCaption}>{copy.howToPlay.exampleCaption}</Caption>
      </Card>
      <View style={s.steps}>
        {copy.howToPlay.steps.map(([heading, detail], index) => (
          <Card key={heading} style={[s.step, index % 2 === 1 && s.stepAlternate]}>
            <View style={s.stepLead}>
              <Text style={s.number}>{index + 1}</Text>
              {index < 3 && <StepIllustration step={(index + 1) as 1 | 2 | 3} size={54} />}
            </View>
            <View style={s.stepCopy}>
              <Text style={s.stepHeading}>{heading}</Text>
              <Text style={s.stepText}>{detail}</Text>
            </View>
          </Card>
        ))}
      </View>
      <View style={s.actionWrap}>
        <AppButton onPress={() => router.replace("/books")}>{copy.actions.chooseBook}</AppButton>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: space[600] },
  hero: {
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: palette.forestLight,
    borderColor: palette.forest,
    borderRadius: radius.xlarge,
    borderWidth: 1,
    gap: space[100],
    maxWidth: 720,
    padding: space[400],
    width: "100%",
  },
  heroTitle: { color: palette.forestDark, textAlign: "center" },
  heroBody: { maxWidth: 540, textAlign: "center" },
  example: {
    alignItems: "center",
    backgroundColor: palette.paper,
    borderColor: palette.line,
    borderWidth: 1,
    gap: space[200],
    padding: space[300],
  },
  examplePages: { flexDirection: "row", maxWidth: 560, width: "100%" },
  examplePage: {
    alignItems: "center",
    backgroundColor: palette.paper,
    borderColor: palette.line,
    borderWidth: 1,
    flex: 1,
    gap: space.xxs,
    padding: space.sm,
  },
  exampleLeft: {
    backgroundColor: palette.accentLight,
    borderBottomLeftRadius: radius.medium,
    borderTopLeftRadius: radius.medium,
  },
  exampleRight: {
    backgroundColor: palette.skyLight,
    borderBottomRightRadius: radius.medium,
    borderTopRightRadius: radius.medium,
  },
  exampleSpine: { backgroundColor: palette.leatherDeep, width: 8 },
  exampleDots: { color: palette.plum, fontSize: 20, letterSpacing: 2, textAlign: "center" },
  exampleCount: {
    color: palette.muted,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  exampleCaption: { maxWidth: 460, textAlign: "center" },
  steps: { alignSelf: "center", gap: space[200], maxWidth: 760, width: "100%" },
  step: {
    alignItems: "center",
    borderLeftColor: palette.accent,
    borderLeftWidth: 5,
    flexDirection: "row",
    gap: space[200],
    padding: space[300],
  },
  stepAlternate: { borderLeftColor: palette.sky, backgroundColor: palette.paper },
  stepLead: { alignItems: "center", gap: space[100], width: 56 },
  number: {
    backgroundColor: palette.accentLight,
    borderRadius: radius.round,
    color: palette.accentDark,
    fontFamily: "serif",
    fontSize: 31,
    fontWeight: "800",
    lineHeight: 35,
    minWidth: 42,
    paddingVertical: 3,
    textAlign: "center",
  },
  stepCopy: { flex: 1, gap: 4, minWidth: 0 },
  stepHeading: { color: palette.ink, fontFamily: "serif", fontSize: 20, fontWeight: "700" },
  stepText: { color: palette.muted, fontSize: 16, lineHeight: 24 },
  actionWrap: { alignSelf: "center", maxWidth: 420, width: "100%" },
});
