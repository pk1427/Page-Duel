// Mock React Native and Expo modules for Node.js test environment
import { vi } from "vitest";

// Mock react-native
vi.mock("react-native", () => ({
  Platform: { OS: "web" },
}));

// Mock expo-secure-store
vi.mock("expo-secure-store", () => ({
  getItemAsync: vi.fn().mockResolvedValue(null),
  setItemAsync: vi.fn().mockResolvedValue(undefined),
  deleteItemAsync: vi.fn().mockResolvedValue(undefined),
}));

// Mock react-native-url-polyfill/auto
vi.mock("react-native-url-polyfill/auto", () => ({ default: {} }));

// Mock the copy module to return English strings
vi.mock("../src/copy", () => ({
  copy: {
    auth: {
      invalidCredentials: "Those sign-in details did not match. Check them and try again.",
      accountExists: "That email already has an account. Sign in instead.",
      invalidEmail: "Enter a valid email address, then try again.",
      weakPassword: "Choose a stronger password, then try again.",
      passwordTooShort: (min: number) => `Use a password with at least ${min} characters, then try again.`,
      rateLimited: "Too many requests. Wait a little while, then try again.",
      confirmationSent: "Account created. Check your email for the confirmation link, then sign in.",
      noConnection: "We could not connect. Check your internet connection, then try again.",
      genericRetry: "We could not complete that request. Try again.",
    },
    profile: {
      displayNameRequired: "Enter a display name, then try again.",
      displayNameLength: "Use a display name with 1 to 40 characters, then try again.",
    },
    result: {
      reasonRoundWins: "round wins",
      reasonPeopleTotal: "people total",
      reasonSuddenDeath: "sudden death",
      reasonDraw: "The match ended in a draw.",
    },
  },
}));