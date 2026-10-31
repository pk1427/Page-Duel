import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { copy as english, people as englishPeople, personLabel as englishPersonLabel, roundWins as englishRoundWins } from "./en";
import { hi } from "./hi";
import { mr } from "./mr";

export type AppLanguage = "en" | "hi" | "mr";
export type BookshelfLanguage = AppLanguage | "all";

type Widen<T> = T extends (...args: infer Args) => infer Result
  ? (...args: Args) => Widen<Result>
  : T extends string
    ? string
    : T extends number
      ? number
      : T extends boolean
        ? boolean
  : T extends object
    ? { [Key in keyof T]: Widen<T[Key]> }
    : T;

/** Every locale must implement the English source-copy shape. */
export type Copy = Widen<typeof english>;

export const dictionaries: Record<AppLanguage, Copy> = { en: english, hi, mr };

export const languageOptions: readonly { value: AppLanguage; label: string }[] = [
  { value: "en", label: english.language.english },
  { value: "hi", label: english.language.hindi },
  { value: "mr", label: english.language.marathi },
];

const storageKey = "book-people.interface-language";
let activeLanguage: AppLanguage = "en";

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === "en" || value === "hi" || value === "mr";
}

export function getCopy(language: AppLanguage = activeLanguage): Copy {
  return dictionaries[language];
}

async function readStoredLanguage(): Promise<AppLanguage> {
  try {
    const value =
      Platform.OS === "web"
        ? typeof window === "undefined"
          ? null
          : window.localStorage.getItem(storageKey)
        : await SecureStore.getItemAsync(storageKey);
    return isAppLanguage(value) ? value : "en";
  } catch {
    return "en";
  }
}

async function persistLanguage(language: AppLanguage): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined") window.localStorage.setItem(storageKey, language);
      return;
    }
    await SecureStore.setItemAsync(storageKey, language);
  } catch {
    // A language preference is optional. Keep the active in-memory preference.
  }
}

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>("en");

  useEffect(() => {
    void readStoredLanguage().then((stored) => {
      activeLanguage = stored;
      setLanguageState(stored);
    });
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    activeLanguage = nextLanguage;
    setLanguageState(nextLanguage);
    void persistLanguage(nextLanguage);
  }, []);

  const value = useMemo(() => ({ language, setLanguage }), [language, setLanguage]);
  return createElement(LanguageContext.Provider, { value }, children);
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("Language provider is missing");
  return context;
}

/**
 * Existing screens read `copy.section.key`. The proxy keeps that API while
 * returning the current locale after a language switch.
 */
export const copy = new Proxy(english as Copy, {
  get(_target, property) {
    return Reflect.get(getCopy(), property);
  },
}) as Copy;

export function people(count: number): string {
  return activeLanguage === "en" ? englishPeople(count) : `${count} ${getCopy().game.people}`;
}

export function personLabel(count: number): string {
  return activeLanguage === "en" ? englishPersonLabel(count) : getCopy().game.people;
}

export function roundWins(count: number): string {
  return activeLanguage === "en"
    ? englishRoundWins(count)
    : `${count} ${getCopy().result.reasonRoundWins}`;
}
