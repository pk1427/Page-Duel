import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppButton, Body, Card, Eyebrow, Screen, Title, palette, space } from "../ui";
import { copy } from "../copy";

/** Friendly web and native fallback for an unknown Expo Router route. */
export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>{copy.notFound.eyebrow}</Eyebrow>
        <Title>{copy.notFound.title}</Title>
        <Body>{copy.notFound.detail}</Body>
      </View>
      <Card style={s.card}>
        <AppButton accessibilityLabel={copy.actions.backHome} onPress={() => router.replace("/" as Href)}>
          {copy.actions.backHome}
        </AppButton>
        <Text style={s.hint}>{copy.notFound.oldLink}</Text>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 620 },
  card: { gap: space.sm, maxWidth: 520 },
  hint: { color: palette.muted, fontSize: 14 },
});
