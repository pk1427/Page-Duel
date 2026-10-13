import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { resolveNextParam } from "../auth-routing";
import { useSession } from "../session-store";
import {
  AppButton,
  Body,
  Card,
  EmptyState,
  Eyebrow,
  Screen,
  Title,
  palette,
  radius,
  space,
} from "../ui";

export default function SignIn() {
  const { signIn, error, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();
  const destination = resolveNextParam(next);

  useEffect(() => {
    if (status === "signed-in") router.replace(destination as Href);
  }, [status, destination]);

  if (status === "unconfigured") {
    return (
      <Screen>
        <EmptyState
          title="Sign-in is unavailable"
          detail="This build has no backend configured, so the game cannot start."
          action={<AppButton onPress={() => router.replace("/" as Href)}>Back home</AppButton>}
        />
      </Screen>
    );
  }

  const submit = async () => {
    setBusy(true);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.ok) router.replace(destination as Href);
  };

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Welcome back</Eyebrow>
        <Title>Sign in</Title>
        <Body>Your shelf of finished games is waiting.</Body>
      </View>
      <Card style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>Email</Text>
          <TextInput
            accessibilityLabel="Email"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#8B7D70"
            value={email}
            onChangeText={setEmail}
            style={s.input}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>Password</Text>
          <TextInput
            accessibilityLabel="Password"
            autoCapitalize="none"
            autoComplete="password"
            placeholder="Your password"
            placeholderTextColor="#8B7D70"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={s.input}
          />
        </View>
        {error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        <AppButton
          accessibilityLabel="Sign in"
          disabled={busy || !email.trim() || !password}
          onPress={submit}
        >
          Sign in
        </AppButton>
        <AppButton
          onPress={() =>
            router.push({ pathname: "/sign-up", params: { next: destination } } as Href)
          }
          tone="quiet"
        >
          New here? Create an account
        </AppButton>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 620 },
  form: { gap: space.sm, maxWidth: 520 },
  field: { gap: space.xxs },
  label: {
    color: palette.muted,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.small,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 18,
    minHeight: 54,
    paddingHorizontal: space.sm,
  },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
});
