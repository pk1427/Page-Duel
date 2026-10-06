import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

export const palette = {
  ink: "#29221D",
  muted: "#74675A",
  paper: "#FBF6EA",
  canvas: "#EEE5D5",
  line: "#D7C9B6",
  accent: "#D66C3B",
  accentDark: "#A94425",
  plum: "#5C3B48",
  moss: "#3C594B",
  white: "#FFFCF6",
  danger: "#A83E32",
} as const;

export const space = { xxs: 6, xs: 10, sm: 16, md: 24, lg: 36, xl: 52 } as const;
export const radius = { small: 10, medium: 16, large: 24, round: 999 } as const;

export function Screen({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <ScrollView contentContainerStyle={[styles.scroll, style]} keyboardShouldPersistTaps="handled">
      <View style={styles.content}>{children}</View>
    </ScrollView>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

export function Body({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "moss";
}) {
  return (
    <Text
      style={[
        styles.badge,
        tone === "accent" && styles.badgeAccent,
        tone === "moss" && styles.badgeMoss,
      ]}
    >
      {children}
    </Text>
  );
}

export function AppButton({
  children,
  onPress,
  disabled,
  tone = "primary",
  accessibilityLabel,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "quiet";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        tone === "secondary" && styles.buttonSecondary,
        tone === "quiet" && styles.buttonQuiet,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text style={[styles.buttonText, tone !== "primary" && styles.buttonTextSecondary]}>
        {children}
      </Text>
    </Pressable>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail: string;
  action?: ReactNode;
}) {
  return (
    <Card style={styles.empty}>
      <Title style={styles.emptyTitle}>{title}</Title>
      <Body style={styles.emptyBody}>{detail}</Body>
      {action}
    </Card>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: palette.canvas },
  content: { width: "100%", maxWidth: 1120, alignSelf: "center", padding: space.md, gap: space.md },
  eyebrow: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    color: palette.ink,
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: -1.1,
    lineHeight: 43,
  },
  body: { color: palette.muted, fontSize: 17, lineHeight: 25 },
  card: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.medium,
    borderWidth: 1,
    padding: space.sm,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: palette.canvas,
    borderRadius: radius.round,
    color: palette.plum,
    fontSize: 12,
    fontWeight: "800",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: "uppercase",
  },
  badgeAccent: { backgroundColor: "#F8D7C5", color: palette.accentDark },
  badgeMoss: { backgroundColor: "#D8E5D9", color: palette.moss },
  button: {
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: radius.small,
    justifyContent: "center",
    minHeight: 54,
    paddingHorizontal: space.sm,
  },
  buttonSecondary: { backgroundColor: palette.white, borderColor: palette.ink, borderWidth: 1 },
  buttonQuiet: { backgroundColor: "transparent", minHeight: 44 },
  buttonPressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
  buttonDisabled: { backgroundColor: "#CFC4B7", opacity: 0.7 },
  buttonText: { color: palette.white, fontSize: 17, fontWeight: "800" },
  buttonTextSecondary: { color: palette.ink },
  empty: { alignItems: "flex-start", gap: space.sm, marginTop: space.xl },
  emptyTitle: { fontSize: 24, lineHeight: 28 },
  emptyBody: { maxWidth: 460 },
});
