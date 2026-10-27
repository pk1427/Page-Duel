import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { getSupabase } from "../supabase";
import { validatePassword } from "../auth-routing";
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

type Status = "checking" | "ready" | "invalid" | "success" | "error";

export default function ResetPassword() {
  const [status, setStatus] = useState<Status>("checking");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      // Defer to avoid synchronous setState in effect
      const t = setTimeout(() => setStatus("invalid"), 0);
      return () => clearTimeout(t);
    }

    // The Supabase client parses the recovery tokens from the URL hash
    // automatically (detectSessionInUrl: true). Wait for initialization
    // to complete, then verify we have a valid recovery session.
    let cancelled = false;

    const checkSession = async () => {
      try {
        const { data, error: sessionError } = await client.auth.getSession();
        if (cancelled) return;
        if (sessionError || !data.session?.user) {
          setStatus("invalid");
          return;
        }
        // Verify this is a recovery session by checking the URL hash
        // for type=recovery. If the hash is missing, we may still have a
        // valid session from a previous flow — treat as invalid for safety.
        if (typeof window !== "undefined") {
          const hash = window.location.hash;
          if (!hash.includes("type=recovery") && !hash.includes("type%3Drecovery")) {
            // No recovery token in URL — could be a stale session.
            // Still allow if we have a session (user may have refreshed).
            // But if no recovery context, show invalid link.
            if (!hash.includes("access_token")) {
              setStatus("invalid");
              return;
            }
          }
        }
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("invalid");
      }
    };

    // Give the Supabase client a moment to parse the URL hash.
    const timer = setTimeout(() => {
      void checkSession();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  const submit = async () => {
    setError(null);

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The passwords do not match. Please try again.");
      return;
    }

    const client = getSupabase();
    if (!client) {
      setError("Password reset is unavailable: no backend is configured.");
      return;
    }

    setBusy(true);
    try {
      const { error: updateError } = await client.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        const msg = updateError.message?.toLowerCase() ?? "";
        if (msg.includes("weak") || msg.includes("password")) {
          setError("Please choose a stronger password.");
        } else if (msg.includes("network") || msg.includes("fetch")) {
          setError("Unable to connect. Please check your internet connection.");
        } else {
          setError("Something went wrong. Please try again.");
        }
        return;
      }
      setStatus("success");
      // Clean up the session so the user isn't stuck in a recovery state.
      await client.auth.signOut();
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

  if (status === "checking") {
    return (
      <Screen>
        <View style={s.heading}>
          <Eyebrow>Reset password</Eyebrow>
          <Title>Verifying link…</Title>
          <Body>Checking your reset link, please wait.</Body>
        </View>
      </Screen>
    );
  }

  if (status === "invalid") {
    return (
      <Screen>
        <View style={s.heading}>
          <Eyebrow>Reset password</Eyebrow>
          <Title>Link expired or invalid</Title>
          <Body>
            This password-reset link is no longer valid. It may have expired or
            already been used. Request a new one to continue.
          </Body>
        </View>
        <Card style={s.form}>
          <AppButton onPress={() => router.replace("/forgot-password" as Href)}>
            Request a new link
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

  if (status === "success") {
    return (
      <Screen>
        <View style={s.heading}>
          <Eyebrow>Reset password</Eyebrow>
          <Title>Password updated</Title>
          <Body>Your password has been changed. You can now sign in with your new password.</Body>
        </View>
        <Card style={s.form}>
          <AppButton onPress={() => router.replace("/sign-in" as Href)}>
            Back to sign in
          </AppButton>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Reset password</Eyebrow>
        <Title>Choose a new password</Title>
        <Body>Enter your new password below.</Body>
      </View>
      <Card style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>New password</Text>
          <View style={s.passwordRow}>
            <TextInput
              accessibilityLabel="New password"
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder="At least 6 characters"
              placeholderTextColor="#8B7D70"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                setError(null);
              }}
              style={[s.input, s.passwordInput]}
            />
            <AppButton
              onPress={() => setShowPassword((v) => !v)}
              tone="quiet"
            >
              {showPassword ? "Hide" : "Show"}
            </AppButton>
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Confirm password</Text>
          <TextInput
            accessibilityLabel="Confirm password"
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder="Repeat your password"
            placeholderTextColor="#8B7D70"
            secureTextEntry={!showPassword}
            value={confirmPassword}
            onChangeText={(t) => {
              setConfirmPassword(t);
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
          accessibilityLabel="Update password"
          disabled={busy || !newPassword || !confirmPassword}
          onPress={() => void submit()}
        >
          {busy ? "Updating…" : "Update password"}
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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  passwordInput: {
    flex: 1,
  },
  error: { color: palette.danger, fontSize: 15, fontWeight: "700" },
});