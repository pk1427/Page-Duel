import { useState } from "react";
import { Image } from "expo-image";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { BookContent } from "@book-people/book-data";
import { resolveContentAsset } from "./content-assets";
import { palette, radius } from "./ui";

/** Resolve a book's cover to a remote URL, or null for the generated Practice Book. */
function coverUri(book: BookContent): string | null {
  if (!book.coverImage || book.coverImage.startsWith("placeholder:")) return null;
  return resolveContentAsset(book, { image: book.coverImage }) ?? null;
}

function FallbackCover({ title, style }: { title: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.fallback, style]}>
      <Text style={styles.fallbackLetter}>{title.slice(0, 1)}</Text>
    </View>
  );
}

/** Book cover with a graceful initial-letter fallback while loading or when unavailable. */
export function BookCover({ book, style }: { book: BookContent; style?: StyleProp<ViewStyle> }) {
  const [failed, setFailed] = useState(false);
  const uri = coverUri(book);
  if (!uri || failed) return <FallbackCover title={book.title} style={style} />;
  return (
    <View style={[styles.frame, style]}>
      <Image
        accessibilityLabel={`${book.title} cover`}
        source={{ uri }}
        contentFit="cover"
        transition={200}
        onError={() => setFailed(true)}
        style={styles.image}
      />
    </View>
  );
}

function UnavailablePage({ label, detail }: { label: string; detail?: string }) {
  return (
    <View style={styles.unavailable}>
      <Text style={styles.unavailableTitle}>Page image unavailable</Text>
      <Text style={styles.unavailableCopy}>{label}</Text>
      {__DEV__ && detail ? <Text style={styles.unavailableDetail}>{detail}</Text> : null}
    </View>
  );
}

/**
 * A scanned spread page. Shows a paper loading surface, then the image;
 * falls back to an explicit message when the asset cannot load.
 * `recyclingKey` must change per spread so a previous round's image never lingers.
 */
export function SpreadPageImage({
  book,
  image,
  label,
  recyclingKey,
  style,
}: {
  book: BookContent;
  image: string;
  label: string;
  recyclingKey: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [failed, setFailed] = useState(false);
  if (image.startsWith("placeholder:")) return null;
  // Resolved once so the dev fallback can report the exact failing URL.
  // Asset URLs never carry credentials, so logging them is safe.
  const uri = resolveContentAsset(book, { image });
  if (!uri || failed) return <UnavailablePage label={label} detail={uri} />;
  return (
    <View style={[styles.pageSurface, style]}>
      <Image
        accessibilityLabel={label}
        source={{ uri }}
        contentFit="contain"
        transition={150}
        recyclingKey={recyclingKey}
        onError={() => setFailed(true)}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: palette.leatherDeep,
    borderRadius: radius.small,
    overflow: "hidden",
  },
  image: { height: "100%", width: "100%" },
  fallback: {
    alignItems: "center",
    backgroundColor: palette.plum,
    borderRadius: radius.small,
    justifyContent: "center",
    overflow: "hidden",
  },
  fallbackLetter: {
    color: palette.paper,
    fontFamily: "serif",
    fontSize: 40,
    fontWeight: "700",
  },
  pageSurface: { backgroundColor: palette.paper },
  unavailable: {
    alignItems: "center",
    flexGrow: 1,
    gap: 4,
    justifyContent: "center",
    minHeight: 180,
    padding: 12,
  },
  unavailableTitle: { color: palette.ink, fontSize: 15, fontWeight: "800", textAlign: "center" },
  unavailableCopy: { color: palette.muted, fontSize: 13, textAlign: "center" },
  unavailableDetail: {
    color: palette.muted,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
});
