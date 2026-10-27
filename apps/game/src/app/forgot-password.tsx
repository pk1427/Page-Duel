import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../session-store";
import { isValidEmail } from "../auth-routing";
import {
  AppButton,
  Body,
  Card,
  Eyebrow,
  Screen,
  Title,
  palette,
  radius,
  space,
} from "../ui";

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
      setError("Please enter a valid email address.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const client = (await import("../supabase")).getSupabase();
      if (!client) {
        setError("Password reset is unavailable: no backend is configured.");
        setBusy(false);
        return;
      }
      const { error: resetError } = await client.auth.resetPasswordForEmail(trimmed, {
        redirectTo: getResetRedirectUrl(),
      });
      if (resetError) {
        const msg = resetError.message?.toLowerCase() ?? "";
        if (msg.includes("rate") || msg.includes("too many")) {
          setError("Too many requests. Please try again later.");
        } else if (msg.includes("network") || msg.includes("fetch")) {
          setError("Unable to connect. Please check your internet connection.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        setBusy(false);
        return;
      }
      setSent(true);
    } catch (thrown) {
      const msg = String((thrown as { message?: string })?.message ?? thrown).toLowerCase();
      if (msg.includes("network") || msg.includes("fetch")) {
        setError("Unable to connect. Please check your internet connection.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <Screen>
        <View style={s.heading}>
          <Eyebrow>Check your email</Eyebrow>
          <Title>Reset link sent</Title>
          <Body>
            If an account exists for {email.trim()}, we sent a password-reset link.
            Check your inbox (and spam folder) and follow the link to choose a new password.
          </Body>
        </View>
        <Card style={s.form}>
          <AppButton onPress={() => router.replace("/sign-in" as Href)}>
            Back to sign in
          </AppButton>
          <AppButton
            tone="quiet"
            onPress={() => {
              setSent(false);
              setError(null);
            }}
          >
            Try a different email
          </AppButton>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Forgot your password?</Eyebrow>
        <Title>Reset your password</Title>
        <Body>
          Enter your account email and we&apos;ll send you a link to choose a new
          password.
        </Body>
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
          accessibilityLabel="Send reset link"
          disabled={busy || !email.trim()}
          onPress={() => void submit()}
        >
          {busy ? "Sending…" : "Send reset link"}
        </AppButton>
        <AppButton
          onPress={() => router.replace("/sign-in" as Href)}
          tone="quiet"
        >
          Back to sign in
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