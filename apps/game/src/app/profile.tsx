import { router, type Href } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useSession } from "../session-store";
import { RequireAuth } from "../require-auth";
import { AppButton, Body, Card, Eyebrow, Screen, Title, palette, radius, space } from "../ui";

export default function Profile() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}

function initialsFor(displayName: string | null, email: string | null): string {
  const source = (displayName || email || "R").trim();
  const parts = source.split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "R") + (parts[1]?.[0] ?? "")).toUpperCase() || "R";
}

function ProfileContent() {
  const { userEmail, displayName, error, updateDisplayName, signOut } = useSession();
  const [name, setName] = useState("");
  const [hasEdited, setHasEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  // When the user hasn't edited, the input shows the session displayName.
  // When the user has edited, the input shows the local name state.
  const inputValue = hasEdited ? name : (displayName ?? "");
  const dirty = hasEdited && name.trim() !== (displayName ?? "");

  const save = async () => {
    setBusy(true);
    setSaved(false);
    const result = await updateDisplayName(name);
    setBusy(false);
    if (result.ok) {
      setSaved(true);
    }
  };

  return (
    <Screen>
      <View style={s.heading}>
        <Eyebrow>Your shelf card</Eyebrow>
        <Title>Profile</Title>
      </View>
      <Card style={s.card}>
        <View style={s.identity}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initialsFor(displayName, userEmail)}</Text>
          </View>
          <View style={s.identityCopy}>
            <Text style={s.name}>{displayName || "Reader"}</Text>
            {userEmail && <Body>{userEmail}</Body>}
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>Display name</Text>
          <TextInput
            accessibilityLabel="Display name"
            autoCapitalize="words"
            autoComplete="nickname"
            maxLength={40}
            placeholder="Reader"
            placeholderTextColor="#8B7D70"
            value={inputValue}
            onChangeText={(value) => {
              setName(value);
              setHasEdited(true);
              setSaved(false);
            }}
            style={s.input}
          />
        </View>
        {error && (
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
        )}
        {saved && !error && <Text style={s.saved}>Saved to your shelf card.</Text>}
        <AppButton accessibilityLabel="Save display name" disabled={busy || !dirty} onPress={save}>
          Save name
        </AppButton>
        <Body style={s.note}>
          This is the name on your account. The two in-game player names are chosen fresh for every
          match.
        </Body>
      </Card>
      <View style={s.actions}>
        <AppButton
          onPress={() => {
            // Navigate home first while the auth gate is still satisfied, then
            // end the session. The reverse order races the RequireAuth
            // signed-out redirect (stale Profile screen bounces to /sign-in),
            // making sign-out land on two different screens nondeterministically.
            router.replace("/" as Href);
            void signOut();
          }}
          tone="secondary"
        >
          Sign out
        </AppButton>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 620 },
  card: { gap: space.sm, maxWidth: 520 },
  identity: { alignItems: "center", flexDirection: "row", gap: space.sm },
  avatar: {
    alignItems: "center",
    backgroundColor: palette.plum,
    borderRadius: radius.round,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarText: { color: palette.paper, fontSize: 20, fontWeight: "800" },
  identityCopy: { flex: 1, gap: 2 },
  name: { color: palette.ink, fontFamily: "serif", fontSize: 26, fontWeight: "800" },
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
  saved: { color: palette.moss, fontSize: 15, fontWeight: "700" },
  note: { fontSize: 15 },
  actions: { maxWidth: 520 },
});
