import { router, useLocalSearchParams, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

export default function SignIn() {
  const { signIn, error, authDiagnostic, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
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
    const result = await signIn(email, password);
    setBusy(false);
    if (result.ok) router.replace(destination as Href);
  };

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Welcome back</Eyebrow>
        <Title>{copy.nav.signIn}</Title>
        <Body>Pick up where you left off.</Body>
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
            autoComplete="password"
            placeholder={copy.auth.passwordPlaceholder}
            placeholderTextColor="#8B7D70"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={s.input}
          />
          <AppButton onPress={() => router.push("/forgot-password" as Href)} tone="quiet">
            Forgot password
          </AppButton>
        </View>
        {error && (
          <View style={s.errorBlock}>
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
            {(__DEV__ || process.env.EXPO_PUBLIC_AUTH_DEBUG === "true") && authDiagnostic && (
              <View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Toggle technical sign-in details"
                  onPress={() => setShowTechnicalDetails((visible) => !visible)}
                >
                  <Text style={s.technicalToggle}>
                    {showTechnicalDetails ? "Hide technical details" : "Technical details"}
                  </Text>
                </Pressable>
                {showTechnicalDetails && (
                  <Text selectable style={s.technicalDetails}>
                    {JSON.stringify(authDiagnostic)}
                  </Text>
                )}
              </View>
            )}
          </View>
        )}
        <AppButton
          accessibilityLabel={copy.nav.signIn}
          disabled={busy || !email.trim() || !password}
          onPress={submit}
        >
          {copy.nav.signIn}
        </AppButton>
        <AppButton
          onPress={() =>
            router.push({ pathname: "/sign-up", params: { next: destination } } as Href)
          }
          tone="quiet"
        >
          Create an account
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
  errorBlock: { gap: space.xxs },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
  technicalToggle: { color: palette.muted, fontSize: 13, textDecorationLine: "underline" },
  technicalDetails: {
    color: palette.muted,
    fontFamily: "monospace",
    fontSize: 12,
    marginTop: space.xxs,
  },
});
