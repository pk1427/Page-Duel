import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { getSupabase } from "../supabase";
import { validatePassword } from "../auth-routing";
import { AppButton, Body, Card, Eyebrow, Screen, Title, palette, radius, space } from "../ui";
import { copy } from "../copy";

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
        // valid session from a previous flow. Treat as invalid for safety.
        if (typeof window !== "undefined") {
          const hash = window.location.hash;
          if (!hash.includes("type=recovery") && !hash.includes("type%3Drecovery")) {
            // No recovery token in URL. It could be a stale session.
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
      setError(copy.errors.passwordMismatch);
      return;
    }

    const client = getSupabase();
    if (!client) {
      setError(copy.auth.signInUnavailable);
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
          setError(copy.auth.weakPassword);
        } else if (msg.includes("network") || msg.includes("fetch")) {
          setError(copy.auth.noConnection);
        } else {
          setError(copy.auth.genericRetry);
        }
        return;
      }
      setStatus("success");
      // Clean up the session so the user isn't stuck in a recovery state.
      await client.auth.signOut();
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

  if (status === "checking") {
    return (
      <Screen>
        <View style={s.heading}>
          <Eyebrow>{copy.resetPassword.eyebrow}</Eyebrow>
          <Title>{copy.resetPassword.checkingTitle}</Title>
          <Body>{copy.resetPassword.checkingDetail}</Body>
        </View>
      </Screen>
    );
  }

  if (status === "invalid") {
    return (
      <Screen>
        <View style={s.heading}>
          <Eyebrow>{copy.resetPassword.eyebrow}</Eyebrow>
          <Title>{copy.resetPassword.invalidTitle}</Title>
          <Body>{copy.resetPassword.invalidDetail}</Body>
        </View>
        <Card style={s.form}>
          <AppButton onPress={() => router.replace("/forgot-password" as Href)}>
            {copy.resetPassword.requestNewLink}
          </AppButton>
          <AppButton onPress={() => router.replace("/sign-in" as Href)} tone="quiet">
            {copy.nav.signIn}
          </AppButton>
        </Card>
      </Screen>
    );
  }

  if (status === "success") {
    return (
      <Screen>
        <View style={s.heading}>
          <Eyebrow>{copy.resetPassword.eyebrow}</Eyebrow>
          <Title>{copy.resetPassword.successTitle}</Title>
          <Body>{copy.resetPassword.successDetail}</Body>
        </View>
        <Card style={s.form}>
          <AppButton onPress={() => router.replace("/sign-in" as Href)}>
            {copy.nav.signIn}
          </AppButton>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>{copy.resetPassword.eyebrow}</Eyebrow>
        <Title>{copy.resetPassword.chooseTitle}</Title>
        <Body>{copy.resetPassword.chooseDetail}</Body>
      </View>
      <Card style={s.form}>
        <View style={s.field}>
          <Text style={s.label}>{copy.resetPassword.newPassword}</Text>
          <View style={s.passwordRow}>
            <TextInput
              accessibilityLabel={copy.resetPassword.newPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              placeholder={copy.auth.newPasswordPlaceholder}
              placeholderTextColor="#8B7D70"
              secureTextEntry={!showPassword}
              value={newPassword}
              onChangeText={(t) => {
                setNewPassword(t);
                setError(null);
              }}
              style={[s.input, s.passwordInput]}
            />
            <AppButton onPress={() => setShowPassword((v) => !v)} tone="quiet">
              {showPassword ? copy.actions.hidePassword : copy.actions.showPassword}
            </AppButton>
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>{copy.resetPassword.confirmPassword}</Text>
          <TextInput
            accessibilityLabel={copy.resetPassword.confirmPassword}
            autoCapitalize="none"
            autoComplete="new-password"
            placeholder={copy.resetPassword.confirmPlaceholder}
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
          accessibilityLabel={copy.actions.updatePassword}
          disabled={busy || !newPassword || !confirmPassword}
          onPress={() => void submit()}
        >
          {busy ? copy.actions.updating : copy.actions.updatePassword}
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
