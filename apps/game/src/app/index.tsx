import React from "react";
import { router, type Href } from "expo-router";
import { StyleSheet, Text, View, Animated, Easing, Dimensions } from "react-native";
import { BookCover } from "../cover-image";
import { useGame } from "../game-store";
import { getPlayableBookContent } from "../catalog";
import { playTarget } from "../auth-routing";
import { useSession } from "../session-store";
import {
  AppButton,
  Badge,
  Body,
  Caption,
  Eyebrow,
  Heading1,
  Heading2,
  Screen,
  Title,
  palette,
  radius,
  space,
} from "../ui";
import { copy } from "../copy";
import { HeroBookIllustration, StepIllustration, FloatingDecorations } from "../illustrations";

export default function Home() {
  const { playableBooks } = useGame();
  const { status } = useSession();
  const { width: screenWidth } = Dimensions.get("window");
  const isMobile = screenWidth < 760;

  const publishedBooks = playableBooks.filter((book) => book.status === "published" || book.status === "ready");

  // eslint-disable-next-line react-hooks/refs
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  // eslint-disable-next-line react-hooks/refs
  const slideAnim = React.useRef(new Animated.Value(40)).current;
  // eslint-disable-next-line react-hooks/refs
  const bookAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(bookAnim, {
        toValue: 1,
        duration: 900,
        delay: 200,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/refs
  const bookScale = bookAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  return (
    <Screen style={s.page}>
      <FloatingDecorations width={screenWidth} height={isMobile ? 700 : 500} />
      {/* Hero Section */}
      <View style={s.hero}>
        {/* eslint-disable react-hooks/refs */}
        <Animated.View
          style={[
            s.heroContent,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Eyebrow style={s.heroEyebrow}>{copy.landing.eyebrow}</Eyebrow>
          <Heading1 style={s.heroHeadline}>
            {copy.landing.headline}
          </Heading1>
          <Body style={s.heroSubhead}>{copy.landing.subhead}</Body>
          <View style={s.heroActions}>
            <AppButton
              size="lg"
              tone="primary"
              onPress={() => router.push(playTarget(status) as Href)}
              accessibilityLabel={status === "signed-in" ? copy.landing.playNow : copy.landing.createAccountToPlay}
            >
              {status === "signed-in" ? copy.landing.playNow : copy.landing.createAccountAndPlay}
            </AppButton>
            <AppButton
              size="lg"
              tone="outline"
              onPress={() => router.push("/how-to-play" as Href)}
            >
              {copy.nav.howToPlay}
            </AppButton>
          </View>
          <View style={s.heroBadges}>
            <Badge tone="forest">{copy.home.twoPlayers}</Badge>
            <Badge tone="sky">{copy.home.illustratedBooks}</Badge>
            <Badge tone="sunshine">{copy.landing.rounds}</Badge>
            {status === "signed-in" ? (
              <Badge tone="mint">{copy.landing.signedIn}</Badge>
            ) : (
              <Badge tone="coral">{copy.landing.freeToStart}</Badge>
            )}
          </View>
        </Animated.View>

        {/* eslint-disable react-hooks/refs */}
        <Animated.View
          style={[
            s.heroIllustration,
            {
              opacity: bookAnim,
              transform: [{ scale: bookScale }],
            },
          ]}
        >
          <HeroBookIllustration
            width={isMobile ? 340 : 420}
            height={isMobile ? 280 : 340}
          />
          <View style={s.heroIllustrationCaption}>
            <Text style={s.captionText}>{copy.landing.leftPageCaption}</Text>
            <Text style={s.captionText}>{copy.landing.rightPageCaption}</Text>
          </View>
        </Animated.View>
      </View>

      {/* How It Works Section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Eyebrow>{copy.landing.howItWorks}</Eyebrow>
          <Heading2 style={s.sectionTitle}>{copy.landing.threeSteps}</Heading2>
        </View>
        <View style={s.stepsContainer}>
          {[
            {
              number: "1",
              title: copy.landing.chooseBookTitle,
              description: copy.landing.chooseBookDetail,
              illustration: <StepIllustration step={1} size={100} />,
            },
            {
              number: "2",
              title: copy.landing.countPeopleTitle,
              description: copy.landing.countPeopleDetail,
              illustration: <StepIllustration step={2} size={100} />,
            },
            {
              number: "3",
              title: copy.landing.winRoundTitle,
              description: copy.landing.winRoundDetail,
              illustration: <StepIllustration step={3} size={100} />,
            },
          ].map((step, index) => (
            <View key={step.number} style={s.stepCard}>
              <View style={s.stepNumberCircle}>
                <Text style={s.stepNumber}>{step.number}</Text>
              </View>
              <View style={s.stepIllustrationWrapper}>
                {step.illustration}
              </View>
              <Title style={s.stepTitle}>{step.title}</Title>
              <Body style={s.stepDescription}>{step.description}</Body>
            </View>
          ))}
        </View>
      </View>

      {/* Tagline Reveal Section */}
      <View style={s.taglineSection}>
        <Heading2 style={s.taglineText}>
          {copy.landing.tagline}
        </Heading2>
      </View>

      {/* Discover Books Section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Eyebrow>{copy.landing.discoverBooks}</Eyebrow>
          <Heading2 style={s.sectionTitle}>{copy.landing.booksReady}</Heading2>
        </View>
        <View style={s.booksGrid}>
          {publishedBooks.length > 0 ? (
            publishedBooks.map((book) => {
              const content = getPlayableBookContent(book);
              const spreadsReady = content?.spreads?.filter((sp) => !sp?.flags?.includes("excluded")).length ?? 0;
              return (
                <View
                  key={book.id}
                  style={s.bookCard}
                >
                  <View style={s.bookCoverWrapper}>
                    {content ? (
                      <BookCover book={content} style={s.bookCover} />
                    ) : (
                      <View style={s.bookCoverFallback}>
                        <Text style={s.bookCoverLetter}>{book.title.slice(0, 1)}</Text>
                      </View>
                    )}
                    <View style={s.bookBadge}>
                      <Badge tone="forest" style={s.readyBadge}>{copy.landing.spreads(spreadsReady)}</Badge>
                    </View>
                  </View>
                  <View style={s.bookInfo}>
                    <Title style={s.bookTitle} numberOfLines={2}>{book.title}</Title>
                    {book.author && (
                      <Caption style={s.bookAuthor}>{copy.landing.byAuthor(book.author)}</Caption>
                    )}
                    <View style={s.bookMeta}>
                      <Badge tone="neutral" style={s.languageBadge}>{copy.landing.languageName(book.language)}</Badge>
                      <Badge tone="sky" style={s.statusBadge}>{book.status === "published" ? copy.landing.published : copy.books.ready}</Badge>
                    </View>
                  </View>
                  <AppButton
                    tone="ghost"
                    size="sm"
                    style={s.chooseButton}
                    onPress={() => router.push("/books" as Href)}
                  >
                    {copy.books.choose}
                  </AppButton>
                </View>
              );
            })
          ) : (
            <View style={s.emptyBooks}>
              <Caption>{copy.books.loading}</Caption>
              <AppButton
                tone="primary"
                size="sm"
                onPress={() => router.push("/books" as Href)}
              >
                {copy.actions.browseBooks}
              </AppButton>
            </View>
          )}
        </View>
      </View>

      <View style={s.simpleFooter}>
        <Text style={s.footerLogo}>{copy.brand}</Text>
        <Caption style={s.footerTagline}>{copy.landing.footerTagline}</Caption>
        <Caption style={s.footerCopyright}>{copy.landing.copyright}</Caption>
      </View>

    </Screen>
  );
}

const s = StyleSheet.create({
  page: { flexGrow: 1, backgroundColor: palette.canvas },

  // Hero Section
  hero: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space[500],
    paddingHorizontal: space[400],
    paddingVertical: space[600],
    minHeight: 500,
  },
  heroContent: { flex: 1, minWidth: 300, maxWidth: 580, gap: space[300] },
  heroEyebrow: { color: palette.forest },
  heroHeadline: {
    maxWidth: 680,
    fontSize: 60,
    lineHeight: 66,
    color: palette.ink,
    fontWeight: "600",
    letterSpacing: -1.5,
  },
  heroHighlight: { color: palette.accent },
  heroSubhead: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 540,
    color: palette.muted,
  },
  heroActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[200],
    marginTop: space[100],
  },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space[100],
    marginTop: space[200],
  },
  heroIllustration: {
    flex: 1,
    minWidth: 280,
    maxWidth: 480,
    alignItems: "center",
    gap: space[200],
  },
  heroIllustrationCaption: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space[300],
  },
  captionText: {
    fontSize: 12,
    color: palette.muted,
    fontWeight: "600",
  },

  // Section common
  section: {
    paddingHorizontal: space[400],
    paddingVertical: space[600],
    gap: space[400],
  },
  sectionHeader: { alignItems: "center", gap: space[100], maxWidth: 680, alignSelf: "center" },
  sectionTitle: { textAlign: "center", maxWidth: 680 },

  // Steps
  stepsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space[400],
    marginTop: space[200],
  },
  stepCard: {
    width: 280,
    maxWidth: "100%",
    alignItems: "center",
    gap: space[200],
    padding: space[300],
  },
  stepNumberCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: palette.accentLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space[100],
  },
  stepNumber: { color: palette.accentDark, fontSize: 20, fontWeight: "800", fontFamily: "serif" },
  stepIllustrationWrapper: { marginBottom: space[100] },
  stepTitle: { textAlign: "center", fontSize: 20 },
  stepDescription: { textAlign: "center", fontSize: 15, lineHeight: 23, color: palette.muted },

  // Tagline
  taglineSection: {
    paddingHorizontal: space[400],
    paddingVertical: space[700],
    backgroundColor: palette.paper,
    borderTopColor: palette.line,
    borderTopWidth: 1,
    borderBottomColor: palette.line,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  taglineText: {
    textAlign: "center",
    maxWidth: 680,
    fontSize: 48,
    lineHeight: 52,
    color: palette.ink,
    fontWeight: "600",
    letterSpacing: -1.2,
  },
  taglineHighlight: { color: palette.accent },

  // Books
  booksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space[300],
    marginTop: space[200],
  },
  bookCard: {
    width: 260,
    maxWidth: "100%",
    backgroundColor: palette.white,
    borderRadius: radius.large,
    borderColor: palette.line,
    borderWidth: 1,
    overflow: "hidden",
    gap: 0,
  },
  bookCoverWrapper: { position: "relative", height: 180 },
  bookCover: { width: "100%", height: "100%" },
  bookCoverFallback: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.plumLight,
    alignItems: "center",
    justifyContent: "center",
  },
  bookCoverLetter: { color: palette.paper, fontFamily: "serif", fontSize: 56, fontWeight: "700" },
  bookBadge: {
    position: "absolute",
    bottom: space[200],
    left: space[200],
    right: space[200],
  },
  readyBadge: { fontSize: 11 },
  bookInfo: { padding: space[200], gap: space[100] },
  bookTitle: { color: palette.ink, lineHeight: 26 },
  bookAuthor: { color: palette.muted },
  bookMeta: { flexDirection: "row", flexWrap: "wrap", gap: space[100], marginTop: space[100] },
  languageBadge: { fontSize: 10 },
  statusBadge: { fontSize: 10 },
  chooseButton: { margin: space[200], marginTop: 0, width: 228 },
  emptyBooks: { alignItems: "center", gap: space[200], padding: space[500] },

  // Benefits
  benefitsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space[300],
    marginTop: space[200],
  },
  benefitCard: {
    width: 280,
    maxWidth: "100%",
    alignItems: "center",
    gap: space[200],
    padding: space[400],
  },
  benefitIcon: { fontSize: 40, marginBottom: space[100] },
  benefitTitle: { textAlign: "center", fontSize: 20 },
  benefitDescription: { textAlign: "center", fontSize: 15, lineHeight: 23, color: palette.muted },

  // Final CTA
  finalCta: {
    paddingHorizontal: space[400],
    paddingVertical: space[700],
    backgroundColor: palette.forest,
    alignItems: "center",
    gap: space[300],
  },
  finalCtaEyebrow: { color: palette.sunshineLight },
  finalCtaTitle: {
    textAlign: "center",
    maxWidth: 680,
    fontSize: 48,
    lineHeight: 52,
    color: palette.white,
    fontWeight: "600",
    letterSpacing: -1.2,
  },
  finalCtaHighlight: { color: palette.sunshine },
  finalCtaButton: { minWidth: 280, backgroundColor: palette.sunshine, marginTop: space[100] },
  finalCtaNote: { textAlign: "center", maxWidth: 400, color: palette.forestLight },

  // Footer
  footer: {
    paddingHorizontal: space[400],
    paddingVertical: space[500],
    backgroundColor: palette.paper,
    borderTopColor: palette.line,
    borderTopWidth: 1,
    gap: space[400],
  },
  footerBrand: { alignItems: "center", gap: space[100] },
  footerLogo: { color: palette.ink, fontFamily: "serif", fontSize: 28, fontWeight: "800" },
  footerTagline: { color: palette.muted },
  footerLinks: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space[300],
  },
  footerLink: { paddingVertical: space[50] },
  footerCopyright: {
    textAlign: "center",
    color: palette.muted,
    marginTop: space[200],
  },
  simpleFooter: {
    alignItems: "center",
    borderTopColor: palette.line,
    borderTopWidth: 1,
    gap: space[75],
    paddingBottom: space[300],
    paddingTop: space[300],
  },
});
