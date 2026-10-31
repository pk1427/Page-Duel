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
import { copy } from "../copy";
import { HeroBookIllustration } from "../illustrations";

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
          title={copy.auth.signInTitleUnavailable}
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
    <Screen style={s.page}>
      <View style={s.intro}>
        <View style={s.illustration} accessible accessibilityLabel={copy.home.storybookLabel}>
          <HeroBookIllustration width={180} height={144} />
        </View>
        <View style={s.heading}>
          <Eyebrow>{copy.auth.welcomeBack}</Eyebrow>
          <Title style={s.headingTitle}>{copy.nav.signIn}</Title>
          <Body style={s.headingBody}>{copy.auth.signInDetail}</Body>
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
            {copy.actions.forgotPassword}
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
                  accessibilityLabel={copy.auth.toggleTechnicalDetails}
                  onPress={() => setShowTechnicalDetails((visible) => !visible)}
                >
                  <Text style={s.technicalToggle}>
                    {showTechnicalDetails ? copy.auth.hideTechnicalDetails : copy.auth.technicalDetails}
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
          {copy.actions.createAccount}
        </AppButton>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  page: { justifyContent: "center", minHeight: "100%" },
  intro: { alignItems: "center", alignSelf: "center", gap: space[200], maxWidth: 560, width: "100%" },
  illustration: { alignItems: "center", backgroundColor: palette.forestLight, borderRadius: radius.xlarge, justifyContent: "center", minHeight: 168, minWidth: 210, padding: space[100] },
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
