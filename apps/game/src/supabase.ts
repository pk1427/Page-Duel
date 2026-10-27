import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const stagingMode = process.env.EXPO_PUBLIC_STAGING_MODE === "true";
const supabaseUrl = stagingMode
  ? process.env.EXPO_PUBLIC_STAGING_SUPABASE_URL
  : process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = stagingMode
  ? process.env.EXPO_PUBLIC_STAGING_SUPABASE_ANON_KEY
  : process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** False when no backend is configured; auth screens explain the limitation. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function hostnameFor(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/** Development-only UI guard: a staging launch must never bundle the local Supabase host. */
export const hasWrongStagingEnvironment =
  stagingMode && ["127.0.0.1", "localhost"].includes(hostnameFor(supabaseUrl) ?? "");

type AuthStorage = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const webStorage: AuthStorage = {
  getItem: async (key) => window.localStorage.getItem(key),
  setItem: async (key, value) => {
    window.localStorage.setItem(key, value);
  },
  removeItem: async (key) => {
    window.localStorage.removeItem(key);
  },
};

/**
 * Native session storage. SecureStore values can be rejected by the OS when
 * they grow large, so every operation falls back to process memory: auth keeps
 * working (losing restart persistence) instead of crashing sign-in.
 */
function createNativeStorage(): AuthStorage {
  const memory = new Map<string, string>();
  return {
    getItem: async (key) => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return memory.get(key) ?? null;
      }
    },
    setItem: async (key, value) => {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {
        memory.set(key, value);
      }
    },
    removeItem: async (key) => {
      memory.delete(key);
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // Already cleared from the fallback; nothing left to do.
      }
    },
  };
}

let client: SupabaseClient | null = null;

/** Null when unconfigured. Never holds a secret/service-role key (anon key only). */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        storage: Platform.OS === "web" ? webStorage : createNativeStorage(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: Platform.OS === "web",
      },
    });
  }
  return client;
}
