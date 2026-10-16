import { StyleSheet, Text, View, type StyleProp, type ViewStyle, type TextStyle } from "react-native";

export const palette = {
  ink: "#1a1a2e",
  muted: "#6b7280",
  paper: "#f8fafc",
  card: "#ffffff",
  border: "#e2e8f0",
  accent: "#2563eb",
  accentDark: "#1d4ed8",
  accentLight: "#dbeafe",
  gold: "#d4a843",
  goldLight: "#fef3c7",
  moss: "#166534",
  mossLight: "#dcfce7",
  leather: "#8b7355",
  leatherDeep: "#4a3728",
  danger: "#dc2626",
  dangerLight: "#fef2f2",
  warning: "#d97706",
  warningLight: "#fffbeb",
  success: "#16a34a",
  successLight: "#dcfce7",
};

export const space = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  small: 6,
  medium: 10,
  large: 16,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
};

export const Screen = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.screen, style]}>{children}</View>
);

export const Card = ({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const Title = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[styles.title, style]}>{children}</Text>
);

export const Subtitle = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[styles.subtitle, style]}>{children}</Text>
);

export const Body = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[styles.body, style]}>{children}</Text>
);

export const Caption = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[styles.caption, style]}>{children}</Text>
);

export const Eyebrow = ({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) => (
  <Text style={[styles.eyebrow, style]}>{children}</Text>
);

export const Badge = ({
  children,
  tone = "default",
  style,
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "moss" | "gold" | "danger" | "warning";
  style?: StyleProp<TextStyle>;
}) => {
  const toneStyles = {
    default: { backgroundColor: palette.border, color: palette.ink },
    accent: { backgroundColor: palette.accentLight, color: palette.accentDark },
    moss: { backgroundColor: palette.mossLight, color: palette.moss },
    gold: { backgroundColor: palette.goldLight, color: palette.leatherDeep },
    danger: { backgroundColor: palette.dangerLight, color: palette.danger },
    warning: { backgroundColor: palette.warningLight, color: palette.warning },
  };
  return (
    <Text style={[styles.badge, toneStyles[tone], style]}>{children}</Text>
  );
};

export const AppButton = ({
  children,
  onPress,
  variant = "primary",
  disabled = false,
  style,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) => {
  const variantStyles = {
    primary: {
      backgroundColor: palette.accent,
      borderColor: palette.accent,
      color: "#fff",
    },
    secondary: {
      backgroundColor: "transparent",
      borderColor: palette.border,
      color: palette.ink,
    },
    danger: {
      backgroundColor: palette.danger,
      borderColor: palette.danger,
      color: "#fff",
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      color: palette.accent,
    },
  };
  const v = disabled ? { ...variantStyles[variant], opacity: 0.5 } : variantStyles[variant];
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        v,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
        style,
      ]}
    >
      <Text style={[styles.buttonText, { color: v.color }]}>{children}</Text>
    </Pressable>
  );
};

export const EmptyState = ({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) => (
  <Card style={styles.emptyState}>
    <Text style={styles.emptyStateTitle}>{title}</Text>
    {detail && <Text style={styles.emptyStateDetail}>{detail}</Text>}
    {action && <View style={styles.emptyStateAction}>{action}</View>}
  </Card>
);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.paper,
    padding: space.md,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: palette.border,
    padding: space.md,
    ...shadow.sm,
  },
  title: {
    color: palette.ink,
    fontFamily: "serif",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  subtitle: {
    color: palette.ink,
    fontFamily: "serif",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  body: {
    color: palette.ink,
    fontSize: 16,
    lineHeight: 24,
  },
  caption: {
    color: palette.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  eyebrow: {
    color: palette.accent,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  badge: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: space.xs,
    paddingVertical: 2,
    borderRadius: radius.full,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  button: {
    borderWidth: 1,
    borderRadius: radius.medium,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: space.xs,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    padding: space.xl,
    gap: space.md,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.ink,
  },
  emptyStateDetail: {
    color: palette.muted,
    textAlign: "center",
  },
  emptyStateAction: {
    marginTop: space.md,
  },
});

import { Pressable } from "react-native";
