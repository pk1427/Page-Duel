import { router, type Href } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";
import { useSession } from "../session-store";
import { RequireAuth } from "../require-auth";
import { AppButton, Body, Card, Eyebrow, Screen, Title, palette, radius, space } from "../ui";
import { copy, languageOptions, useLanguage } from "../copy";

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
  const { width } = useWindowDimensions();
  const desktop = width >= 768;
  const { userEmail, displayName, error, updateDisplayName, signOut } = useSession();
  const { language, setLanguage } = useLanguage();
  const [name, setName] = useState("");
  const [hasEdited, setHasEdited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

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
      <View style={[s.heading, desktop && s.headingDesktop]}>
        <Eyebrow>{copy.profile.eyebrow}</Eyebrow>
        <Title>{copy.profile.title}</Title>
      </View>
      <Card style={[s.card, desktop && s.cardDesktop]}>
        <View style={[s.identity, desktop && s.identityDesktop]}>
          <View style={[s.avatar, desktop && s.avatarDesktop]}>
            <Text style={[s.avatarText, desktop && s.avatarTextDesktop]}>{initialsFor(displayName, userEmail)}</Text>
          </View>
          <View style={s.identityCopy}>
            <Text style={[s.name, desktop && s.nameDesktop]}>{displayName || copy.profile.displayNamePlaceholder}</Text>
            {userEmail && <Body>{userEmail}</Body>}
          </View>
        </View>
        <View style={s.field}>
          <Text style={s.label}>{copy.profile.displayName}</Text>
          <TextInput
            accessibilityLabel={copy.profile.displayName}
            autoCapitalize="words"
            autoComplete="nickname"
            maxLength={40}
            placeholder={copy.profile.displayNamePlaceholder}
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
        {saved && !error && <Text style={s.saved}>{copy.profile.saved}</Text>}
        <AppButton accessibilityLabel={copy.actions.saveName} disabled={busy || !dirty} onPress={save}>
          {copy.actions.saveName}
        </AppButton>
        <Body style={s.note}>
          {copy.profile.detail}
        </Body>
      </Card>
      <Card style={[s.languageCard, desktop && s.languageCardDesktop]}>
        <Text style={s.label}>{copy.language.title}</Text>
        <Body>{copy.language.detail}</Body>
        <View accessibilityRole="radiogroup" style={[s.languageOptions, desktop && s.languageOptionsDesktop]}>
          {languageOptions.map((option) => {
            const selected = option.value === language;
            return (
              <Pressable
                key={option.value}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setLanguage(option.value)}
                style={[s.languageOption, selected && s.languageOptionSelected, desktop && s.languageOptionDesktop]}
              >
                <Text style={[s.languageOptionText, selected && s.languageOptionTextSelected, desktop && s.languageOptionTextDesktop]}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>
      <View style={[s.actions, desktop && s.actionsDesktop]}>
        <AppButton
          onPress={() => {
            router.replace("/" as Href);
            void signOut();
          }}
          tone="secondary"
        >
          {copy.actions.signOut}
        </AppButton>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  heading: { gap: space.xs, maxWidth: 620 },
  headingDesktop: { maxWidth: 720 },
  card: { borderColor: palette.forest, gap: space[300], maxWidth: 520 },
  cardDesktop: { maxWidth: 640, padding: space[400] },
  identity: { alignItems: "center", flexDirection: "row", gap: space.sm },
  identityDesktop: { gap: space.md },
  avatar: {
    alignItems: "center",
    backgroundColor: palette.plum,
    borderRadius: radius.round,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  avatarDesktop: { height: 72, width: 72 },
  avatarText: { color: palette.paper, fontSize: 20, fontWeight: "800" },
  avatarTextDesktop: { fontSize: 28 },
  identityCopy: { flex: 1, gap: 2 },
  name: { color: palette.ink, fontFamily: "serif", fontSize: 26, fontWeight: "800" },
  nameDesktop: { fontSize: 32 },
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
  actionsDesktop: { maxWidth: 640 },
  languageCard: { backgroundColor: palette.forestLight, borderColor: palette.forest, gap: space[200], maxWidth: 520 },
  languageCardDesktop: { maxWidth: 640, padding: space[400] },
  languageOptions: { flexDirection: "row", flexWrap: "wrap", gap: space.xxs },
  languageOptionsDesktop: { gap: space.sm },
  languageOption: { borderColor: palette.line, borderRadius: radius.round, borderWidth: 1, paddingHorizontal: space.sm, paddingVertical: 9 },
  languageOptionDesktop: { paddingHorizontal: space.md, paddingVertical: 12 },
  languageOptionSelected: { backgroundColor: palette.forest, borderColor: palette.forest },
  languageOptionText: { color: palette.ink, fontSize: 15, fontWeight: "700" },
  languageOptionTextDesktop: { fontSize: 16 },
  languageOptionTextSelected: { color: palette.paper },
});
