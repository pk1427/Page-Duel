import { Modal, Pressable, StyleSheet, View } from "react-native";
import { AppButton, Card, Title, Body, palette, space } from "./ui";
import { copy } from "./copy";

export function ExitMatchDialog({
  visible,
  onStay,
  onExit,
}: {
  visible: boolean;
  onStay: () => void;
  onExit: () => void;
}) {
  return (
    <Modal
      accessibilityViewIsModal
      animationType="fade"
      onRequestClose={onStay}
      transparent
      visible={visible}
    >
      <View style={styles.backdrop}>
        <Pressable
          accessibilityLabel={copy.exit.dismiss}
          accessibilityRole="button"
          onPress={onStay}
          style={styles.backdropPress}
        />
        <Card accessibilityLiveRegion="polite" accessibilityRole="alert" style={styles.card}>
          <Title style={styles.title}>{copy.exit.title}</Title>
          <Body>{copy.exit.detail}</Body>
          <View style={styles.actions}>
            <AppButton accessibilityLabel={copy.actions.stayInMatch} onPress={onStay}>
              {copy.actions.stayInMatch}
            </AppButton>
            <AppButton
              accessibilityLabel={copy.actions.exitMatch}
              onPress={onExit}
              style={styles.exitButton}
            >
              {copy.actions.exitMatch}
            </AppButton>
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: "center",
    backgroundColor: "rgba(41, 34, 29, 0.55)",
    flex: 1,
    justifyContent: "center",
    padding: space.md,
  },
  backdropPress: {
    height: "100%",
    position: "absolute",
    width: "100%",
  },
  card: {
    borderColor: palette.leather,
    borderWidth: 2,
    gap: space.sm,
    maxWidth: 440,
    width: "100%",
  },
  title: { fontSize: 28, lineHeight: 32 },
  actions: { gap: space.xs },
  exitButton: {
    backgroundColor: palette.danger,
    borderBottomColor: "#7A2C23",
    borderBottomWidth: 3,
  },
});
