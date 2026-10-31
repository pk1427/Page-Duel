import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../session-store";
import { isValidEmail } from "../auth-routing";
import { AppButton, Body, Card, Eyebrow, Screen, Title, palette, radius, space } from "../ui";
import { copy } from "../copy";

function getResetRedirectUrl(): string {
  // Use the current origin + /reset-password so the link works in both
  // local development and staging. Supabase requires this URL to be in the
  // project's allowed redirect list.
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/reset-password`;
  }
  return "/reset-password";
}

export default function ForgotPassword() {
  const { status } = useSession();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  // If already signed in, go to the bookshelf.
  useEffect(() => {
    if (status === "signed-in") router.replace("/books" as Href);
  }, [status]);

  const submit = async () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError(copy.auth.invalidEmail);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const client = (await import("../supabase")).getSupabase();
      if (!client) {
        setError(copy.auth.signInUnavailable);
        setBusy(false);
        return;
      }
      const { error: resetError } = await client.auth.resetPasswordForEmail(trimmed, {
        redirectTo: getResetRedirectUrl(),
      });
      if (resetError) {
        const msg = resetError.message?.toLowerCase() ?? "";
        if (msg.includes("rate") || msg.includes("too many")) {
          setError(copy.auth.rateLimited);
        } else if (msg.includes("network") || msg.includes("fetch")) {
          setError(copy.auth.noConnection);
        } else {
          setError(copy.auth.genericRetry);
        }
        setBusy(false);
        return;
      }
      setSent(true);
    } catch (thrown) {
      const msg = String((thrown as { message?: string })?.message ?? thrown).toLowerCase();
      if (msg.includes("network") || msg.includes("fetch")) {
        setError(copy.auth.noConnection);
      } else {
        setError(copy.auth.genericRetry);
      }
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <View style={s.heading}>
          <Eyebrow>{copy.auth.resetSentEyebrow}</Eyebrow>
          <Title>{copy.auth.resetSentTitle}</Title>
          <Body>{copy.auth.resetSent}</Body>
        </View>
        <Card style={s.form}>
          <AppButton onPress={() => router.replace("/sign-in" as Href)}>
            {copy.nav.signIn}
          </AppButton>
          <AppButton
            tone="quiet"
            onPress={() => {
              setSent(false);
              setError(null);
            }}
          >
            {copy.actions.requestAnotherReset}
          </AppButton>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>{copy.auth.forgotEyebrow}</Eyebrow>
        <Title>{copy.auth.forgotTitle}</Title>
        <Body>{copy.auth.forgotDetail}</Body>
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
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            style={s.input}
          />
        </View>
        {error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        <AppButton
          accessibilityLabel={copy.actions.sendResetLink}
          disabled={busy || !email.trim()}
          onPress={() => void submit()}
        >
          {busy ? copy.actions.sending : copy.actions.sendResetLink}
        </AppButton>
        <AppButton onPress={() => router.replace("/sign-in" as Href)} tone="quiet">
          {copy.nav.signIn}
        </AppButton>
      </Card>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { alignSelf: "center", gap: space.xs, maxWidth: 520, width: "100%" },
  form: { alignSelf: "center", backgroundColor: palette.paper, borderColor: palette.forest, borderRadius: radius.xlarge, borderWidth: 1, gap: space[300], maxWidth: 520, padding: space[400], width: "100%" },
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
});
