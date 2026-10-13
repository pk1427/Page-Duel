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

export default function SignUp() {
  const { signUp, error, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();
  const destination = resolveNextParam(next);

  useEffect(() => {
    if (status === "signed-in") router.replace(destination as Href);
  }, [status, destination]);

  if (status === "unconfigured") {
    return (
      <Screen>
        <EmptyState
          title="Sign-up is unavailable"
          detail="This build has no backend configured, so the game cannot start."
          action={<AppButton onPress={() => router.replace("/" as Href)}>Back home</AppButton>}
        />
      </Screen>
    );
  }

  const submit = async () => {
    setBusy(true);
    setNeedsConfirmation(false);
    const result = await signUp(email, password);
    setBusy(false);
    if (!result.ok) return;
    if (result.needsConfirmation) {
      setNeedsConfirmation(true);
      return;
    }
    router.replace(destination as Href);
  };

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Keep your games</Eyebrow>
        <Title>Create an account</Title>
        <Body>One account holds your shelf of finished games. Playing stays free.</Body>
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
            autoComplete="new-password"
            placeholder="At least 6 characters"
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
        {needsConfirmation && (
          <Text accessibilityRole="alert" style={s.notice}>
            Account created. Check your email for the confirmation link, then sign in.
          </Text>
        )}
        <AppButton
          accessibilityLabel="Create account"
          disabled={busy || !email.trim() || password.length < 6}
          onPress={submit}
        >
          Create account
        </AppButton>
        <AppButton
          onPress={() =>
            router.push({ pathname: "/sign-in", params: { next: destination } } as Href)
          }
          tone="quiet"
        >
          Already have an account? Sign in
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
  notice: { color: palette.moss, fontSize: 15, fontWeight: "700" },
});
