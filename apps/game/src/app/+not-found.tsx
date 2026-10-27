import { router, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { AppButton, Body, Card, Eyebrow, Screen, Title, palette, space } from "../ui";

/** Friendly web and native fallback for an unknown Expo Router route. */
export default function NotFoundScreen() {
  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Page not found</Eyebrow>
        <Title>That page isn&apos;t here.</Title>
        <Body>Use the link below to return to Book People.</Body>
      </View>
      <Card style={s.card}>
        <AppButton accessibilityLabel="Return home" onPress={() => router.replace("/" as Href)}>
          Return home
        </AppButton>
        <Text style={s.hint}>If you followed an old email link, request a new one.</Text>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 620 },
  card: { gap: space.sm, maxWidth: 520 },
  hint: { color: palette.muted, fontSize: 14 },
});
