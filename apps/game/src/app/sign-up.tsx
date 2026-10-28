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
import { copy } from "../copy/en";

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
          detail={copy.auth.signInUnavailable}
          action={
            <AppButton onPress={() => router.replace("/" as Href)}>
              {copy.actions.backHome}
            </AppButton>
          }
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
        <Body>Use one account to keep your match history.</Body>
      </View>
      <Card style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>{copy.auth.email}</Text>
          <TextInput
            accessibilityLabel={copy.auth.email}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder={copy.auth.emailPlaceholder}
            placeholderTextColor="#8B7D70"
            value={email}
            onChangeText={setEmail}
            style={s.input}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>{copy.auth.password}</Text>
          <TextInput
            accessibilityLabel={copy.auth.password}
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder={copy.auth.newPasswordPlaceholder}
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
            {copy.auth.confirmationSent}
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
          Sign in instead
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
