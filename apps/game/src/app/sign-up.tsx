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
import { copy } from "../copy";
import { HeroBookIllustration } from "../illustrations";

export default function SignUp() {
  const { signUp, error, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { next } = useLocalSearchParams<{ next?: string | string[] }>();
  const destination = resolveNextParam(next);

  useEffect(() => {
    if (status === "signed-in") router.replace(destination as Href);
  }, [status, destination]);

  if (status === "unconfigured") {
    return (
      <Screen>
        <EmptyState
          title={copy.auth.signUpTitleUnavailable}
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
    if (password !== confirmPassword) {
      setLocalError(copy.errors.passwordMismatch);
      return;
    }
    setBusy(true);
    setLocalError(null);
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
    <Screen style={s.page}>
      <View style={s.intro}>
        <View style={s.illustration} accessible accessibilityLabel={copy.home.storybookLabel}>
          <HeroBookIllustration width={180} height={144} />
        </View>
        <View style={s.heading}>
          <Eyebrow>{copy.auth.signUpEyebrow}</Eyebrow>
          <Title style={s.headingTitle}>{copy.auth.signUpTitle}</Title>
          <Body style={s.headingBody}>{copy.auth.signUpDetail}</Body>
        </View>
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
            onChangeText={(value) => {
              setEmail(value);
              setLocalError(null);
            }}
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
            onChangeText={(value) => {
              setPassword(value);
              setLocalError(null);
            }}
            style={s.input}
          />
        </View>
        <View style={s.field}>
          <Text style={s.label}>{copy.resetPassword.confirmPassword}</Text>
          <TextInput
            accessibilityLabel={copy.resetPassword.confirmPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder={copy.resetPassword.confirmPlaceholder}
            placeholderTextColor="#8B7D70"
            secureTextEntry
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setLocalError(null);
            }}
            style={s.input}
          />
        </View>
        {(localError ?? error) && (
          <Text accessibilityRole="alert" style={s.error}>
            {localError ?? error}
          </Text>
        )}
        {needsConfirmation && (
          <Text accessibilityRole="alert" style={s.notice}>
            {copy.auth.confirmationSent}
          </Text>
        )}
        <AppButton
          accessibilityLabel={copy.actions.createAccount}
          disabled={busy || !email.trim() || password.length < 6 || !confirmPassword}
          onPress={submit}
        >
          {copy.actions.createAccount}
        </AppButton>
        <AppButton
          onPress={() =>
            router.push({ pathname: "/sign-in", params: { next: destination } } as Href)
          }
          tone="quiet"
        >
          {copy.actions.signInInstead}
        </AppButton>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  page: { justifyContent: "center", minHeight: "100%" },
  intro: { alignItems: "center", alignSelf: "center", gap: space[200], maxWidth: 560, width: "100%" },
  illustration: { alignItems: "center", backgroundColor: palette.sunshineLight, borderRadius: radius.xlarge, justifyContent: "center", minHeight: 168, minWidth: 210, padding: space[100] },
  heading: { alignItems: "center", gap: space.xs, width: "100%" },
  headingTitle: { textAlign: "center" },
  headingBody: { textAlign: "center" },
  form: { alignSelf: "center", backgroundColor: palette.paper, borderColor: palette.forest, borderRadius: radius.xlarge, borderWidth: 1, gap: space[300], maxWidth: 560, padding: space[400], width: "100%" },
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
    borderRadius: radius.medium,
    borderWidth: 1,
    color: palette.ink,
    fontSize: 18,
    minHeight: 54,
    paddingHorizontal: space.sm,
  },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
  notice: { color: palette.moss, fontSize: 15, fontWeight: "700" },
});
