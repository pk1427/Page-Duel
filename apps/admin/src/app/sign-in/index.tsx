import { useState } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, View, Text } from "react-native";
import { Link, router } from "expo-router";
import { useAdminSession } from "@/lib/admin-session";
import { Screen, Title, Body, Caption, AppButton, Eyebrow, Card, palette, space, radius } from "@/components/ui";
import { StyleSheet, TextInput } from "react-native";

export default function AdminSignInScreen() {
  const { signIn, status, error, isAdmin } = useAdminSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    Keyboard.dismiss();
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.ok && isAdmin) {
      router.replace("/admin/(dashboard)/" as any);
    }
  };

  return (
    <Screen style={styles.centered}>
      <Card style={styles.formCard}>
        <View style={styles.header}>
          <Eyebrow>Book People</Eyebrow>
          <Title>Admin Dashboard</Title>
          <Body>Sign in with your administrator account.</Body>
        </View>

        {error && <Text style={styles.error} role="alert">{error}</Text>}

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="admin@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              editable={!loading}
            />
          </View>
        </View>

        <AppButton
          onPress={handleSubmit}
          disabled={loading || !email || !password}
          style={styles.submitButton}
        >
          {loading ? "Signing in…" : "Sign in"}
        </AppButton>

        <Caption style={styles.footer}>
          Only authorized administrators can access the dashboard.
        </Caption>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: space.md,
  },
  formCard: {
    width: "100%",
    maxWidth: 400,
    padding: space.xl,
    ...StyleSheet.absoluteFill,
  },
  header: {
    gap: space.xs,
    marginBottom: space.lg,
    alignItems: "center",
  },
  error: {
    color: palette.danger,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: space.md,
    textAlign: "center",
  },
  form: {
    gap: space.md,
    marginBottom: space.lg,
  },
  field: {
    gap: space.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.ink,
  },
  input: {
    backgroundColor: palette.paper,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: radius.small,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: 16,
    color: palette.ink,
    minHeight: 44,
  },
  submitButton: {
    minHeight: 48,
  },
  footer: {
    textAlign: "center",
    marginTop: space.md,
  },
});