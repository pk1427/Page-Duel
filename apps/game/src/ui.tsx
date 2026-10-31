import type { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

export const palette = {
  ink: "#1D1A16",
  muted: "#6B6358",
  paper: "#FEFBF3",
  canvas: "#F5F0E6",
  line: "#E8E0D4",
  accent: "#E86C3A",
  accentDark: "#C45228",
  accentLight: "#FBE8E0",
  forest: "#2D5A3D",
  forestDark: "#1E3D2A",
  forestLight: "#E8F4EC",
  sky: "#3AA8D8",
  skyDark: "#288BB8",
  skyLight: "#E8F6FC",
  sunshine: "#F4B400",
  sunshineDark: "#D49A00",
  sunshineLight: "#FEF3D8",
  coral: "#E87A5E",
  coralDark: "#C45E44",
  coralLight: "#FBE8E0",
  mint: "#4EC9A8",
  mintDark: "#3DB890",
  mintLight: "#E8F8F3",
  plum: "#7B5D7A",
  plumLight: "#F3EDF3",
  white: "#FFFFFF",
  danger: "#C0392B",
  leather: "#5A4030",
  leatherDeep: "#3A2A20",
  gold: "#C9A227",
  felt: "#33473D",
  feltDeep: "#27382F",
  leftPlayer: "#E86C3A",
  rightPlayer: "#3AA8D8",
  moss: "#3C594B",
} as const;

export const space = {
  xxs: 6,
  xs: 10,
  sm: 16,
  md: 24,
  lg: 36,
  xl: 52,
  0: 0,
  25: 2,
  50: 4,
  75: 8,
  100: 12,
  200: 16,
  300: 24,
  400: 32,
  500: 40,
  600: 48,
  700: 64,
  800: 80,
  900: 96,
} as const;

export const radius = {
  none: 0,
  small: 8,
  medium: 12,
  large: 16,
  xlarge: 24,
  round: 999,
} as const;

export const fontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
  "5xl": 48,
  "6xl": 60,
  "7xl": 72,
} as const;

export const lineHeights = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
  relaxed: 1.625,
} as const;

export const fontWeights = {
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(29, 26, 22, 0.05)",
  md: "0 4px 6px rgba(29, 26, 22, 0.07)",
  lg: "0 10px 15px rgba(29, 26, 22, 0.1)",
  xl: "0 20px 25px rgba(29, 26, 22, 0.15)",
  "2xl": "0 25px 50px rgba(29, 26, 22, 0.2)",
} as const;

export function Screen({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { width } = useWindowDimensions();
  const compact = width < 480;
  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, compact && styles.scrollCompact, style]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, compact && styles.contentCompact]}>{children}</View>
    </ScrollView>
  );
}

export function Eyebrow({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.eyebrow, style]}>{children}</Text>;
}

export function Title({
  children,
  style,
  numberOfLines,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}) {
  return <Text style={[styles.title, style]} numberOfLines={numberOfLines}>{children}</Text>;
}

export function Body({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.body, style]}>{children}</Text>;
}

export function Caption({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.caption, style]}>{children}</Text>;
}

export function Heading1({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.heading1, style]}>{children}</Text>;
}

export function Heading2({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.heading2, style]}>{children}</Text>;
}

export function Heading3({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<TextStyle>;
}) {
  return <Text style={[styles.heading3, style]}>{children}</Text>;
}

export function Card({
  accessibilityLabel,
  children,
  style,
  accessibilityRole,
  accessibilityLiveRegion,
}: {
  accessibilityLabel?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: "alert" | "none";
  accessibilityLiveRegion?: "none" | "polite" | "assertive";
}) {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      accessibilityLiveRegion={accessibilityLiveRegion}
      accessibilityRole={accessibilityRole}
      style={[styles.card, style]}
    >
      {children}
    </View>
  );
}

export function Badge({
  children,
  tone = "neutral",
  style,
}: {
  children: ReactNode;
  tone?: "neutral" | "accent" | "forest" | "sky" | "sunshine" | "coral" | "mint" | "moss";
  style?: StyleProp<TextStyle>;
}) {
  const toneStyles = {
    neutral: styles.badgeNeutral,
    accent: styles.badgeAccent,
    forest: styles.badgeForest,
    sky: styles.badgeSky,
    sunshine: styles.badgeSunshine,
    coral: styles.badgeCoral,
    mint: styles.badgeMint,
    moss: styles.badgeMoss,
  };
  return (
    <Text style={[styles.badge, toneStyles[tone], style]}>{children}</Text>
  );
}

export function AppButton({
  children,
  onPress,
  disabled,
  tone = "primary",
  size = "md",
  accessibilityLabel,
  style,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "outline" | "ghost" | "quiet";
  size?: "sm" | "md" | "lg";
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const sizeStyles = {
    sm: styles.buttonSm,
    md: styles.buttonMd,
    lg: styles.buttonLg,
  };
  const toneStyles = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    outline: styles.buttonOutline,
    ghost: styles.buttonGhost,
    quiet: styles.buttonQuiet,
  };
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        sizeStyles[size],
        toneStyles[tone],
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
        style,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          (tone === "secondary" || tone === "outline" || tone === "ghost" || tone === "quiet") &&
            styles.buttonTextSecondary,
        ]}
      >
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

export function PlayerTag({ side, name }: { side: "left" | "right"; name: string }) {
  return (
    <View style={styles.playerTag}>
      <View
        style={[styles.playerDot, side === "left" ? styles.playerDotLeft : styles.playerDotRight]}
      />
      <Text numberOfLines={1} style={styles.playerTagText}>
        {name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: palette.canvas },
  scrollCompact: { paddingBottom: space[100] },
  content: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    padding: space[400],
    gap: space[400],
  },
  contentCompact: { gap: space[300], padding: space[200] },
  eyebrow: {
    color: palette.forest,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    color: palette.ink,
    fontSize: fontSizes["4xl"],
    fontWeight: fontWeights.bold,
    letterSpacing: -0.8,
    lineHeight: fontSizes["4xl"] * lineHeights.tight,
  },
  body: {
    color: palette.muted,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.relaxed,
  },
  caption: {
    color: palette.muted,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  heading1: {
    color: palette.ink,
    fontSize: fontSizes["6xl"],
    fontWeight: fontWeights.semibold,
    letterSpacing: -1.5,
    lineHeight: fontSizes["6xl"] * lineHeights.tight,
  },
  heading2: {
    color: palette.ink,
    fontSize: fontSizes["5xl"],
    fontWeight: fontWeights.semibold,
    letterSpacing: -1.2,
    lineHeight: fontSizes["5xl"] * lineHeights.tight,
  },
  heading3: {
    color: palette.ink,
    fontSize: fontSizes["4xl"],
    fontWeight: fontWeights.semibold,
    letterSpacing: -0.8,
    lineHeight: fontSizes["4xl"] * lineHeights.tight,
  },
  playerTag: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: 7,
    maxWidth: "100%",
  },
  playerDot: { borderRadius: radius.round, height: 12, width: 12 },
  playerDotLeft: { backgroundColor: palette.leftPlayer },
  playerDotRight: { backgroundColor: palette.rightPlayer },
  playerTagText: { color: palette.ink, fontSize: 15, fontWeight: "800" },
  card: {
    backgroundColor: palette.white,
    borderColor: palette.line,
    borderRadius: radius.large,
    borderWidth: 1,
    padding: space[300],
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.round,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: "uppercase",
  },
  badgeNeutral: { backgroundColor: palette.canvas, color: palette.muted },
  badgeAccent: { backgroundColor: palette.accentLight, color: palette.accentDark },
  badgeForest: { backgroundColor: palette.forestLight, color: palette.forestDark },
  badgeSky: { backgroundColor: palette.skyLight, color: palette.skyDark },
  badgeSunshine: { backgroundColor: palette.sunshineLight, color: palette.sunshineDark },
  badgeCoral: { backgroundColor: palette.coralLight, color: palette.coralDark },
  badgeMint: { backgroundColor: palette.mintLight, color: palette.mintDark },
  badgeMoss: { backgroundColor: "#D8E5D9", color: palette.moss },
  button: {
    alignItems: "center",
    borderRadius: radius.medium,
    justifyContent: "center",
    paddingHorizontal: space[300],
  },
  buttonSm: { minHeight: 40, paddingHorizontal: space[200] },
  buttonMd: { minHeight: 52, paddingHorizontal: space[400] },
  buttonLg: { minHeight: 60, paddingHorizontal: space[500] },
  buttonPrimary: { backgroundColor: palette.accent },
  buttonSecondary: { backgroundColor: palette.forest },
  buttonOutline: { backgroundColor: "transparent", borderColor: palette.ink, borderWidth: 2 },
  buttonGhost: { backgroundColor: "transparent" },
  buttonQuiet: { backgroundColor: "transparent", minHeight: 44 },
  buttonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  buttonDisabled: { backgroundColor: palette.line, opacity: 0.6 },
  buttonText: {
    color: palette.white,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  buttonTextSecondary: { color: palette.ink },
  empty: { alignItems: "center", gap: space[200], padding: space[500] },
  emptyTitle: { fontSize: fontSizes["2xl"], lineHeight: fontSizes["2xl"] * lineHeights.tight },
  emptyBody: { maxWidth: 460, textAlign: "center" },
});
